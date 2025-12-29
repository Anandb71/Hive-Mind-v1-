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
import './IDE.css';

export function IDE() {
	const { serverUrl, setFiles, session, chatOpen } = useStore();
	const [terminalOpen, setTerminalOpen] = useState(true);

	useEffect(() => {
		loadProjects();
	}, [serverUrl]);

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
		</div>
	);
}
