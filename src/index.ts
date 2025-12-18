/**
 * HiveMind - The Agentic IDE
 * Main exports
 */

// Core
export { KeyVault } from './core/KeyVault';
export { AgentHub } from './core/AgentHub';
export { Session, SessionManager } from './core/SessionManager';

// Agents
export {
	Agent,
	ArchitectAgent,
	DevilsAdvocateAgent,
	HistorianAgent,
	ScribeAgent,
	DiplomatAgent,
	DesignerAgent,
	SecurityGuardAgent,
	InternAgent
} from './agents/Agent';

// Sync
export { SyncEngine } from './sync/SyncEngine';
export type {
	Operation,
	DocumentState,
	Cursor
} from './sync/SyncEngine';

// Types
export type { ApiKeyConfig, KeyVaultStore } from './core/KeyVault';
export type { AgentTask } from './core/AgentHub';
export type { Participant, SessionConfig } from './core/SessionManager';
export type { AgentMessage, AgentConfig } from './agents/Agent';
