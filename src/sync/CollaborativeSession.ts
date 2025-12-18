/**
 * HiveMind Collaborative Session
 * Combines P2P, Signaling, and SyncEngine for full collaboration
 */

import { SyncEngine, DocumentState, Cursor, Operation } from './SyncEngine';
import { P2PManager } from './P2PManager';
import { SignalingClient } from './SignalingClient';

export interface CollaborationConfig {
	sessionId: string;
	userId: string;
	username: string;
	color: string;
	signalingUrl?: string;
}

export interface SyncMessage {
	type: 'operation' | 'cursor' | 'document-state' | 'request-sync';
	documentId?: string;
	payload: any;
}

export class CollaborativeSession {
	private syncEngine: SyncEngine;
	private p2pManager: P2PManager;
	private signalingClient: SignalingClient | null = null;
	private config: CollaborationConfig;
	private cursorUpdateInterval: number | null = null;

	constructor(config: CollaborationConfig) {
		this.config = config;
		this.syncEngine = new SyncEngine(config.userId);
		this.p2pManager = new P2PManager(config.userId);

		this.setupP2PHandlers();

		if (config.signalingUrl) {
			this.signalingClient = new SignalingClient({
				serverUrl: config.signalingUrl,
				sessionId: config.sessionId,
				userId: config.userId
			});
			this.setupSignalingHandlers();
		}
	}

	private setupP2PHandlers(): void {
		this.p2pManager.onMessage((peerId, data: SyncMessage) => {
			this.handleSyncMessage(peerId, data);
		});

		this.p2pManager.onPeerConnected((peerId) => {
			// Request full document sync from new peer
			this.p2pManager.send(peerId, {
				type: 'request-sync'
			});
		});
	}

	private setupSignalingHandlers(): void {
		if (!this.signalingClient) return;

		this.signalingClient.onMessage(async (message) => {
			switch (message.type) {
				case 'offer':
					const answer = await this.p2pManager.handleOffer(message);
					this.signalingClient?.send(answer);
					break;
				case 'answer':
					await this.p2pManager.handleAnswer(message);
					break;
				case 'ice-candidate':
					await this.p2pManager.handleIceCandidate(message);
					break;
			}
		});

		this.p2pManager.onIceCandidate = (peerId, candidate) => {
			this.signalingClient?.send({
				type: 'ice-candidate',
				from: this.config.userId,
				to: peerId,
				payload: candidate.toJSON()
			});
		};
	}

	private handleSyncMessage(peerId: string, message: SyncMessage): void {
		switch (message.type) {
			case 'operation':
				if (message.documentId) {
					this.syncEngine.receiveOperation(message.documentId, message.payload as Operation);
				}
				break;

			case 'cursor':
				this.syncEngine.updateCursor(message.payload as Cursor);
				break;

			case 'document-state':
				// Handle full document sync
				const state = message.payload as DocumentState;
				const doc = this.syncEngine.getDocument(state.id);
				if (!doc || doc.version < state.version) {
					// Apply the newer state
					// In production, would need more sophisticated merging
				}
				break;

			case 'request-sync':
				// Send current document state to requester
				// In production, would send all open documents
				break;
		}
	}

	async connect(): Promise<void> {
		if (this.signalingClient) {
			await this.signalingClient.connect();
		}
		this.startCursorBroadcast();
	}

	private startCursorBroadcast(): void {
		this.cursorUpdateInterval = window.setInterval(() => {
			const cursors = this.syncEngine.getCursors();
			const myCursor = cursors.find(c => c.userId === this.config.userId);
			if (myCursor) {
				this.p2pManager.broadcast({
					type: 'cursor',
					payload: myCursor
				});
			}
		}, 50); // 20 FPS cursor updates
	}

	createDocument(id: string, content: string = ''): DocumentState {
		return this.syncEngine.createDocument(id, content);
	}

	insert(documentId: string, position: number, content: string): void {
		const op = this.syncEngine.insert(documentId, position, content);
		this.p2pManager.broadcast({
			type: 'operation',
			documentId,
			payload: op
		});
	}

	delete(documentId: string, position: number, length: number): void {
		const op = this.syncEngine.delete(documentId, position, length);
		this.p2pManager.broadcast({
			type: 'operation',
			documentId,
			payload: op
		});
	}

	updateCursor(position: number, selection?: { start: number; end: number }): void {
		this.syncEngine.updateCursor({
			userId: this.config.userId,
			username: this.config.username,
			color: this.config.color,
			position,
			selection
		});
	}

	getDocument(id: string): DocumentState | undefined {
		return this.syncEngine.getDocument(id);
	}

	getCursors(): Cursor[] {
		return this.syncEngine.getCursors();
	}

	onDocumentChange(handler: (doc: DocumentState) => void): () => void {
		return this.syncEngine.onDocumentChange(handler);
	}

	onCursorsChange(handler: (cursors: Cursor[]) => void): () => void {
		return this.syncEngine.onCursorsChange(handler);
	}

	async invitePeer(peerId: string): Promise<void> {
		const offer = await this.p2pManager.createOffer(peerId);
		this.signalingClient?.send(offer);
	}

	disconnect(): void {
		if (this.cursorUpdateInterval) {
			clearInterval(this.cursorUpdateInterval);
		}
		this.p2pManager.disconnectAll();
		this.signalingClient?.disconnect();
	}

	getPeers(): string[] {
		return this.p2pManager.getPeers()
			.filter(p => p.status === 'connected')
			.map(p => p.userId);
	}
}

export default CollaborativeSession;
