import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { useStore } from '../store';
import { io, Socket } from 'socket.io-client';

interface Message {
	id: string;
	userId: string;
	userName: string;
	message: string;
	timestamp: number;
}

export function Chat() {
	const { toggleChat, serverUrl, user, session } = useStore();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const socketRef = useRef<Socket | null>(null);
	const messagesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Connect to chat
		const socket = io(serverUrl);
		socketRef.current = socket;

		socket.on('chat-message', (message: Message) => {
			setMessages(prev => [...prev, message]);
		});

		return () => {
			socket.disconnect();
		};
	}, [serverUrl]);

	useEffect(() => {
		// Scroll to bottom on new messages
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	const sendMessage = () => {
		if (!input.trim() || !socketRef.current) return;

		socketRef.current.emit('chat-message', {
			sessionId: session?.id || 'default',
			userId: user.id,
			userName: user.name,
			message: input.trim()
		});

		setInput('');
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className="chat-panel">
			<div className="chat-header">
				<span>💬 Team Chat</span>
				<X size={18} style={{ cursor: 'pointer' }} onClick={toggleChat} />
			</div>

			<div className="chat-messages" ref={messagesRef}>
				{messages.length === 0 && (
					<div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
						No messages yet. Say hi! 👋
					</div>
				)}
				{messages.map(msg => (
					<div key={msg.id} className="chat-message">
						<div className="chat-sender">
							{msg.userName} • {formatTime(msg.timestamp)}
						</div>
						<div className="chat-content">{msg.message}</div>
					</div>
				))}
			</div>

			<div className="chat-input-area">
				<div style={{ display: 'flex', gap: 8 }}>
					<input
						className="chat-input"
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyPress={e => e.key === 'Enter' && sendMessage()}
						placeholder="Type a message..."
					/>
					<button
						onClick={sendMessage}
						style={{
							padding: '0 12px',
							background: 'var(--accent)',
							border: 'none',
							borderRadius: 6,
							cursor: 'pointer'
						}}
					>
						<Send size={16} color="#000" />
					</button>
				</div>
			</div>
		</div>
	);
}
