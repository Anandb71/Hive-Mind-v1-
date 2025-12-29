/**
 * Yjs Collaboration Hook
 * Connects to the local HiveMind server for real-time sync
 */

import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface UseCollaborationOptions {
	sessionId: string;
	docName: string;
	userId: string;
	userName: string;
	color: string;
}

interface Cursor {
	userId: string;
	userName: string;
	color: string;
	line: number;
	column: number;
}

interface ChatMessage {
	id: string;
	userId: string;
	userName: string;
	message: string;
	timestamp: number;
}

export function useCollaboration({ sessionId, docName, userId, userName, color }: UseCollaborationOptions) {
	const [connected, setConnected] = useState(false);
	const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [participants, setParticipants] = useState<Array<{ id: string; name: string; color: string }>>([]);

	const socketRef = useRef<Socket | null>(null);
	const docRef = useRef<Y.Doc | null>(null);
	const textRef = useRef<Y.Text | null>(null);

	useEffect(() => {
		// Create Yjs doc
		docRef.current = new Y.Doc();
		textRef.current = docRef.current.getText('content');

		// Connect to server
		const socket = io(SERVER_URL, {
			transports: ['websocket', 'polling']
		});
		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('[Collab] Connected to server');
			setConnected(true);

			// Join session
			socket.emit('join-session', { sessionId, userId, userName, color });

			// Join document
			socket.emit('join-document', { docName });
		});

		socket.on('disconnect', () => {
			console.log('[Collab] Disconnected');
			setConnected(false);
		});

		// Sync document state
		socket.on('sync-document', ({ state }: { docName: string; state: number[] }) => {
			if (docRef.current) {
				Y.applyUpdate(docRef.current, new Uint8Array(state));
			}
		});

		// Receive remote updates
		socket.on('document-update', ({ update }: { docName: string; update: number[] }) => {
			if (docRef.current) {
				Y.applyUpdate(docRef.current, new Uint8Array(update));
			}
		});

		// Cursor updates
		socket.on('cursor-update', ({ userId: cursorUserId, cursor }: { userId: string; cursor: Cursor }) => {
			setCursors(prev => {
				const next = new Map(prev);
				next.set(cursorUserId, cursor);
				return next;
			});
		});

		// Participant events
		socket.on('user-joined', (participant: { id: string; name: string; color: string }) => {
			setParticipants(prev => [...prev, participant]);
		});

		socket.on('user-left', ({ socketId }: { socketId: string }) => {
			setCursors(prev => {
				const next = new Map(prev);
				next.delete(socketId);
				return next;
			});
		});

		// Chat messages
		socket.on('chat-message', (message: ChatMessage) => {
			setMessages(prev => [...prev, message]);
		});

		// Send local updates
		docRef.current.on('update', (update: Uint8Array, origin: any) => {
			if (origin !== 'remote') {
				socket.emit('document-update', { docName, update: Array.from(update) });
			}
		});

		return () => {
			socket.disconnect();
			docRef.current?.destroy();
		};
	}, [sessionId, docName, userId, userName, color]);

	const updateCursor = (line: number, column: number) => {
		socketRef.current?.emit('cursor-update', {
			sessionId,
			userId,
			cursor: { userId, userName, color, line, column }
		});
	};

	const sendMessage = (message: string) => {
		socketRef.current?.emit('chat-message', {
			sessionId,
			userId,
			userName,
			message
		});
	};

	const getContent = () => textRef.current?.toString() || '';

	const setContent = (content: string) => {
		if (textRef.current) {
			docRef.current?.transact(() => {
				textRef.current?.delete(0, textRef.current.length);
				textRef.current?.insert(0, content);
			});
		}
	};

	return {
		connected,
		doc: docRef.current,
		text: textRef.current,
		cursors,
		messages,
		participants,
		updateCursor,
		sendMessage,
		getContent,
		setContent
	};
}
