/**
 * HiveMind Session Manager
 * Manages multiplayer sessions and P2P connections
 */

import SyncEngine from '../sync/SyncEngine';
import KeyVault from './KeyVault';

export interface Participant {
	id: string;
	username: string;
	color: string;
	isHost: boolean;
	joinedAt: number;
	lastSeen: number;
}

export interface SessionConfig {
	name: string;
	hostId: string;
	budget: number;
	allowGuests: boolean;
}

export class Session {
	readonly id: string;
	readonly name: string;
	readonly hostId: string;
	private participants: Map<string, Participant> = new Map();
	private syncEngine: SyncEngine;
	private keyVault: KeyVault;
	private budget: number;
	private isActive: boolean = true;

	constructor(config: SessionConfig, keyVault: KeyVault) {
		this.id = this.generateSessionId();
		this.name = config.name;
		this.hostId = config.hostId;
		this.budget = config.budget;
		this.keyVault = keyVault;
		this.syncEngine = new SyncEngine(config.hostId);

		// Add host as first participant
		this.addParticipant({
			id: config.hostId,
			username: 'Host',
			color: this.generateColor(),
			isHost: true,
			joinedAt: Date.now(),
			lastSeen: Date.now()
		});
	}

	private generateSessionId(): string {
		const adjectives = ['cool', 'epic', 'awesome', 'blazing', 'stellar'];
		const nouns = ['project', 'code', 'hack', 'build', 'venture'];
		const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
		const noun = nouns[Math.floor(Math.random() * nouns.length)];
		const num = Math.floor(Math.random() * 1000);
		return `${adj}-${noun}-${num}`;
	}

	private generateColor(): string {
		const colors = [
			'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
			'#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
		];
		return colors[this.participants.size % colors.length];
	}

	getInviteLink(): string {
		return `hivemind.io/join/${this.id}`;
	}

	addParticipant(participant: Participant): void {
		participant.color = participant.color || this.generateColor();
		this.participants.set(participant.id, participant);
	}

	removeParticipant(participantId: string): void {
		this.participants.delete(participantId);
		this.syncEngine.removeCursor(participantId);
	}

	getParticipant(id: string): Participant | undefined {
		return this.participants.get(id);
	}

	getParticipants(): Participant[] {
		return Array.from(this.participants.values());
	}

	isHost(userId: string): boolean {
		return this.hostId === userId;
	}

	getSyncEngine(): SyncEngine {
		return this.syncEngine;
	}

	getBudgetRemaining(): number {
		return this.keyVault.getBudgetRemaining();
	}

	recordAiUsage(cost: number): boolean {
		return this.keyVault.recordSpend(cost);
	}

	end(): void {
		this.isActive = false;
		this.participants.clear();
	}

	getStatus(): {
		id: string;
		name: string;
		participants: number;
		budgetRemaining: number;
		isActive: boolean;
	} {
		return {
			id: this.id,
			name: this.name,
			participants: this.participants.size,
			budgetRemaining: this.getBudgetRemaining(),
			isActive: this.isActive
		};
	}

	// Invite System
	private inviteTokens: Map<string, { expiresAt: number; usesLeft: number }> = new Map();

	createInviteToken(options?: { expiresIn?: number; maxUses?: number }): string {
		const token = this.generateInviteToken();
		this.inviteTokens.set(token, {
			expiresAt: Date.now() + (options?.expiresIn || 24 * 60 * 60 * 1000), // 24h default
			usesLeft: options?.maxUses || 10
		});
		return token;
	}

	private generateInviteToken(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
		let token = '';
		for (let i = 0; i < 8; i++) {
			token += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return token;
	}

	getShareableLink(): string {
		const token = this.createInviteToken();
		return `hivemind.io/join/${this.id}?t=${token}`;
	}

	validateInviteToken(token: string): boolean {
		const invite = this.inviteTokens.get(token);
		if (!invite) return false;
		if (Date.now() > invite.expiresAt) {
			this.inviteTokens.delete(token);
			return false;
		}
		if (invite.usesLeft <= 0) {
			this.inviteTokens.delete(token);
			return false;
		}
		invite.usesLeft--;
		return true;
	}

	// Voice Chat Integration
	private voiceEnabled: boolean = false;
	private voiceParticipants: Set<string> = new Set();

	enableVoiceChat(): void {
		this.voiceEnabled = true;
	}

	disableVoiceChat(): void {
		this.voiceEnabled = false;
		this.voiceParticipants.clear();
	}

	isVoiceEnabled(): boolean {
		return this.voiceEnabled;
	}

	joinVoice(userId: string): boolean {
		if (!this.voiceEnabled) return false;
		if (!this.participants.has(userId)) return false;
		this.voiceParticipants.add(userId);
		return true;
	}

	leaveVoice(userId: string): void {
		this.voiceParticipants.delete(userId);
	}

	getVoiceParticipants(): string[] {
		return Array.from(this.voiceParticipants);
	}

	// Participant Events
	private participantJoinHandlers: Set<(p: Participant) => void> = new Set();
	private participantLeaveHandlers: Set<(id: string) => void> = new Set();

	onParticipantJoin(handler: (p: Participant) => void): () => void {
		this.participantJoinHandlers.add(handler);
		return () => this.participantJoinHandlers.delete(handler);
	}

	onParticipantLeave(handler: (id: string) => void): () => void {
		this.participantLeaveHandlers.add(handler);
		return () => this.participantLeaveHandlers.delete(handler);
	}

	addParticipantWithNotify(participant: Participant): void {
		participant.color = participant.color || this.generateColor();
		this.participants.set(participant.id, participant);
		this.participantJoinHandlers.forEach(h => h(participant));
	}

	removeParticipantWithNotify(participantId: string): void {
		this.participants.delete(participantId);
		this.syncEngine.removeCursor(participantId);
		this.voiceParticipants.delete(participantId);
		this.participantLeaveHandlers.forEach(h => h(participantId));
	}
}

export class SessionManager {
	private sessions: Map<string, Session> = new Map();
	private keyVault: KeyVault;

	constructor(keyVault: KeyVault) {
		this.keyVault = keyVault;
	}

	createSession(config: Omit<SessionConfig, 'budget'> & { budget?: number }): Session {
		const session = new Session({
			...config,
			budget: config.budget || 5.00
		}, this.keyVault);

		this.sessions.set(session.id, session);
		return session;
	}

	getSession(sessionId: string): Session | undefined {
		return this.sessions.get(sessionId);
	}

	joinSession(sessionId: string, participant: Omit<Participant, 'isHost' | 'joinedAt' | 'lastSeen'>): Session {
		const session = this.sessions.get(sessionId);
		if (!session) {
			throw new Error(`Session ${sessionId} not found`);
		}

		session.addParticipant({
			...participant,
			isHost: false,
			joinedAt: Date.now(),
			lastSeen: Date.now()
		});

		return session;
	}

	leaveSession(sessionId: string, participantId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.removeParticipant(participantId);
		}
	}

	endSession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.end();
			this.sessions.delete(sessionId);
		}
	}

	listSessions(): Session[] {
		return Array.from(this.sessions.values());
	}
}

export default SessionManager;
