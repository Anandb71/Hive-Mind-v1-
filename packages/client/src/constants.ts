export const KEYBOARD_SHORTCUTS = {
	SAVE: 'Ctrl+S',
	QUICK_OPEN: 'Ctrl+P',
	COMMAND_PALETTE: 'Ctrl+Shift+P',
	TOGGLE_SIDEBAR: 'Ctrl+B',
	TOGGLE_TERMINAL: 'Ctrl+`',
	NEW_FILE: 'Ctrl+N',
	CLOSE_TAB: 'Ctrl+W',
	FIND: 'Ctrl+F',
	FIND_REPLACE: 'Ctrl+H',
	GOTO_LINE: 'Ctrl+G',
	UNDO: 'Ctrl+Z',
	REDO: 'Ctrl+Y',
	FORMAT: 'Shift+Alt+F',
	COMMENT: 'Ctrl+/',
	DUPLICATE_LINE: 'Shift+Alt+Down'
} as const;

export const FILE_ICONS: Record<string, string> = {
	ts: '📘',
	tsx: '⚛️',
	js: '📒',
	jsx: '⚛️',
	json: '📋',
	css: '🎨',
	html: '🌐',
	md: '📝',
	py: '🐍',
	rs: '🦀',
	go: '🐹',
	java: '☕',
	default: '📄'
};

export const AGENT_ICONS: Record<string, string> = {
	architect: '🏛️',
	devil: '😈',
	historian: '📚',
	scribe: '✍️',
	security: '🛡️',
	intern: '👶'
};

export const THEME_NAMES = ['dark', 'light', 'midnight', 'forest', 'sunset'] as const;
export type ThemeName = typeof THEME_NAMES[number];

export const API_ENDPOINTS = {
	SESSION_CREATE: '/api/session/create',
	SESSION_JOIN: '/api/session/:id/join',
	FILES: '/api/files',
	TERMINAL: '/api/terminal',
	GIT: '/api/git',
	AI_ASK: '/api/ai/ask/:agentId',
	AI_AGENTS: '/api/ai/agents',
	KEYS: '/api/keys',
	BUDGET: '/api/budget'
} as const;
