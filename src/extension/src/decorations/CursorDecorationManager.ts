/**
 * HiveMind Cursor Decoration Manager
 * Shows remote collaborator cursors in the editor
 */

import * as vscode from 'vscode';

interface RemoteCursor {
	userId: string;
	username: string;
	color: string;
	position: vscode.Position;
	fileName: string;
}

export class CursorDecorationManager implements vscode.Disposable {
	private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
	private cursors: Map<string, RemoteCursor> = new Map();
	private disposables: vscode.Disposable[] = [];

	constructor() {
		this.disposables.push(
			vscode.window.onDidChangeActiveTextEditor(() => this.updateDecorations()),
			vscode.workspace.onDidChangeTextDocument(() => this.updateDecorations())
		);
	}

	public updateCursor(cursor: RemoteCursor): void {
		this.cursors.set(cursor.userId, cursor);
		this.ensureDecorationType(cursor);
		this.updateDecorations();
	}

	public removeCursor(userId: string): void {
		const cursor = this.cursors.get(userId);
		if (cursor) {
			const decorationType = this.decorationTypes.get(userId);
			if (decorationType) {
				decorationType.dispose();
				this.decorationTypes.delete(userId);
			}
			this.cursors.delete(userId);
		}
		this.updateDecorations();
	}

	private ensureDecorationType(cursor: RemoteCursor): void {
		if (!this.decorationTypes.has(cursor.userId)) {
			const decorationType = vscode.window.createTextEditorDecorationType({
				before: {
					contentText: '',
					width: '2px',
					height: '1em',
					backgroundColor: cursor.color,
					margin: '0 -2px 0 0'
				},
				after: {
					contentText: cursor.username,
					color: 'white',
					backgroundColor: cursor.color,
					margin: '0 0 0 4px',
					fontWeight: 'normal',
					fontStyle: 'normal'
				},
				rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
			});
			this.decorationTypes.set(cursor.userId, decorationType);
		}
	}

	private updateDecorations(): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const fileName = editor.document.fileName;

		for (const [userId, cursor] of this.cursors) {
			const decorationType = this.decorationTypes.get(userId);
			if (!decorationType) {
				continue;
			}

			if (cursor.fileName === fileName) {
				const range = new vscode.Range(cursor.position, cursor.position);
				editor.setDecorations(decorationType, [{ range }]);
			} else {
				editor.setDecorations(decorationType, []);
			}
		}
	}

	public dispose(): void {
		for (const decorationType of this.decorationTypes.values()) {
			decorationType.dispose();
		}
		this.decorationTypes.clear();
		this.cursors.clear();

		for (const disposable of this.disposables) {
			disposable.dispose();
		}
	}
}
