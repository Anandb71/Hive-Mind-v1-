/**
 * HiveMind Session Webview Provider
 */

import * as vscode from 'vscode';

export class SessionProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _sessionActive = false;
	private _sessionName = '';
	private _participants: string[] = [];

	constructor(private readonly _extensionUri: vscode.Uri) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		this._updateView();

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.type) {
				case 'invite':
					this.copyInviteLink();
					break;
				case 'leave':
					this.leaveSession();
					break;
				case 'toggleVoice':
					vscode.window.showInformationMessage('Voice chat coming soon!');
					break;
			}
		});
	}

	public startSession(name: string) {
		this._sessionActive = true;
		this._sessionName = name;
		this._participants = ['You (Host)'];
		this._updateView();
		vscode.window.showInformationMessage(`🔥 Session "${name}" started!`);
	}

	public joinSession(inviteLink: string) {
		this._sessionActive = true;
		this._sessionName = 'Joined Session';
		this._participants = ['Host', 'You'];
		this._updateView();
		vscode.window.showInformationMessage(`Joined session via ${inviteLink}`);
	}

	private leaveSession() {
		this._sessionActive = false;
		this._sessionName = '';
		this._participants = [];
		this._updateView();
		vscode.window.showInformationMessage('Left the session');
	}

	private copyInviteLink() {
		const link = `hivemind.io/join/demo-session-${Date.now().toString(36)}`;
		vscode.env.clipboard.writeText(link);
		vscode.window.showInformationMessage('Invite link copied to clipboard!');
	}

	private _updateView() {
		if (this._view) {
			this._view.webview.html = this._getHtmlContent();
		}
	}

	private _getHtmlContent(): string {
		if (!this._sessionActive) {
			return `<!DOCTYPE html>
<html>
<head>
	<style>
		body { padding: 16px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); text-align: center; }
		.empty { color: var(--vscode-descriptionForeground); font-size: 12px; margin: 20px 0; }
		button { padding: 10px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
	</style>
</head>
<body>
	<div class="empty">No active session</div>
	<button onclick="vscode.postMessage({type:'start'})">🔥 Start Campfire</button>
	<script>const vscode = acquireVsCodeApi();</script>
</body>
</html>`;
		}

		const participantsList = this._participants.map(p =>
			`<div class="participant"><span class="dot" style="background: #${Math.floor(Math.random() * 16777215).toString(16)}"></span>${p}</div>`
		).join('');

		return `<!DOCTYPE html>
<html>
<head>
	<style>
		body { padding: 12px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
		.session-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
		.session-name { font-size: 14px; font-weight: 600; }
		.live { color: #4ECDC4; font-size: 10px; }
		.participant { display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 4px 0; }
		.dot { width: 8px; height: 8px; border-radius: 50%; }
		.actions { margin-top: 12px; display: flex; gap: 6px; }
		.actions button { flex: 1; padding: 6px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; }
		.btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
		.btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
		.btn-danger { background: #FF6B6B; color: white; }
	</style>
</head>
<body>
	<div class="session-header">
		<span>🔥</span>
		<span class="session-name">${this._sessionName}</span>
		<span class="live">● LIVE</span>
	</div>
	<div class="participants">
		${participantsList}
	</div>
	<div class="actions">
		<button class="btn-primary" onclick="vscode.postMessage({type:'invite'})">📋 Copy Invite</button>
		<button class="btn-secondary" onclick="vscode.postMessage({type:'toggleVoice'})">🎤 Voice</button>
	</div>
	<div class="actions">
		<button class="btn-danger" onclick="vscode.postMessage({type:'leave'})">Leave Session</button>
	</div>
	<script>const vscode = acquireVsCodeApi();</script>
</body>
</html>`;
	}
}
