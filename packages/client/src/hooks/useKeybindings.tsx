/**
 * Keybindings Manager
 * Configurable keyboard shortcuts for IDE actions
 */

import { useEffect, useCallback } from 'react';
import { useStore } from '../store';

interface Keybinding {
	id: string;
	name: string;
	keys: string[];
	action: () => void;
}

const DEFAULT_KEYBINDINGS = [
	{ id: 'save', name: 'Save File', keys: ['Ctrl', 'S'] },
	{ id: 'search', name: 'Quick Search', keys: ['Ctrl', 'P'] },
	{ id: 'find', name: 'Find in File', keys: ['Ctrl', 'F'] },
	{ id: 'replace', name: 'Find & Replace', keys: ['Ctrl', 'H'] },
	{ id: 'terminal', name: 'Toggle Terminal', keys: ['Ctrl', '`'] },
	{ id: 'sidebar', name: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
	{ id: 'palette', name: 'Command Palette', keys: ['Ctrl', 'Shift', 'P'] },
	{ id: 'newFile', name: 'New File', keys: ['Ctrl', 'N'] },
	{ id: 'closeTab', name: 'Close Tab', keys: ['Ctrl', 'W'] },
	{ id: 'undo', name: 'Undo', keys: ['Ctrl', 'Z'] },
	{ id: 'redo', name: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
	{ id: 'format', name: 'Format Document', keys: ['Shift', 'Alt', 'F'] },
	{ id: 'comment', name: 'Toggle Comment', keys: ['Ctrl', '/'] },
	{ id: 'duplicate', name: 'Duplicate Line', keys: ['Shift', 'Alt', 'Down'] },
	{ id: 'moveLine', name: 'Move Line Up', keys: ['Alt', 'Up'] }
];

export function useKeybindings(actions: Record<string, () => void>) {
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		const pressed: string[] = [];

		if (e.ctrlKey || e.metaKey) pressed.push('Ctrl');
		if (e.shiftKey) pressed.push('Shift');
		if (e.altKey) pressed.push('Alt');

		const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
		if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
			pressed.push(key);
		}

		for (const binding of DEFAULT_KEYBINDINGS) {
			const matches = binding.keys.length === pressed.length &&
				binding.keys.every(k => pressed.includes(k));

			if (matches && actions[binding.id]) {
				e.preventDefault();
				actions[binding.id]();
				return;
			}
		}
	}, [actions]);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);
}

export function KeybindingsPanel() {
	return (
		<div className="keybindings-panel">
			<div className="section-title">⌨️ Keyboard Shortcuts</div>
			<div className="keybindings-list">
				{DEFAULT_KEYBINDINGS.map(binding => (
					<div key={binding.id} className="keybinding-row">
						<span className="keybinding-name">{binding.name}</span>
						<div className="keybinding-keys">
							{binding.keys.map((key, i) => (
								<span key={i}>
									<kbd>{key}</kbd>
									{i < binding.keys.length - 1 && ' + '}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export { DEFAULT_KEYBINDINGS };
