/**
 * HiveMind VS Code Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { MissionControlProvider } from './views/MissionControlProvider';
import { AgentHubProvider } from './views/AgentHubProvider';
import { SessionProvider } from './views/SessionProvider';
import { CursorDecorationManager } from './decorations/CursorDecorationManager';

let cursorManager: CursorDecorationManager | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log('🐝 HiveMind extension activating...');

	// Register webview providers
	const missionControlProvider = new MissionControlProvider(context.extensionUri);
	const agentHubProvider = new AgentHubProvider(context.extensionUri);
	const sessionProvider = new SessionProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'hivemind.missionControl',
			missionControlProvider
		),
		vscode.window.registerWebviewViewProvider(
			'hivemind.agentHub',
			agentHubProvider
		),
		vscode.window.registerWebviewViewProvider(
			'hivemind.session',
			sessionProvider
		)
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('hivemind.startSession', async () => {
			const sessionName = await vscode.window.showInputBox({
				prompt: 'Enter session name',
				placeHolder: 'My Campfire'
			});
			if (sessionName) {
				vscode.window.showInformationMessage(`🔥 Started session: ${sessionName}`);
				sessionProvider.startSession(sessionName);
			}
		}),

		vscode.commands.registerCommand('hivemind.joinSession', async () => {
			const inviteLink = await vscode.window.showInputBox({
				prompt: 'Enter invite link or session ID',
				placeHolder: 'hivemind.io/join/...'
			});
			if (inviteLink) {
				vscode.window.showInformationMessage(`Joining session...`);
				sessionProvider.joinSession(inviteLink);
			}
		}),

		vscode.commands.registerCommand('hivemind.askAgent', async () => {
			const agents = [
				'The Architect',
				"The Devil's Advocate",
				'The Historian',
				'The Scribe',
				'The Diplomat',
				'The Designer',
				'The Security Guard',
				'The Intern'
			];

			const agent = await vscode.window.showQuickPick(agents, {
				placeHolder: 'Select an agent'
			});

			if (agent) {
				const question = await vscode.window.showInputBox({
					prompt: `Ask ${agent}`,
					placeHolder: 'Enter your question...'
				});

				if (question) {
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: `${agent} is thinking...`,
						cancellable: false
					}, async () => {
						// In real implementation, this would call the agent
						await new Promise(resolve => setTimeout(resolve, 2000));
						vscode.window.showInformationMessage(`${agent}: Response would appear here`);
					});
				}
			}
		}),

		vscode.commands.registerCommand('hivemind.openKeyVault', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'hivemind');
		}),

		vscode.commands.registerCommand('hivemind.toggleCollaboration', () => {
			const config = vscode.workspace.getConfiguration('hivemind');
			const current = config.get<boolean>('enableCursors');
			config.update('enableCursors', !current, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(
				`Collaboration mode ${!current ? 'enabled' : 'disabled'}`
			);
		})
	);

	// Initialize cursor decorations
	const config = vscode.workspace.getConfiguration('hivemind');
	if (config.get<boolean>('enableCursors')) {
		cursorManager = new CursorDecorationManager();
		context.subscriptions.push(cursorManager);
	}

	// Listen for config changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('hivemind.enableCursors')) {
				const enabled = vscode.workspace.getConfiguration('hivemind').get<boolean>('enableCursors');
				if (enabled && !cursorManager) {
					cursorManager = new CursorDecorationManager();
					context.subscriptions.push(cursorManager);
				} else if (!enabled && cursorManager) {
					cursorManager.dispose();
					cursorManager = undefined;
				}
			}
		})
	);

	console.log('🐝 HiveMind extension activated!');
}

export function deactivate() {
	console.log('🐝 HiveMind extension deactivated');
}
