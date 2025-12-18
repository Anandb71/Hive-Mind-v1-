/**
 * HiveMind UI - Agent Hub Panel
 * Main panel showing all available agents
 */

import React from 'react';
import AgentPanel, { AgentInfo } from './AgentPanel';

const DEFAULT_AGENTS: AgentInfo[] = [
	{
		id: 'architect',
		name: 'The Architect',
		provider: 'Anthropic',
		model: 'Claude 3.5 Sonnet',
		status: 'idle',
		avatar: '🏛️',
		description: 'Maintains big picture. Prevents spaghetti code by suggesting proper structure.'
	},
	{
		id: 'devils-advocate',
		name: "The Devil's Advocate",
		provider: 'OpenAI',
		model: 'GPT-4o',
		status: 'idle',
		avatar: '😈',
		description: 'Chaos engineering. Actively tries to break your code logic.'
	},
	{
		id: 'historian',
		name: 'The Historian',
		provider: 'Google',
		model: 'Gemini Pro 1.5',
		status: 'idle',
		avatar: '📚',
		description: 'Remembers every commit and chat. Answers "Why did we do this?"'
	},
	{
		id: 'scribe',
		name: 'The Scribe',
		provider: 'Mistral',
		model: 'Mistral Small',
		status: 'idle',
		avatar: '✍️',
		description: 'Updates README and comments in real-time.'
	},
	{
		id: 'diplomat',
		name: 'The Diplomat',
		provider: 'DeepSeek',
		model: 'DeepSeek V3',
		status: 'idle',
		avatar: '🤝',
		description: 'Intelligently merges conflicting edits from multiple users.'
	},
	{
		id: 'designer',
		name: 'The Designer',
		provider: 'Google',
		model: 'Gemini Flash Vision',
		status: 'idle',
		avatar: '🎨',
		description: 'Renders pixel-previews of components in the gutter.'
	},
	{
		id: 'security-guard',
		name: 'The Security Guard',
		provider: 'Anthropic',
		model: 'Claude 3.5 Sonnet',
		status: 'idle',
		avatar: '🛡️',
		description: 'Checks for OWASP flaws and security vulnerabilities.'
	},
	{
		id: 'intern',
		name: 'The Intern',
		provider: 'DeepSeek',
		model: 'DeepSeek Coder',
		status: 'idle',
		avatar: '📝',
		description: 'Writes unit tests automatically for your code.'
	}
];

interface AgentHubPanelProps {
	onAgentAsk?: (agentId: string, prompt: string) => void;
}

export const AgentHubPanel: React.FC<AgentHubPanelProps> = ({ onAgentAsk }) => {
	const [agents, setAgents] = React.useState<AgentInfo[]>(DEFAULT_AGENTS);
	const [filter, setFilter] = React.useState('');

	const filteredAgents = agents.filter(a =>
		a.name.toLowerCase().includes(filter.toLowerCase()) ||
		a.description.toLowerCase().includes(filter.toLowerCase())
	);

	const handleAsk = (agentId: string, prompt: string) => {
		setAgents(prev => prev.map(a =>
			a.id === agentId ? { ...a, status: 'running' as const } : a
		));

		if (onAgentAsk) {
			onAgentAsk(agentId, prompt);
		}

		setTimeout(() => {
			setAgents(prev => prev.map(a =>
				a.id === agentId ? { ...a, status: 'idle' as const } : a
			));
		}, 2000);
	};

	return (
		<div className="agent-hub-panel" style={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			backgroundColor: 'var(--vscode-sideBar-background)',
			color: 'var(--vscode-foreground)'
		}}>
			<div className="panel-header" style={{
				padding: '12px',
				borderBottom: '1px solid var(--vscode-panel-border)',
				display: 'flex',
				alignItems: 'center',
				gap: '8px'
			}}>
				<span style={{ fontSize: '16px' }}>🐝</span>
				<h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
					Agent Hub
				</h2>
				<span style={{
					marginLeft: 'auto',
					fontSize: '12px',
					color: 'var(--vscode-descriptionForeground)'
				}}>
					{agents.length} agents
				</span>
			</div>

			<div className="search-bar" style={{ padding: '8px 12px' }}>
				<input
					type="text"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Search agents..."
					style={{
						width: '100%',
						padding: '6px 10px',
						backgroundColor: 'var(--vscode-input-background)',
						border: '1px solid var(--vscode-input-border)',
						borderRadius: '4px',
						color: 'var(--vscode-input-foreground)',
						fontSize: '13px'
					}}
				/>
			</div>

			<div className="agents-list" style={{
				flex: 1,
				overflowY: 'auto',
				padding: '8px 12px'
			}}>
				{filteredAgents.map(agent => (
					<AgentPanel
						key={agent.id}
						agent={agent}
						onAsk={handleAsk}
					/>
				))}
			</div>
		</div>
	);
};

export default AgentHubPanel;
