/**
 * HiveMind Agent Hub Webview Provider
 */

import * as vscode from 'vscode';

export class AgentHubProvider implements vscode.WebviewViewProvider {
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
			if (message.type === 'askAgent') {
				this.handleAgentQuestion(message.agent, message.question);
			}
		});
	}

	private async handleAgentQuestion(agent: string, question: string) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `${agent} is thinking...`,
			cancellable: false
		}, async () => {
			await new Promise(resolve => setTimeout(resolve, 1500));
			vscode.window.showInformationMessage(`${agent}: Response received`);
		});
	}

	private _getHtmlContent(): string {
		const agents = [
			{ id: 'architect', name: 'The Architect', emoji: '🏛️', desc: 'Code structure', model: 'Claude' },
			{ id: 'devil', name: "Devil's Advocate", emoji: '😈', desc: 'Chaos testing', model: 'GPT-4o' },
			{ id: 'historian', name: 'The Historian', emoji: '📚', desc: 'Context memory', model: 'Gemini' },
			{ id: 'scribe', name: 'The Scribe', emoji: '✍️', desc: 'Documentation', model: 'Mistral' },
			{ id: 'diplomat', name: 'The Diplomat', emoji: '🤝', desc: 'Conflict resolution', model: 'DeepSeek' },
			{ id: 'designer', name: 'The Designer', emoji: '🎨', desc: 'UI preview', model: 'Gemini' },
			{ id: 'security', name: 'Security Guard', emoji: '🛡️', desc: 'Vulnerability scan', model: 'Claude' },
			{ id: 'intern', name: 'The Intern', emoji: '📝', desc: 'Unit tests', model: 'DeepSeek' }
		];

		const agentCards = agents.map(a => `
			<div class="agent-card" onclick="toggleAgent('${a.id}')">
				<div class="agent-header">
					<span class="agent-emoji">${a.emoji}</span>
					<div class="agent-info">
						<div class="agent-name">${a.name}</div>
						<div class="agent-desc">${a.desc}</div>
					</div>
					<span class="agent-status">●</span>
				</div>
				<div class="agent-body" id="body-${a.id}" style="display:none">
					<input type="text" id="input-${a.id}" placeholder="Ask ${a.name}..." />
					<button onclick="askAgent('${a.name}', '${a.id}')">Ask</button>
				</div>
			</div>
		`).join('');

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<style>
		body { padding: 8px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
		.agent-card {
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			margin-bottom: 6px;
			overflow: hidden;
			cursor: pointer;
		}
		.agent-header {
			display: flex;
			align-items: center;
			padding: 8px;
			gap: 8px;
		}
		.agent-emoji { font-size: 20px; }
		.agent-info { flex: 1; }
		.agent-name { font-size: 12px; font-weight: 600; }
		.agent-desc { font-size: 10px; color: var(--vscode-descriptionForeground); }
		.agent-status { color: #4ECDC4; font-size: 8px; }
		.agent-body {
			padding: 8px;
			border-top: 1px solid var(--vscode-panel-border);
		}
		.agent-body input {
			width: 100%;
			padding: 6px;
			margin-bottom: 6px;
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			color: var(--vscode-input-foreground);
			font-size: 11px;
		}
		.agent-body button {
			width: 100%;
			padding: 6px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 11px;
		}
	</style>
</head>
<body>
	${agentCards}
	<script>
		const vscode = acquireVsCodeApi();
		function toggleAgent(id) {
			const body = document.getElementById('body-' + id);
			body.style.display = body.style.display === 'none' ? 'block' : 'none';
		}
		function askAgent(name, id) {
			const input = document.getElementById('input-' + id);
			if (input.value) {
				vscode.postMessage({ type: 'askAgent', agent: name, question: input.value });
				input.value = '';
			}
		}
	</script>
</body>
</html>`;
	}
}
