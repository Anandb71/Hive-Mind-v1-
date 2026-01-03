import { useState } from 'react';
import { Bug, Flame, FolderOpen, Settings, MessageCircle, Send, GitBranch, Terminal } from 'lucide-react';
import { useStore } from '../store';
import { GitPanel } from './GitPanel';
import { ApiKeySettings } from './ApiKeySettings';

const AGENTS = [
	{ id: 'architect', name: 'The Architect', emoji: '🏛️', model: 'Claude 3.5' },
	{ id: 'devil', name: "Devil's Advocate", emoji: '😈', model: 'GPT-4o' },
	{ id: 'historian', name: 'The Historian', emoji: '📚', model: 'Gemini Pro' },
	{ id: 'scribe', name: 'The Scribe', emoji: '✍️', model: 'Mistral' },
	{ id: 'security', name: 'Security Guard', emoji: '🛡️', model: 'Claude' },
	{ id: 'intern', name: 'The Intern', emoji: '📝', model: 'DeepSeek' }
];

interface SidebarProps {
	onToggleTerminal?: () => void;
}

export function Sidebar({ onToggleTerminal }: SidebarProps) {
	const { sidebarPanel, setSidebarPanel, files, setFiles, activeFile, openTab, session, budget, spent, toggleChat, serverUrl } = useStore();
	const [activeAgent, setActiveAgent] = useState<string | null>(null);
	const [agentInput, setAgentInput] = useState('');
	const [agentResponses, setAgentResponses] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState<string | null>(null);
	const [showCreateDialog, setShowCreateDialog] = useState<'file' | 'folder' | null>(null);
	const [newFileName, setNewFileName] = useState('');
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; type: string } | null>(null);
	const [renameTarget, setRenameTarget] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState('');

	const askAgent = async (agentId: string) => {
		if (!agentInput.trim()) return;
		setLoading(agentId);

		try {
			const res = await fetch(`${serverUrl}/api/agent/${agentId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: agentInput })
			});

			if (res.ok) {
				const data = await res.json();
				setAgentResponses(prev => ({ ...prev, [agentId]: data.content }));
			} else {
				// Fallback to mock response if no API keys
				const mockResponses: Record<string, string> = {
					architect: 'I recommend using the Observer pattern here for better decoupling.',
					devil: 'Edge cases: Network disconnect, race conditions, memory leaks.',
					historian: 'This was refactored in commit #abc123 to improve performance.',
					scribe: '/**\n * @function example\n * @param {string} input\n * @returns {void}\n */',
					security: '⚠️ Potential SQL injection in line 42. Use parameterized queries.',
					intern: '✅ Generated 5 unit tests for this function.'
				};
				setAgentResponses(prev => ({ ...prev, [agentId]: mockResponses[agentId] || 'Done!' }));
			}
		} catch {
			setAgentResponses(prev => ({ ...prev, [agentId]: 'Error: Could not reach server' }));
		}

		setAgentInput('');
		setLoading(null);
	};

	const getTemplateForExtension = (filename: string): string => {
		const ext = filename.split('.').pop()?.toLowerCase() || '';
		const name = filename.replace(/\.[^.]+$/, '');

		const templates: Record<string, string> = {
			py: `# ${filename}\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
			html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${name}</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n`,
			css: `/* ${filename} */\n\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n`,
			json: `{\n    "name": "${name}",\n    "version": "1.0.0"\n}\n`,
			md: `# ${name}\n\nDescription goes here.\n`,
			go: `// ${filename}\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
			rs: `// ${filename}\n\nfn main() {\n    println!("Hello, World!");\n}\n`,
			java: `// ${filename}\n\npublic class ${name} {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
			c: `// ${filename}\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
			cpp: `// ${filename}\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
			sh: `#!/bin/bash\n# ${filename}\n\necho "Hello, World!"\n`,
			sql: `-- ${filename}\n\nSELECT 'Hello, World!';\n`,
			yaml: `# ${filename}\n\nname: ${name}\nversion: 1.0.0\n`,
			yml: `# ${filename}\n\nname: ${name}\nversion: 1.0.0\n`,
			xml: `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${filename} -->\n<root>\n    <message>Hello, World!</message>\n</root>\n`,
		};

		return templates[ext] || `// ${filename}\n`;
	};

	const handleCreate = async () => {
		if (!newFileName.trim()) return;

		const projectName = 'my-project';

		try {
			let res;
			if (showCreateDialog === 'folder') {
				// Create folder by creating a placeholder file inside it
				res = await fetch(`${serverUrl}/api/files/create/${projectName}/${newFileName}/.gitkeep`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content: '' })
				});
			} else {
				// Create file with smart template
				const content = getTemplateForExtension(newFileName);
				res = await fetch(`${serverUrl}/api/files/create/${projectName}/${newFileName}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content })
				});
			}

			if (res.ok) {
				// Refresh file tree
				const treeRes = await fetch(`${serverUrl}/api/files/tree/${projectName}`);
				if (treeRes.ok) {
					const treeData = await treeRes.json();
					setFiles(treeData);
				}
				// Open the new file
				if (showCreateDialog === 'file') {
					openTab(newFileName);
				}
			} else {
				console.error('Create failed:', await res.text());
			}
		} catch (err) {
			console.error('Failed to create:', err);
		}

		setShowCreateDialog(null);
		setNewFileName('');
	};

	const refreshFiles = async () => {
		const treeRes = await fetch(`${serverUrl}/api/files/tree/my-project`);
		if (treeRes.ok) {
			const treeData = await treeRes.json();
			setFiles(treeData);
		}
	};

	const handleDelete = async (path: string) => {
		if (!confirm(`Delete "${path}"?`)) return;

		try {
			const res = await fetch(`${serverUrl}/api/files/delete/my-project/${path}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				await refreshFiles();
			}
		} catch (err) {
			console.error('Delete failed:', err);
		}
		setContextMenu(null);
	};

	const handleRename = async () => {
		if (!renameTarget || !renameValue.trim()) return;

		// Read old file content
		try {
			const readRes = await fetch(`${serverUrl}/api/files/content/my-project/${renameTarget}`);
			if (!readRes.ok) return;
			const { content } = await readRes.json();

			// Create new file with new name
			const dir = renameTarget.includes('/') ? renameTarget.substring(0, renameTarget.lastIndexOf('/') + 1) : '';
			const newPath = dir + renameValue;

			await fetch(`${serverUrl}/api/files/create/my-project/${newPath}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content })
			});

			// Delete old file
			await fetch(`${serverUrl}/api/files/delete/my-project/${renameTarget}`, {
				method: 'DELETE'
			});

			await refreshFiles();
		} catch (err) {
			console.error('Rename failed:', err);
		}

		setRenameTarget(null);
		setRenameValue('');
	};

	const handleContextMenu = (e: React.MouseEvent, path: string, type: string) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, path, type });
	};

	const renderFileTree = (nodes: any[], depth = 0) => {
		return nodes.map(node => (
			<div key={node.path}>
				<div
					className={`file-item ${node.type === 'directory' ? 'directory' : ''} ${activeFile === node.path ? 'active' : ''}`}
					style={{ paddingLeft: 12 + depth * 12 }}
					onClick={() => node.type === 'file' && openTab(node.path)}
					onContextMenu={(e) => handleContextMenu(e, node.path, node.type)}
				>
					{node.type === 'directory' ? '📁' : '📄'} {node.name}
				</div>
				{node.children && renderFileTree(node.children, depth + 1)}
			</div>
		));
	};

	return (
		<div className="sidebar">
			<div className="activity-bar">
				<div className={`activity-icon ${sidebarPanel === 'files' ? 'active' : ''}`} onClick={() => setSidebarPanel('files')} title="Explorer">
					<FolderOpen size={20} />
				</div>
				<div className={`activity-icon ${sidebarPanel === 'agents' ? 'active' : ''}`} onClick={() => setSidebarPanel('agents')} title="AI Agents">
					<Bug size={20} />
				</div>
				<div className={`activity-icon ${sidebarPanel === 'git' ? 'active' : ''}`} onClick={() => setSidebarPanel('git' as any)} title="Source Control">
					<GitBranch size={20} />
				</div>
				<div className={`activity-icon ${sidebarPanel === 'session' ? 'active' : ''}`} onClick={() => setSidebarPanel('session')} title="Session">
					<Flame size={20} />
				</div>
				<div className={`activity-icon ${sidebarPanel === 'settings' ? 'active' : ''}`} onClick={() => setSidebarPanel('settings')} title="Settings">
					<Settings size={20} />
				</div>
				<div className="activity-icon" style={{ marginTop: 'auto' }} onClick={onToggleTerminal} title="Toggle Terminal">
					<Terminal size={20} />
				</div>
				<div className="activity-icon" onClick={toggleChat} title="Chat">
					<MessageCircle size={20} />
				</div>
			</div>

			<div className="sidebar-content">
				<div className="sidebar-header">
					<span style={{ fontSize: 20 }}>🐝</span>
					<h2>HiveMind</h2>
					{session && <span className="live-badge">LIVE</span>}
				</div>

				<div className="panel-content">
					{sidebarPanel === 'files' && (
						<>
							<div className="section-title">
								Explorer
								<div className="explorer-actions">
									<button onClick={() => setShowCreateDialog('file')} title="New File">+📄</button>
									<button onClick={() => setShowCreateDialog('folder')} title="New Folder">+📁</button>
								</div>
							</div>
							{showCreateDialog && (
								<div className="create-dialog">
									<input
										type="text"
										placeholder={showCreateDialog === 'file' ? 'filename.ts' : 'folder-name'}
										value={newFileName}
										onChange={e => setNewFileName(e.target.value)}
										onKeyPress={e => e.key === 'Enter' && handleCreate()}
										autoFocus
									/>
									<button onClick={handleCreate}>Create</button>
									<button onClick={() => { setShowCreateDialog(null); setNewFileName(''); }}>Cancel</button>
								</div>
							)}
							{files.length > 0 ? renderFileTree(files) : (
								<div className="empty-message">No files yet. Click +📄 to create a file.</div>
							)}
						</>
					)}

					{sidebarPanel === 'agents' && (
						<>
							<div className="budget-card">
								<div className="budget-header">
									<span>Session Budget</span>
									<span className="budget-value">${(budget - spent).toFixed(2)}</span>
								</div>
								<div className="budget-bar">
									<div className="budget-fill" style={{ width: `${((budget - spent) / budget) * 100}%` }} />
								</div>
							</div>

							<div className="section-title">AI Agents ({AGENTS.length})</div>

							{AGENTS.map(agent => (
								<div
									key={agent.id}
									className={`agent-card ${activeAgent === agent.id ? 'active' : ''}`}
									onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
								>
									<div className="agent-header">
										<span className="agent-emoji">{agent.emoji}</span>
										<div className="agent-info">
											<div className="agent-name">{agent.name}</div>
											<div className="agent-model">{agent.model}</div>
										</div>
										<span className="agent-status">●</span>
									</div>

									{activeAgent === agent.id && (
										<div className="agent-body">
											<div className="agent-input-row">
												<input
													value={agentInput}
													onChange={e => setAgentInput(e.target.value)}
													placeholder={`Ask ${agent.name}...`}
													onKeyPress={e => e.key === 'Enter' && askAgent(agent.id)}
													onClick={e => e.stopPropagation()}
												/>
												<button onClick={(e) => { e.stopPropagation(); askAgent(agent.id); }} disabled={loading === agent.id}>
													{loading === agent.id ? <span className="spinner" /> : <Send size={16} />}
												</button>
											</div>
											{agentResponses[agent.id] && (
												<div className="agent-response">{agentResponses[agent.id]}</div>
											)}
										</div>
									)}
								</div>
							))}
						</>
					)}

					{sidebarPanel === 'git' && <GitPanel />}

					{sidebarPanel === 'session' && (
						<>
							<div className="session-card">
								<div className="section-title" style={{ padding: 0, marginBottom: 8 }}>Connection</div>
								<div className="stat-row">
									<span>Status</span>
									<span className="stat-value online">● Connected</span>
								</div>
								<div className="stat-row">
									<span>Server</span>
									<span className="stat-value server-url">{serverUrl}</span>
								</div>
								{session && (
									<div className="participants">
										{session.participants.map(p => (
											<div key={p.id} className="participant" style={{ background: p.color }}>
												{p.name[0]}
											</div>
										))}
									</div>
								)}
							</div>

							<button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(serverUrl)}>
								📋 Copy Server URL
							</button>
							<button className="btn btn-secondary" onClick={toggleChat}>
								💬 Open Chat
							</button>
						</>
					)}

					{sidebarPanel === 'settings' && <ApiKeySettings />}
				</div>
			</div>

			{contextMenu && (
				<div
					className="context-menu"
					style={{ top: contextMenu.y, left: contextMenu.x }}
					onClick={() => setContextMenu(null)}
				>
					<div className="context-menu-item" onClick={() => {
						setRenameTarget(contextMenu.path);
						setRenameValue(contextMenu.path.split('/').pop() || '');
						setContextMenu(null);
					}}>
						✏️ Rename
					</div>
					<div className="context-menu-item delete" onClick={() => handleDelete(contextMenu.path)}>
						🗑️ Delete
					</div>
				</div>
			)}

			{renameTarget && (
				<div className="rename-overlay" onClick={() => setRenameTarget(null)}>
					<div className="rename-dialog" onClick={e => e.stopPropagation()}>
						<h3>Rename</h3>
						<input
							value={renameValue}
							onChange={e => setRenameValue(e.target.value)}
							onKeyPress={e => e.key === 'Enter' && handleRename()}
							autoFocus
						/>
						<div className="rename-buttons">
							<button onClick={handleRename}>Rename</button>
							<button onClick={() => setRenameTarget(null)}>Cancel</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
