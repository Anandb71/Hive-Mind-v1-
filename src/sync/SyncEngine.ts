/**
 * HiveMind Sync Engine
 * CRDT-based real-time document synchronization
 * Uses Automerge-rs concepts for conflict-free editing
 */

export interface Operation {
	type: 'insert' | 'delete' | 'retain';
	pos: number;
	content?: string;
	length?: number;
	clock: number;
	userId: string;
}

export interface DocumentState {
	id: string;
	content: string;
	version: number;
	operations: Operation[];
}

export interface Cursor {
	userId: string;
	username: string;
	color: string;
	position: number;
	selection?: { start: number; end: number };
}

export class SyncEngine {
	private documents: Map<string, DocumentState> = new Map();
	private cursors: Map<string, Cursor> = new Map();
	private clock: number = 0;
	private userId: string;
	private listeners: Set<(doc: DocumentState) => void> = new Set();
	private cursorListeners: Set<(cursors: Cursor[]) => void> = new Set();

	constructor(userId: string) {
		this.userId = userId;
	}

	createDocument(id: string, initialContent: string = ''): DocumentState {
		const doc: DocumentState = {
			id,
			content: initialContent,
			version: 0,
			operations: []
		};
		this.documents.set(id, doc);
		return doc;
	}

	getDocument(id: string): DocumentState | undefined {
		return this.documents.get(id);
	}

	insert(docId: string, pos: number, content: string): Operation {
		const doc = this.documents.get(docId);
		if (!doc) throw new Error(`Document ${docId} not found`);

		const op: Operation = {
			type: 'insert',
			pos,
			content,
			clock: ++this.clock,
			userId: this.userId
		};

		this.applyOperation(docId, op);
		return op;
	}

	delete(docId: string, pos: number, length: number): Operation {
		const doc = this.documents.get(docId);
		if (!doc) throw new Error(`Document ${docId} not found`);

		const op: Operation = {
			type: 'delete',
			pos,
			length,
			clock: ++this.clock,
			userId: this.userId
		};

		this.applyOperation(docId, op);
		return op;
	}

	private applyOperation(docId: string, op: Operation): void {
		const doc = this.documents.get(docId);
		if (!doc) return;

		switch (op.type) {
			case 'insert':
				doc.content =
					doc.content.slice(0, op.pos) +
					(op.content || '') +
					doc.content.slice(op.pos);
				break;
			case 'delete':
				doc.content =
					doc.content.slice(0, op.pos) +
					doc.content.slice(op.pos + (op.length || 0));
				break;
		}

		doc.operations.push(op);
		doc.version++;
		this.notifyListeners(doc);
	}

	receiveOperation(docId: string, op: Operation): void {
		// Transform operation against concurrent operations (OT/CRDT logic)
		// For now, simple apply - full CRDT logic would go here
		this.applyOperation(docId, op);
	}

	updateCursor(cursor: Cursor): void {
		this.cursors.set(cursor.userId, cursor);
		this.notifyCursorListeners();
	}

	removeCursor(userId: string): void {
		this.cursors.delete(userId);
		this.notifyCursorListeners();
	}

	getCursors(): Cursor[] {
		return Array.from(this.cursors.values());
	}

	onDocumentChange(listener: (doc: DocumentState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	onCursorsChange(listener: (cursors: Cursor[]) => void): () => void {
		this.cursorListeners.add(listener);
		return () => this.cursorListeners.delete(listener);
	}

	private notifyListeners(doc: DocumentState): void {
		this.listeners.forEach(fn => fn(doc));
	}

	private notifyCursorListeners(): void {
		const cursors = this.getCursors();
		this.cursorListeners.forEach(fn => fn(cursors));
	}

	getOperationsSince(docId: string, version: number): Operation[] {
		const doc = this.documents.get(docId);
		if (!doc) return [];
		return doc.operations.slice(version);
	}
}

export default SyncEngine;
