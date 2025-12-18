/**
 * HiveMind UI - Agent Panel Component
 * Displays an individual AI agent with status and actions
 */

import React from 'react';

export interface AgentInfo {
	id: string;
	name: string;
	provider: string;
	model: string;
	status: 'idle' | 'running' | 'error';
	avatar: string;
	description: string;
}

interface AgentPanelProps {
	agent: AgentInfo;
	onAsk: (agentId: string, prompt: string) => void;
	onRemove?: (agentId: string) => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ agent, onAsk, onRemove }) => {
	const [prompt, setPrompt] = React.useState('');
	const [expanded, setExpanded] = React.useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (prompt.trim()) {
			onAsk(agent.id, prompt);
			setPrompt('');
		}
	};

	const statusColors = {
		idle: '#4ECDC4',
		running: '#FFEAA7',
		error: '#FF6B6B'
	};

	return (
		<div className="agent-panel" style={{
			backgroundColor: 'var(--vscode-editor-background)',
			border: '1px solid var(--vscode-panel-border)',
			borderRadius: '8px',
			padding: '12px',
			marginBottom: '8px'
		}}>
			<div
				className="agent-header"
				onClick={() => setExpanded(!expanded)}
				style={{
					display: 'flex',
					alignItems: 'center',
					cursor: 'pointer',
					gap: '12px'
				}}
			>
				<div className="agent-avatar" style={{
					width: '40px',
					height: '40px',
					borderRadius: '50%',
					backgroundColor: statusColors[agent.status],
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '20px'
				}}>
					{agent.avatar}
				</div>

				<div className="agent-info" style={{ flex: 1 }}>
					<div className="agent-name" style={{
						fontWeight: 'bold',
						color: 'var(--vscode-foreground)'
					}}>
						{agent.name}
					</div>
					<div className="agent-model" style={{
						fontSize: '12px',
						color: 'var(--vscode-descriptionForeground)'
					}}>
						{agent.provider} / {agent.model}
					</div>
				</div>

				<div className="agent-status" style={{
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					backgroundColor: statusColors[agent.status]
				}} />
			</div>

			{expanded && (
				<div className="agent-body" style={{ marginTop: '12px' }}>
					<p style={{
						fontSize: '13px',
						color: 'var(--vscode-descriptionForeground)',
						marginBottom: '12px'
					}}>
						{agent.description}
					</p>

					<form onSubmit={handleSubmit}>
						<input
							type="text"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder={`Ask ${agent.name}...`}
							style={{
								width: '100%',
								padding: '8px 12px',
								backgroundColor: 'var(--vscode-input-background)',
								border: '1px solid var(--vscode-input-border)',
								borderRadius: '4px',
								color: 'var(--vscode-input-foreground)',
								fontSize: '13px'
							}}
						/>
					</form>

					{onRemove && (
						<button
							onClick={() => onRemove(agent.id)}
							style={{
								marginTop: '8px',
								padding: '4px 8px',
								backgroundColor: 'transparent',
								border: '1px solid var(--vscode-button-secondaryBackground)',
								borderRadius: '4px',
								color: 'var(--vscode-button-secondaryForeground)',
								cursor: 'pointer',
								fontSize: '12px'
							}}
						>
							Remove from workspace
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default AgentPanel;
