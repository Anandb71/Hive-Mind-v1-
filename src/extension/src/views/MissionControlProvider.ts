/**
 * HiveMind Mission Control Webview Provider
 */

import * as vscode from 'vscode';

export class MissionControlProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

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

		webviewView.webview.html = this._getHtmlContent();

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.type) {
				case 'startSession':
					vscode.commands.executeCommand('hivemind.startSession');
					break;
				case 'askAgent':
					vscode.commands.executeCommand('hivemind.askAgent');
					break;
			}
		});
	}

	private _getHtmlContent(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			padding: 10px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
		}
		.header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 16px;
		}
		.header h2 {
			margin: 0;
			font-size: 14px;
		}
		.status-card {
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			padding: 12px;
			margin-bottom: 12px;
		}
		.status-card h3 {
			margin: 0 0 8px 0;
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}
		.stat {
			display: flex;
			justify-content: space-between;
			font-size: 12px;
			margin: 4px 0;
		}
		.stat-value {
			font-weight: 600;
		}
		.budget-bar {
			height: 4px;
			background: var(--vscode-progressBar-background);
			border-radius: 2px;
			margin-top: 8px;
			overflow: hidden;
		}
		.budget-fill {
			height: 100%;
			background: #4ECDC4;
			width: 80%;
			transition: width 0.3s;
		}
		button {
			width: 100%;
			padding: 8px;
			margin-top: 8px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
		}
		button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		button.secondary {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}
	</style>
</head>
<body>
	<div class="header">
		<span style="font-size: 20px">🐝</span>
		<h2>HiveMind</h2>
	</div>

	<div class="status-card">
		<h3>SESSION STATUS</h3>
		<div class="stat">
			<span>Status</span>
			<span class="stat-value" style="color: #4ECDC4">● Ready</span>
		</div>
		<div class="stat">
			<span>Agents</span>
			<span class="stat-value">8 available</span>
		</div>
		<button onclick="startSession()">🔥 Start Campfire</button>
	</div>

	<div class="status-card">
		<h3>BUDGET</h3>
		<div class="stat">
			<span>Remaining</span>
			<span class="stat-value">$4.50</span>
		</div>
		<div class="budget-bar">
			<div class="budget-fill" style="width: 90%"></div>
		</div>
	</div>

	<button class="secondary" onclick="askAgent()">🤖 Ask Agent</button>

	<script>
		const vscode = acquireVsCodeApi();
		function startSession() {
			vscode.postMessage({ type: 'startSession' });
		}
		function askAgent() {
			vscode.postMessage({ type: 'askAgent' });
		}
	</script>
</body>
</html>`;
	}
}
