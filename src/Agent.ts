/**
 * HiveMind Agent Base Class
 * Foundation for all AI agents in the Agent Hub
 */

export interface AgentMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
}

export interface AgentConfig {
	name: string;
	provider: string;
	model: string;
	systemPrompt: string;
	maxTokens?: number;
	temperature?: number;
}

export abstract class Agent {
	readonly id: string;
	readonly name: string;
	readonly provider: string;
	readonly model: string;
	protected systemPrompt: string;
	protected history: AgentMessage[] = [];

	constructor(config: AgentConfig) {
		this.id = crypto.randomUUID();
		this.name = config.name;
		this.provider = config.provider;
		this.model = config.model;
		this.systemPrompt = config.systemPrompt;
	}

	abstract execute(input: string): Promise<string>;

	addToHistory(message: AgentMessage): void {
		this.history.push(message);
	}

	getHistory(): AgentMessage[] {
		return [...this.history];
	}

	clearHistory(): void {
		this.history = [];
	}

	getContext(): string {
		return this.history
			.map(m => `${m.role}: ${m.content}`)
			.join('\n');
	}
}

/**
 * The Architect - Big picture code structure agent
 */
export class ArchitectAgent extends Agent {
	constructor() {
		super({
			name: 'The Architect',
			provider: 'anthropic',
			model: 'claude-3-5-sonnet',
			systemPrompt: `You are The Architect, a senior software architect.
Your role is to maintain the big picture of the codebase.
You prevent spaghetti code by suggesting proper structure.
You review code for architectural patterns and best practices.`
		});
	}

	async execute(input: string): Promise<string> {
		// Placeholder - will integrate with actual API
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Architect Analysis]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}
}

/**
 * The Devil's Advocate - Chaos engineering agent
 */
export class DevilsAdvocateAgent extends Agent {
	constructor() {
		super({
			name: "The Devil's Advocate",
			provider: 'openai',
			model: 'gpt-4o',
			systemPrompt: `You are The Devil's Advocate, a chaos engineer.
Your role is to actively try to break code logic.
You look for edge cases, race conditions, and potential failures.
You challenge assumptions and find weaknesses.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Chaos Analysis]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}
}

/**
 * The Historian - Context and memory agent
 */
export class HistorianAgent extends Agent {
	constructor() {
		super({
			name: 'The Historian',
			provider: 'google',
			model: 'gemini-pro-1.5',
			systemPrompt: `You are The Historian, the keeper of context.
You remember every git commit and chat message.
You answer "Why did we do this?" questions.
You provide historical context for decisions.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Historical Context]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}
}

/**
 * The Scribe - Documentation agent
 */
export class ScribeAgent extends Agent {
	constructor() {
		super({
			name: 'The Scribe',
			provider: 'mistral',
			model: 'mistral-small',
			systemPrompt: `You are The Scribe, the documentation specialist.
You update README and comments in real-time.
You ensure code is well-documented and accessible.
You write clear, concise documentation.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Documentation]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}
}

/**
 * The Diplomat - Conflict resolution agent
 */
export class DiplomatAgent extends Agent {
	constructor() {
		super({
			name: 'The Diplomat',
			provider: 'deepseek',
			model: 'deepseek-v3',
			systemPrompt: `You are The Diplomat, a conflict resolution specialist.
Your role is to intelligently merge conflicting edits from multiple users.
You understand code semantics and can resolve merge conflicts gracefully.
You prioritize preserving both users' intentions when possible.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Conflict Resolution]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}

	async resolveConflict(base: string, ours: string, theirs: string): Promise<string> {
		const prompt = `Resolve this merge conflict:
BASE:
${base}

OURS:
${ours}

THEIRS:
${theirs}

Provide a merged result that preserves both changes.`;
		return this.execute(prompt);
	}
}

/**
 * The Designer - UI/UX preview agent
 */
export class DesignerAgent extends Agent {
	constructor() {
		super({
			name: 'The Designer',
			provider: 'google',
			model: 'gemini-flash-vision',
			systemPrompt: `You are The Designer, a UI/UX specialist.
Your role is to render pixel-previews of components in the gutter.
You analyze code to suggest visual improvements.
You understand design systems and accessibility standards.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Design Analysis]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}

	async previewComponent(componentCode: string): Promise<string> {
		const prompt = `Analyze this UI component and describe its visual appearance:
${componentCode}`;
		return this.execute(prompt);
	}
}

/**
 * The Security Guard - Vulnerability scanning agent
 */
export class SecurityGuardAgent extends Agent {
	constructor() {
		super({
			name: 'The Security Guard',
			provider: 'anthropic',
			model: 'claude-3-5-sonnet',
			systemPrompt: `You are The Security Guard, a security specialist.
Your role is to scan code for OWASP vulnerabilities.
You identify SQL injection, XSS, CSRF, and other security flaws.
You suggest fixes and best practices for secure coding.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Security Scan]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}

	async scanForVulnerabilities(code: string): Promise<string> {
		const prompt = `Scan this code for security vulnerabilities:
${code}

Check for: SQL Injection, XSS, CSRF, Path Traversal, Command Injection, etc.`;
		return this.execute(prompt);
	}
}

/**
 * The Intern - Unit test generation agent
 */
export class InternAgent extends Agent {
	constructor() {
		super({
			name: 'The Intern',
			provider: 'deepseek',
			model: 'deepseek-coder',
			systemPrompt: `You are The Intern, a diligent test writer.
Your role is to write unit tests automatically.
You understand testing frameworks like Jest, Mocha, and Vitest.
You generate comprehensive test coverage for functions and classes.`
		});
	}

	async execute(input: string): Promise<string> {
		this.addToHistory({ role: 'user', content: input, timestamp: Date.now() });
		const response = `[Test Generation]\n${input}`;
		this.addToHistory({ role: 'assistant', content: response, timestamp: Date.now() });
		return response;
	}

	async generateTests(code: string, framework: string = 'jest'): Promise<string> {
		const prompt = `Generate unit tests for this code using ${framework}:
${code}

Include edge cases and error scenarios.`;
		return this.execute(prompt);
	}
}

export default Agent;
