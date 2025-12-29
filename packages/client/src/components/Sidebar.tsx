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
	const { sidebarPanel, setSidebarPanel, files, activeFile, setActiveFile, session, budget, spent, toggleChat, serverUrl } = useStore();
	const [activeAgent, setActiveAgent] = useState<string | null>(null);
	const [agentInput, setAgentInput] = useState('');
	const [agentResponses, setAgentResponses] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState<string | null>(null);

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

	const renderFileTree = (nodes: any[], depth = 0) => {
		return nodes.map(node => (
			<div key={node.path}>
				<div
					className={`file-item ${node.type === 'directory' ? 'directory' : ''} ${activeFile === node.path ? 'active' : ''}`}
					style={{ paddingLeft: 12 + depth * 12 }}
					onClick={() => node.type === 'file' && setActiveFile(node.path)}
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
							<div className="section-title">Explorer</div>
							{files.length > 0 ? renderFileTree(files) : (
								<div className="empty-message">No files yet. Create a project to get started.</div>
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
		</div>
	);
}
