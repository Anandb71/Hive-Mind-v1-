/**
 * HiveMind Agent Hub
 * Orchestrates all AI agents in the system
 */

import {
	Agent,
	ArchitectAgent,
	DevilsAdvocateAgent,
	HistorianAgent,
	ScribeAgent,
	DiplomatAgent,
	DesignerAgent,
	SecurityGuardAgent,
	InternAgent
} from '../agents/Agent';
import KeyVault from '../core/KeyVault';

export interface AgentTask {
	id: string;
	agentId: string;
	input: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	result?: string;
	error?: string;
	startTime?: number;
	endTime?: number;
}

export class AgentHub {
	private agents: Map<string, Agent> = new Map();
	private tasks: Map<string, AgentTask> = new Map();
	private keyVault: KeyVault;

	constructor(keyVault: KeyVault) {
		this.keyVault = keyVault;
		this.initializeDefaultAgents();
	}

	private initializeDefaultAgents(): void {
		const defaultAgents = [
			new ArchitectAgent(),
			new DevilsAdvocateAgent(),
			new HistorianAgent(),
			new ScribeAgent(),
			new DiplomatAgent(),
			new DesignerAgent(),
			new SecurityGuardAgent(),
			new InternAgent()
		];

		for (const agent of defaultAgents) {
			this.agents.set(agent.id, agent);
		}
	}

	registerAgent(agent: Agent): void {
		this.agents.set(agent.id, agent);
	}

	unregisterAgent(agentId: string): void {
		this.agents.delete(agentId);
	}

	getAgent(agentId: string): Agent | undefined {
		return this.agents.get(agentId);
	}

	getAgentByName(name: string): Agent | undefined {
		return Array.from(this.agents.values()).find(a => a.name === name);
	}

	listAgents(): Agent[] {
		return Array.from(this.agents.values());
	}

	async submitTask(agentId: string, input: string): Promise<AgentTask> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent ${agentId} not found`);
		}

		const task: AgentTask = {
			id: crypto.randomUUID(),
			agentId,
			input,
			status: 'pending',
			startTime: Date.now()
		};

		this.tasks.set(task.id, task);

		try {
			task.status = 'running';
			task.result = await agent.execute(input);
			task.status = 'completed';
		} catch (error) {
			task.status = 'failed';
			task.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			task.endTime = Date.now();
		}

		return task;
	}

	async askArchitect(question: string): Promise<string> {
		const agent = this.getAgentByName('The Architect');
		if (!agent) throw new Error('Architect agent not available');
		return agent.execute(question);
	}

	async challengeCode(code: string): Promise<string> {
		const agent = this.getAgentByName("The Devil's Advocate");
		if (!agent) throw new Error("Devil's Advocate agent not available");
		return agent.execute(code);
	}

	async getHistory(query: string): Promise<string> {
		const agent = this.getAgentByName('The Historian');
		if (!agent) throw new Error('Historian agent not available');
		return agent.execute(query);
	}

	async documentCode(code: string): Promise<string> {
		const agent = this.getAgentByName('The Scribe');
		if (!agent) throw new Error('Scribe agent not available');
		return agent.execute(code);
	}

	getTask(taskId: string): AgentTask | undefined {
		return this.tasks.get(taskId);
	}

	getTasksByAgent(agentId: string): AgentTask[] {
		return Array.from(this.tasks.values()).filter(t => t.agentId === agentId);
	}

	async resolveConflict(base: string, ours: string, theirs: string): Promise<string> {
		const agent = this.getAgentByName('The Diplomat') as any;
		if (!agent) throw new Error('Diplomat agent not available');
		return agent.resolveConflict(base, ours, theirs);
	}

	async previewComponent(componentCode: string): Promise<string> {
		const agent = this.getAgentByName('The Designer') as any;
		if (!agent) throw new Error('Designer agent not available');
		return agent.previewComponent(componentCode);
	}

	async scanSecurity(code: string): Promise<string> {
		const agent = this.getAgentByName('The Security Guard') as any;
		if (!agent) throw new Error('Security Guard agent not available');
		return agent.scanForVulnerabilities(code);
	}

	async generateTests(code: string, framework?: string): Promise<string> {
		const agent = this.getAgentByName('The Intern') as any;
		if (!agent) throw new Error('Intern agent not available');
		return agent.generateTests(code, framework);
	}
}

export default AgentHub;
