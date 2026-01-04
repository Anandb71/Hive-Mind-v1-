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
	const [showMentions, setShowMentions] = useState(false);
	const [mentionFilter, setMentionFilter] = useState('');
	const socketRef = useRef<Socket | null>(null);
	const messagesRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const socket = io(serverUrl);
		socketRef.current = socket;

		// Join the session room for chat
		if (session?.id) {
			socket.emit('join-session', {
				sessionId: session.id,
				userId: user.id,
				userName: user.name,
				color: user.color
			});
		}

		socket.on('chat-message', (message: Message) => {
			setMessages(prev => [...prev, message]);
		});

		return () => {
			socket.disconnect();
		};
	}, [serverUrl, session?.id, user]);

	useEffect(() => {
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

	const handleInputChange = (value: string) => {
		setInput(value);
		// Check if user is typing @mention
		const atIndex = value.lastIndexOf('@');
		if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
			const afterAt = value.substring(atIndex + 1);
			if (!afterAt.includes(' ')) {
				setShowMentions(true);
				setMentionFilter(afterAt.toLowerCase());
				return;
			}
		}
		setShowMentions(false);
	};

	const filteredParticipants = session?.participants.filter(p =>
		p.name.toLowerCase().includes(mentionFilter) && p.id !== user.id
	) || [];

	const selectMention = (name: string) => {
		const atIndex = input.lastIndexOf('@');
		const newInput = input.substring(0, atIndex) + '@' + name + ' ';
		setInput(newInput);
		setShowMentions(false);
		inputRef.current?.focus();
	};

	return (
		<div className="chat-panel">
			<div className="chat-header">
				<span>💬 Team Chat</span>
				<X size={18} style={{ cursor: 'pointer' }} onClick={toggleChat} />
			</div>

			<div className="chat-messages" ref={messagesRef}>
				{messages.length === 0 && (
					<div className="chat-empty">
						No messages yet. Say hi! 👋
					</div>
				)}
				{messages.map(msg => (
					<div key={msg.id} className={`chat-message ${msg.userId === user.id ? 'own' : ''}`}>
						<div className="chat-sender">
							{msg.userName} • {formatTime(msg.timestamp)}
						</div>
						<div className="chat-content">{msg.message}</div>
					</div>
				))}
			</div>

			<div className="chat-input-area">
				{showMentions && filteredParticipants.length > 0 && (
					<div className="mention-suggestions">
						{filteredParticipants.map(p => (
							<div
								key={p.id}
								className="mention-item"
								onClick={() => selectMention(p.name)}
							>
								<span className="mention-avatar" style={{ background: p.color }}>{p.name[0]}</span>
								<span>{p.name}</span>
							</div>
						))}
					</div>
				)}
				<input
					ref={inputRef}
					className="chat-input"
					value={input}
					onChange={e => handleInputChange(e.target.value)}
					onKeyPress={e => e.key === 'Enter' && sendMessage()}
					placeholder="Type @ to mention..."
				/>
				<button className="chat-send-btn" onClick={sendMessage} title="Send message">
					<Send size={16} />
				</button>
			</div>
		</div>
	);
}
