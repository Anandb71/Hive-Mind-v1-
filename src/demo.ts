/**
 * HiveMind Demo/Test Script
 * Run with: npx tsx hivemind/demo.ts
 */

import { KeyVault } from './core/KeyVault';
import { AgentHub } from './core/AgentHub';
import { SessionManager } from './core/SessionManager';
import { ProviderFactory } from './core/ProviderFactory';
import { CollaborativeSession } from './sync/CollaborativeSession';

async function main() {
	console.log('\n🐝 HiveMind IDE Demo\n');
	console.log('━'.repeat(50));

	// Initialize KeyVault
	const keyVault = new KeyVault();
	keyVault.setSessionBudget(10.00);
	console.log('✓ KeyVault initialized (budget: $10.00)');

	// Initialize AgentHub
	const agentHub = new AgentHub(keyVault);
	const agents = agentHub.listAgents();
	console.log(`✓ AgentHub initialized (${agents.length} agents loaded)`);

	for (const agent of agents) {
		console.log(`  - ${agent.name} (${agent.provider}/${agent.model})`);
	}

	// Initialize SessionManager
	const sessionManager = new SessionManager(keyVault);
	console.log('✓ SessionManager initialized');

	// Create a demo session
	const session = sessionManager.createSession({
		name: 'Demo Campfire',
		hostId: 'demo-user',
		allowGuests: true
	});
	console.log(`✓ Session created: ${session.id}`);
	console.log(`  Invite link: ${session.getInviteLink()}`);

	// Enable voice chat
	session.enableVoiceChat();
	console.log('✓ Voice chat enabled');

	// Create invite token
	const token = session.createInviteToken({ maxUses: 5 });
	console.log(`✓ Invite token: ${token}`);

	// Validate token
	const isValid = session.validateInviteToken(token);
	console.log(`✓ Token validation: ${isValid ? 'PASS' : 'FAIL'}`);

	// Initialize ProviderFactory
	const providerFactory = new ProviderFactory(keyVault);
	const available = providerFactory.getAvailableProviders();
	console.log(`✓ ProviderFactory initialized (${available.length} providers available)`);

	// Initialize CollaborativeSession
	const collabSession = new CollaborativeSession({
		sessionId: session.id,
		userId: 'demo-user',
		username: 'Demo User',
		color: '#4ECDC4'
	});
	console.log('✓ CollaborativeSession initialized');

	// Create a test document
	const doc = collabSession.createDocument('test-doc', 'Hello, HiveMind!');
	console.log(`✓ Document created: ${doc.id}`);
	console.log(`  Content: "${doc.content}"`);

	// Perform some edits
	collabSession.insert('test-doc', 18, ' Ready to code.');
	const updatedDoc = collabSession.getDocument('test-doc');
	console.log(`✓ Document edited`);
	console.log(`  Content: "${updatedDoc?.content}"`);

	// Show cursors
	collabSession.updateCursor(24);
	const cursors = collabSession.getCursors();
	console.log(`✓ Cursor updated (${cursors.length} active)`);

	// Get session status
	const status = session.getStatus();
	console.log('\n━'.repeat(50));
	console.log('Session Status:');
	console.log(`  Name: ${status.name}`);
	console.log(`  Participants: ${status.participants}`);
	console.log(`  Budget Remaining: $${status.budgetRemaining.toFixed(2)}`);
	console.log(`  Active: ${status.isActive}`);

	console.log('\n━'.repeat(50));
	console.log('✅ HiveMind demo completed successfully!\n');

	// Cleanup
	collabSession.disconnect();
	sessionManager.endSession(session.id);
}

main().catch(console.error);
