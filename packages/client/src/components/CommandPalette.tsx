/**
 * Command Palette Component
 * VS Code-style command palette with fuzzy search
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Command, X } from 'lucide-react';
import { useStore } from '../store';

interface CommandItem {
	id: string;
	name: string;
	description?: string;
	shortcut?: string;
	category: string;
	action: () => void;
}

interface CommandPaletteProps {
	commands: CommandItem[];
}

export function CommandPalette({ commands }: CommandPaletteProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				setOpen(true);
			}
			if (e.key === 'Escape') {
				setOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
			setQuery('');
			setSelectedIndex(0);
		}
	}, [open]);

	const filteredCommands = useMemo(() => {
		if (!query.trim()) return commands;

		const lowerQuery = query.toLowerCase();
		return commands
			.filter(cmd =>
				cmd.name.toLowerCase().includes(lowerQuery) ||
				cmd.category.toLowerCase().includes(lowerQuery) ||
				(cmd.description?.toLowerCase().includes(lowerQuery))
			)
			.sort((a, b) => {
				const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
				const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
				if (aStarts && !bStarts) return -1;
				if (!aStarts && bStarts) return 1;
				return 0;
			});
	}, [commands, query]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
			executeCommand(filteredCommands[selectedIndex]);
		}
	};

	const executeCommand = (cmd: CommandItem) => {
		setOpen(false);
		cmd.action();
	};

	const groupedCommands = useMemo(() => {
		const groups: Record<string, CommandItem[]> = {};
		for (const cmd of filteredCommands) {
			if (!groups[cmd.category]) groups[cmd.category] = [];
			groups[cmd.category].push(cmd);
		}
		return groups;
	}, [filteredCommands]);

	if (!open) return null;

	return (
		<div className="command-palette-overlay" onClick={() => setOpen(false)}>
			<div className="command-palette" onClick={e => e.stopPropagation()}>
				<div className="command-header">
					<Command size={16} />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
						onKeyDown={handleKeyDown}
						placeholder="Type a command..."
					/>
					<button onClick={() => setOpen(false)}>
						<X size={16} />
					</button>
				</div>

				<div className="command-list">
					{filteredCommands.length === 0 && (
						<div className="command-empty">No commands found</div>
					)}

					{Object.entries(groupedCommands).map(([category, cmds]) => (
						<div key={category} className="command-group">
							<div className="command-category">{category}</div>
							{cmds.map((cmd, i) => {
								const globalIndex = filteredCommands.indexOf(cmd);
								return (
									<div
										key={cmd.id}
										className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
										onClick={() => executeCommand(cmd)}
									>
										<div className="command-info">
											<span className="command-name">{cmd.name}</span>
											{cmd.description && (
												<span className="command-desc">{cmd.description}</span>
											)}
										</div>
										{cmd.shortcut && (
											<span className="command-shortcut">{cmd.shortcut}</span>
										)}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function useCommandPalette() {
	const { setSidebarPanel, toggleChat } = useStore();

	const defaultCommands: CommandItem[] = [
		{ id: 'files', name: 'Show Explorer', category: 'View', shortcut: 'Ctrl+Shift+E', action: () => setSidebarPanel('files') },
		{ id: 'agents', name: 'Show AI Agents', category: 'View', action: () => setSidebarPanel('agents') },
		{ id: 'git', name: 'Show Source Control', category: 'View', shortcut: 'Ctrl+Shift+G', action: () => setSidebarPanel('git') },
		{ id: 'settings', name: 'Open Settings', category: 'Preferences', shortcut: 'Ctrl+,', action: () => setSidebarPanel('settings') },
		{ id: 'chat', name: 'Toggle Chat Panel', category: 'View', action: () => toggleChat() },
		{ id: 'theme', name: 'Change Theme', category: 'Preferences', action: () => setSidebarPanel('settings') },
		{ id: 'reload', name: 'Reload Window', category: 'Developer', action: () => window.location.reload() }
	];

	return defaultCommands;
}
