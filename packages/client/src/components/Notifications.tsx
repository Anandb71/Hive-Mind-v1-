/**
 * Notifications System
 * Toast notifications for IDE actions
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

interface NotificationContextType {
	notifications: Notification[];
	addNotification: (type: NotificationType, message: string, duration?: number) => void;
	removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const addNotification = useCallback((type: NotificationType, message: string, duration = 4000) => {
		const id = Math.random().toString(36).substring(2, 10);
		setNotifications(prev => [...prev, { id, type, message, duration }]);

		if (duration > 0) {
			setTimeout(() => {
				removeNotification(id);
			}, duration);
		}
	}, []);

	const removeNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	}, []);

	return (
		<NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
			{children}
			<NotificationContainer />
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within NotificationProvider');
	}
	return context;
}

function NotificationContainer() {
	const { notifications, removeNotification } = useNotifications();

	const getIcon = (type: NotificationType) => {
		switch (type) {
			case 'success': return <CheckCircle size={18} />;
			case 'error': return <XCircle size={18} />;
			case 'warning': return <AlertCircle size={18} />;
			case 'info': return <Info size={18} />;
		}
	};

	return (
		<div className="notification-container">
			{notifications.map(notification => (
				<div
					key={notification.id}
					className={`notification notification-${notification.type}`}
				>
					<span className="notification-icon">{getIcon(notification.type)}</span>
					<span className="notification-message">{notification.message}</span>
					<button
						className="notification-close"
						onClick={() => removeNotification(notification.id)}
					>
						<X size={14} />
					</button>
				</div>
			))}
		</div>
	);
}

export function notify(type: NotificationType, message: string) {
	const event = new CustomEvent('hivemind-notification', {
		detail: { type, message }
	});
	window.dispatchEvent(event);
}
