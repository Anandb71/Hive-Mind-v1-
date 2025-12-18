/**
 * HiveMind UI - Session Indicator
 * Shows active Campfire session status and participants
 */

import React from 'react';

export interface Participant {
	id: string;
	username: string;
	color: string;
	isHost: boolean;
	avatar?: string;
}

export interface SessionStatus {
	id: string;
	name: string;
	participants: Participant[];
	budgetRemaining: number;
	isActive: boolean;
}

interface SessionIndicatorProps {
	session: SessionStatus | null;
	onInvite?: () => void;
	onLeave?: () => void;
	onCreateSession?: () => void;
}

export const SessionIndicator: React.FC<SessionIndicatorProps> = ({
	session,
	onInvite,
	onLeave,
	onCreateSession
}) => {
	if (!session) {
		return (
			<div className="session-indicator no-session" style={{
				padding: '12px',
				backgroundColor: 'var(--vscode-editor-background)',
				border: '1px solid var(--vscode-panel-border)',
				borderRadius: '8px',
				textAlign: 'center'
			}}>
				<p style={{
					fontSize: '13px',
					color: 'var(--vscode-descriptionForeground)',
					margin: '0 0 12px 0'
				}}>
					No active session
				</p>
				<button
					onClick={onCreateSession}
					style={{
						padding: '8px 16px',
						backgroundColor: 'var(--vscode-button-background)',
						color: 'var(--vscode-button-foreground)',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '13px',
						fontWeight: 500
					}}
				>
					🔥 Start Campfire
				</button>
			</div>
		);
	}

	return (
		<div className="session-indicator active" style={{
			padding: '12px',
			backgroundColor: 'var(--vscode-editor-background)',
			border: '2px solid #4ECDC4',
			borderRadius: '8px'
		}}>
			<div className="session-header" style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '12px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{ fontSize: '16px' }}>🔥</span>
					<span style={{
						fontWeight: 600,
						color: 'var(--vscode-foreground)'
					}}>
						{session.name}
					</span>
				</div>
				<span style={{
					fontSize: '12px',
					color: '#4ECDC4',
					fontWeight: 500
				}}>
					LIVE
				</span>
			</div>

			<div className="participants" style={{
				display: 'flex',
				gap: '4px',
				marginBottom: '12px',
				flexWrap: 'wrap'
			}}>
				{session.participants.map(p => (
					<div
						key={p.id}
						title={`${p.username}${p.isHost ? ' (Host)' : ''}`}
						style={{
							width: '28px',
							height: '28px',
							borderRadius: '50%',
							backgroundColor: p.color,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '12px',
							color: '#fff',
							fontWeight: 600,
							border: p.isHost ? '2px solid #FFD700' : 'none'
						}}
					>
						{p.avatar || p.username.charAt(0).toUpperCase()}
					</div>
				))}
				<button
					onClick={onInvite}
					style={{
						width: '28px',
						height: '28px',
						borderRadius: '50%',
						backgroundColor: 'var(--vscode-button-secondaryBackground)',
						border: '1px dashed var(--vscode-panel-border)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '14px'
					}}
				>
					+
				</button>
			</div>

			<div className="session-footer" style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center'
			}}>
				<div className="budget" style={{
					fontSize: '12px',
					color: 'var(--vscode-descriptionForeground)'
				}}>
					💰 ${session.budgetRemaining.toFixed(2)} left
				</div>
				<button
					onClick={onLeave}
					style={{
						padding: '4px 8px',
						backgroundColor: 'transparent',
						border: '1px solid var(--vscode-panel-border)',
						borderRadius: '4px',
						color: 'var(--vscode-descriptionForeground)',
						cursor: 'pointer',
						fontSize: '11px'
					}}
				>
					Leave
				</button>
			</div>
		</div>
	);
};

export default SessionIndicator;
