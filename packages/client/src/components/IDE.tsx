/**
 * Main IDE Component
 * Combines Sidebar + Editor + Terminal
 */

import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { Terminal } from './Terminal';
import { Chat } from './Chat';
import { QuickOpen } from './QuickOpen';
import './IDE.css';

export function IDE() {
	const { serverUrl, setFiles, chatOpen } = useStore();
	const [terminalOpen, setTerminalOpen] = useState(true);
	const [quickOpenOpen, setQuickOpenOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	useEffect(() => {
		loadProjects();
	}, [serverUrl]);

	// Global keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl+P - Quick Open
			if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
				e.preventDefault();
				setQuickOpenOpen(true);
			}
			// Ctrl+/ - Shortcuts Panel
			if ((e.ctrlKey || e.metaKey) && e.key === '/') {
				e.preventDefault();
				setShortcutsOpen(s => !s);
			}
			// Ctrl+` - Toggle Terminal
			if ((e.ctrlKey || e.metaKey) && e.key === '`') {
				e.preventDefault();
				setTerminalOpen(t => !t);
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	const loadProjects = async () => {
		try {
			const res = await fetch(`${serverUrl}/api/files/projects`);
			const projects = await res.json();

			if (projects.length === 0) {
				await fetch(`${serverUrl}/api/files/projects`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: 'my-project' })
				});
				loadProjects();
				return;
			}

			const treeRes = await fetch(`${serverUrl}/api/files/tree/${projects[0].name}`);
			const tree = await treeRes.json();
			setFiles(tree);
		} catch (err) {
			console.error('Failed to load projects:', err);
		}
	};

	return (
		<div className="ide">
			<Sidebar onToggleTerminal={() => setTerminalOpen(!terminalOpen)} />
			<div className="ide-main">
				<Editor />
				{terminalOpen && <Terminal />}
			</div>
			{chatOpen && <Chat />}

			<QuickOpen isOpen={quickOpenOpen} onClose={() => setQuickOpenOpen(false)} />

			{shortcutsOpen && (
				<div className="shortcuts-overlay" onClick={() => setShortcutsOpen(false)}>
					<div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
						<h2>⌨️ Keyboard Shortcuts</h2>
						<div className="shortcuts-section">
							<h3>General</h3>
							<div className="shortcut-row">
								<span className="shortcut-desc">Quick Open</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">P</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Show Shortcuts</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">/</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Toggle Terminal</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">`</span></div>
							</div>
						</div>
						<div className="shortcuts-section">
							<h3>Editor</h3>
							<div className="shortcut-row">
								<span className="shortcut-desc">Save File</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">S</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Find</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">F</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Find & Replace</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">H</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Go to Line</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">G</span></div>
							</div>
							<div className="shortcut-row">
								<span className="shortcut-desc">Comment Line</span>
								<div className="shortcut-keys"><span className="shortcut-key">Ctrl</span><span className="shortcut-key">/</span></div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
