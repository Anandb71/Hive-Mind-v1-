/**
 * HiveMind UI - Mission Control Sidebar
 * Main sidebar combining session info, agents, and quick actions
 */

import React from 'react';
import AgentHubPanel from './AgentHubPanel';
import SessionIndicator, { SessionStatus } from './SessionIndicator';

interface MissionControlProps {
	session: SessionStatus | null;
	onCreateSession?: () => void;
	onInvite?: () => void;
	onLeaveSession?: () => void;
	onAgentAsk?: (agentId: string, prompt: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
	session,
	onCreateSession,
	onInvite,
	onLeaveSession,
	onAgentAsk
}) => {
	const [activeTab, setActiveTab] = React.useState<'agents' | 'session' | 'settings'>('agents');

	return (
		<div className="mission-control" style={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			backgroundColor: 'var(--vscode-sideBar-background)',
			color: 'var(--vscode-foreground)'
		}}>
			{/* Header */}
			<div className="mc-header" style={{
				padding: '12px 16px',
				borderBottom: '1px solid var(--vscode-panel-border)',
				display: 'flex',
				alignItems: 'center',
				gap: '10px'
			}}>
				<span style={{ fontSize: '20px' }}>🐝</span>
				<div>
					<h1 style={{
						margin: 0,
						fontSize: '16px',
						fontWeight: 700,
						letterSpacing: '-0.5px'
					}}>
						HiveMind
					</h1>
					<span style={{
						fontSize: '11px',
						color: 'var(--vscode-descriptionForeground)'
					}}>
						Mission Control
					</span>
				</div>
			</div>

			{/* Session Status */}
			<div style={{ padding: '12px' }}>
				<SessionIndicator
					session={session}
					onCreateSession={onCreateSession}
					onInvite={onInvite}
					onLeave={onLeaveSession}
				/>
			</div>

			{/* Tab Bar */}
			<div className="tab-bar" style={{
				display: 'flex',
				borderBottom: '1px solid var(--vscode-panel-border)',
				padding: '0 12px'
			}}>
				{['agents', 'session', 'settings'].map(tab => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab as any)}
						style={{
							flex: 1,
							padding: '8px',
							backgroundColor: 'transparent',
							border: 'none',
							borderBottom: activeTab === tab ? '2px solid var(--vscode-focusBorder)' : '2px solid transparent',
							color: activeTab === tab ? 'var(--vscode-foreground)' : 'var(--vscode-descriptionForeground)',
							cursor: 'pointer',
							fontSize: '12px',
							fontWeight: activeTab === tab ? 600 : 400,
							textTransform: 'capitalize'
						}}
					>
						{tab === 'agents' && '🤖 '}
						{tab === 'session' && '👥 '}
						{tab === 'settings' && '⚙️ '}
						{tab}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="tab-content" style={{ flex: 1, overflow: 'hidden' }}>
				{activeTab === 'agents' && (
					<AgentHubPanel onAgentAsk={onAgentAsk} />
				)}

				{activeTab === 'session' && (
					<div style={{ padding: '16px' }}>
						<h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
							Session Details
						</h3>
						{session ? (
							<div style={{ fontSize: '13px' }}>
								<p><strong>ID:</strong> {session.id}</p>
								<p><strong>Participants:</strong> {session.participants.length}</p>
								<p><strong>Status:</strong> {session.isActive ? 'Active' : 'Inactive'}</p>
							</div>
						) : (
							<p style={{ color: 'var(--vscode-descriptionForeground)' }}>
								No active session. Start a Campfire to collaborate!
							</p>
						)}
					</div>
				)}

				{activeTab === 'settings' && (
					<div style={{ padding: '16px' }}>
						<h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
							Settings
						</h3>
						<div style={{ fontSize: '13px' }}>
							<label style={{ display: 'block', marginBottom: '8px' }}>
								<input type="checkbox" defaultChecked /> Enable AI suggestions
							</label>
							<label style={{ display: 'block', marginBottom: '8px' }}>
								<input type="checkbox" defaultChecked /> Show cursor names
							</label>
							<label style={{ display: 'block', marginBottom: '8px' }}>
								<input type="checkbox" /> Spatial audio (experimental)
							</label>
						</div>
					</div>
				)}
			</div>

			{/* Footer - Quick Actions */}
			<div className="mc-footer" style={{
				padding: '12px',
				borderTop: '1px solid var(--vscode-panel-border)',
				display: 'flex',
				gap: '8px'
			}}>
				<button style={{
					flex: 1,
					padding: '8px',
					backgroundColor: 'var(--vscode-button-background)',
					color: 'var(--vscode-button-foreground)',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					fontSize: '12px'
				}}>
					🔐 Key Vault
				</button>
				<button style={{
					flex: 1,
					padding: '8px',
					backgroundColor: 'var(--vscode-button-secondaryBackground)',
					color: 'var(--vscode-button-secondaryForeground)',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					fontSize: '12px'
				}}>
					📊 Usage
				</button>
			</div>
		</div>
	);
};

export default MissionControl;
