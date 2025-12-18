/**
 * HiveMind WebRTC P2P Manager
 * Handles peer-to-peer connections for real-time collaboration
 */

export interface PeerConnection {
	id: string;
	userId: string;
	connection: RTCPeerConnection;
	dataChannel: RTCDataChannel | null;
	status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export interface SignalingMessage {
	type: 'offer' | 'answer' | 'ice-candidate';
	from: string;
	to: string;
	payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

type MessageHandler = (peerId: string, data: any) => void;
type ConnectionHandler = (peerId: string) => void;

export class P2PManager {
	private peers: Map<string, PeerConnection> = new Map();
	private localUserId: string;
	private messageHandlers: Set<MessageHandler> = new Set();
	private connectionHandlers: Set<ConnectionHandler> = new Set();
	private disconnectionHandlers: Set<ConnectionHandler> = new Set();

	private readonly rtcConfig: RTCConfiguration = {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' },
			{ urls: 'stun:stun1.l.google.com:19302' }
		]
	};

	constructor(userId: string) {
		this.localUserId = userId;
	}

	async createOffer(targetUserId: string): Promise<SignalingMessage> {
		const connection = this.createPeerConnection(targetUserId);
		const dataChannel = connection.createDataChannel('hivemind-sync');
		this.setupDataChannel(targetUserId, dataChannel);

		const peer = this.peers.get(targetUserId);
		if (peer) {
			peer.dataChannel = dataChannel;
		}

		const offer = await connection.createOffer();
		await connection.setLocalDescription(offer);

		return {
			type: 'offer',
			from: this.localUserId,
			to: targetUserId,
			payload: offer
		};
	}

	async handleOffer(message: SignalingMessage): Promise<SignalingMessage> {
		const connection = this.createPeerConnection(message.from);

		await connection.setRemoteDescription(
			new RTCSessionDescription(message.payload as RTCSessionDescriptionInit)
		);

		const answer = await connection.createAnswer();
		await connection.setLocalDescription(answer);

		return {
			type: 'answer',
			from: this.localUserId,
			to: message.from,
			payload: answer
		};
	}

	async handleAnswer(message: SignalingMessage): Promise<void> {
		const peer = this.peers.get(message.from);
		if (peer) {
			await peer.connection.setRemoteDescription(
				new RTCSessionDescription(message.payload as RTCSessionDescriptionInit)
			);
		}
	}

	async handleIceCandidate(message: SignalingMessage): Promise<void> {
		const peer = this.peers.get(message.from);
		if (peer) {
			await peer.connection.addIceCandidate(
				new RTCIceCandidate(message.payload as RTCIceCandidateInit)
			);
		}
	}

	private createPeerConnection(peerId: string): RTCPeerConnection {
		const connection = new RTCPeerConnection(this.rtcConfig);

		connection.onicecandidate = (event) => {
			if (event.candidate) {
				this.onIceCandidate(peerId, event.candidate);
			}
		};

		connection.onconnectionstatechange = () => {
			this.handleConnectionStateChange(peerId, connection.connectionState);
		};

		connection.ondatachannel = (event) => {
			this.setupDataChannel(peerId, event.channel);
			const peer = this.peers.get(peerId);
			if (peer) {
				peer.dataChannel = event.channel;
			}
		};

		this.peers.set(peerId, {
			id: crypto.randomUUID(),
			userId: peerId,
			connection,
			dataChannel: null,
			status: 'connecting'
		});

		return connection;
	}

	private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
		channel.onopen = () => {
			const peer = this.peers.get(peerId);
			if (peer) {
				peer.status = 'connected';
				this.connectionHandlers.forEach(handler => handler(peerId));
			}
		};

		channel.onclose = () => {
			const peer = this.peers.get(peerId);
			if (peer) {
				peer.status = 'disconnected';
				this.disconnectionHandlers.forEach(handler => handler(peerId));
			}
		};

		channel.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.messageHandlers.forEach(handler => handler(peerId, data));
			} catch {
				// Handle non-JSON messages
				this.messageHandlers.forEach(handler => handler(peerId, event.data));
			}
		};
	}

	private handleConnectionStateChange(peerId: string, state: RTCPeerConnectionState): void {
		const peer = this.peers.get(peerId);
		if (!peer) return;

		switch (state) {
			case 'connected':
				peer.status = 'connected';
				break;
			case 'disconnected':
			case 'closed':
				peer.status = 'disconnected';
				this.disconnectionHandlers.forEach(handler => handler(peerId));
				break;
			case 'failed':
				peer.status = 'failed';
				this.disconnectionHandlers.forEach(handler => handler(peerId));
				break;
		}
	}

	// Override this to handle ICE candidates (send to signaling server)
	onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void = () => { };

	send(peerId: string, data: any): boolean {
		const peer = this.peers.get(peerId);
		if (peer?.dataChannel?.readyState === 'open') {
			peer.dataChannel.send(JSON.stringify(data));
			return true;
		}
		return false;
	}

	broadcast(data: any): void {
		const message = JSON.stringify(data);
		this.peers.forEach(peer => {
			if (peer.dataChannel?.readyState === 'open') {
				peer.dataChannel.send(message);
			}
		});
	}

	onMessage(handler: MessageHandler): () => void {
		this.messageHandlers.add(handler);
		return () => this.messageHandlers.delete(handler);
	}

	onPeerConnected(handler: ConnectionHandler): () => void {
		this.connectionHandlers.add(handler);
		return () => this.connectionHandlers.delete(handler);
	}

	onPeerDisconnected(handler: ConnectionHandler): () => void {
		this.disconnectionHandlers.add(handler);
		return () => this.disconnectionHandlers.delete(handler);
	}

	disconnect(peerId: string): void {
		const peer = this.peers.get(peerId);
		if (peer) {
			peer.dataChannel?.close();
			peer.connection.close();
			this.peers.delete(peerId);
		}
	}

	disconnectAll(): void {
		this.peers.forEach((_, peerId) => this.disconnect(peerId));
	}

	getPeers(): PeerConnection[] {
		return Array.from(this.peers.values());
	}

	getPeer(peerId: string): PeerConnection | undefined {
		return this.peers.get(peerId);
	}
}

export default P2PManager;
