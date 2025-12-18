/**
 * HiveMind Signaling Client
 * WebSocket-based signaling for WebRTC peer discovery
 */

import { SignalingMessage } from './P2PManager';

type SignalingHandler = (message: SignalingMessage) => void;

export interface SignalingConfig {
	serverUrl: string;
	sessionId: string;
	userId: string;
}

export class SignalingClient {
	private ws: WebSocket | null = null;
	private config: SignalingConfig;
	private messageHandlers: Set<SignalingHandler> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private isConnected = false;

	constructor(config: SignalingConfig) {
		this.config = config;
	}

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const url = `${this.config.serverUrl}?session=${this.config.sessionId}&user=${this.config.userId}`;
				this.ws = new WebSocket(url);

				this.ws.onopen = () => {
					this.isConnected = true;
					this.reconnectAttempts = 0;
					resolve();
				};

				this.ws.onclose = () => {
					this.isConnected = false;
					this.attemptReconnect();
				};

				this.ws.onerror = (error) => {
					if (!this.isConnected) {
						reject(error);
					}
				};

				this.ws.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data) as SignalingMessage;
						this.messageHandlers.forEach(handler => handler(message));
					} catch {
						console.warn('Invalid signaling message received');
					}
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('Max reconnection attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

		setTimeout(() => {
			this.connect().catch(() => {
				// Reconnect failed, will try again
			});
		}, delay);
	}

	send(message: SignalingMessage): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	}

	onMessage(handler: SignalingHandler): () => void {
		this.messageHandlers.add(handler);
		return () => this.messageHandlers.delete(handler);
	}

	disconnect(): void {
		this.maxReconnectAttempts = 0; // Prevent reconnection
		this.ws?.close();
		this.ws = null;
		this.isConnected = false;
	}

	getConnectionState(): boolean {
		return this.isConnected;
	}
}

export default SignalingClient;
