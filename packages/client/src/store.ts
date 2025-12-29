import { create } from 'zustand';

interface User {
	id: string;
	name: string;
	color: string;
}

interface Participant {
	id: string;
	name: string;
	color: string;
	cursor?: { line: number; column: number };
}

interface Session {
	id: string;
	name: string;
	hostName: string;
	participants: Participant[];
	serverUrl: string;
}

interface FileNode {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileNode[];
}

interface AppState {
	// Connection
	mode: 'start' | 'host' | 'join' | 'connected';
	setMode: (mode: 'start' | 'host' | 'join' | 'connected') => void;
	serverUrl: string;
	setServerUrl: (url: string) => void;

	// User
	user: User;
	setUser: (user: Partial<User>) => void;

	// Session
	session: Session | null;
	setSession: (session: Session | null) => void;

	// Files
	files: FileNode[];
	setFiles: (files: FileNode[]) => void;
	activeFile: string | null;
	setActiveFile: (file: string | null) => void;
	fileContents: Record<string, string>;
	setFileContent: (path: string, content: string) => void;

	// UI
	sidebarPanel: 'agents' | 'session' | 'files' | 'settings' | 'git';
	setSidebarPanel: (panel: 'agents' | 'session' | 'files' | 'settings' | 'git') => void;
	chatOpen: boolean;
	toggleChat: () => void;

	// Budget
	budget: number;
	spent: number;
	recordSpend: (amount: number) => void;
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffeaa7', '#a29bfe', '#fd79a8', '#74b9ff', '#55efc4', '#fab1a0'];

export const useStore = create<AppState>((set) => ({
	// Connection
	mode: 'start',
	setMode: (mode) => set({ mode }),
	serverUrl: 'http://localhost:3001',
	setServerUrl: (url) => set({ serverUrl: url }),

	// User
	user: {
		id: Math.random().toString(36).substring(2, 8),
		name: '',
		color: COLORS[Math.floor(Math.random() * COLORS.length)]
	},
	setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),

	// Session
	session: null,
	setSession: (session) => set({ session }),

	// Files
	files: [],
	setFiles: (files) => set({ files }),
	activeFile: null,
	setActiveFile: (file) => set({ activeFile: file }),
	fileContents: {},
	setFileContent: (path, content) => set((state) => ({
		fileContents: { ...state.fileContents, [path]: content }
	})),

	// UI
	sidebarPanel: 'files',
	setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
	chatOpen: false,
	toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),

	// Budget
	budget: 5.00,
	spent: 0,
	recordSpend: (amount) => set((state) => ({ spent: state.spent + amount }))
}));
