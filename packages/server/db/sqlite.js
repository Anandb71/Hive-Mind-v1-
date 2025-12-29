/**
 * SQLite Database for HiveMind
 * Stores user preferences, session history, and agent configs
 */

const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDB() {
	const dbPath = path.join(__dirname, '../../data/hivemind.db');
	db = new Database(dbPath);

	// Create tables
	db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host_id TEXT NOT NULL,
      project_path TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS session_participants (
      session_id TEXT,
      user_id TEXT,
      joined_at INTEGER DEFAULT (strftime('%s', 'now')),
      left_at INTEGER,
      PRIMARY KEY (session_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY,
      total REAL DEFAULT 5.00,
      spent REAL DEFAULT 0.00,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS agent_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      agent_id TEXT,
      question TEXT,
      response TEXT,
      cost REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

	// Initialize budget if not exists
	const budget = db.prepare('SELECT * FROM budget WHERE id = 1').get();
	if (!budget) {
		db.prepare('INSERT INTO budget (id, total, spent) VALUES (1, 5.00, 0.00)').run();
	}

	console.log('[DB] SQLite initialized');
	return db;
}

function getDB() {
	return db;
}

// Helper functions
const queries = {
	// API Keys
	setApiKey: (provider, key) => {
		db.prepare('INSERT OR REPLACE INTO api_keys (provider, key, enabled) VALUES (?, ?, 1)')
			.run(provider, key);
	},
	getApiKey: (provider) => {
		const row = db.prepare('SELECT key FROM api_keys WHERE provider = ? AND enabled = 1').get(provider);
		return row?.key;
	},
	getAllApiKeys: () => {
		return db.prepare('SELECT provider, enabled FROM api_keys').all();
	},

	// Budget
	getBudget: () => {
		return db.prepare('SELECT total, spent FROM budget WHERE id = 1').get();
	},
	recordSpend: (amount) => {
		db.prepare('UPDATE budget SET spent = spent + ?, updated_at = strftime("%s", "now") WHERE id = 1')
			.run(amount);
	},
	resetBudget: (total = 5.00) => {
		db.prepare('UPDATE budget SET total = ?, spent = 0, updated_at = strftime("%s", "now") WHERE id = 1')
			.run(total);
	},

	// Sessions
	createSession: (id, name, hostId, projectPath) => {
		db.prepare('INSERT INTO sessions (id, name, host_id, project_path) VALUES (?, ?, ?, ?)')
			.run(id, name, hostId, projectPath);
	},
	endSession: (id) => {
		db.prepare('UPDATE sessions SET ended_at = strftime("%s", "now") WHERE id = ?').run(id);
	},

	// Agent History
	logAgentQuery: (sessionId, agentId, question, response, cost) => {
		db.prepare('INSERT INTO agent_history (session_id, agent_id, question, response, cost) VALUES (?, ?, ?, ?, ?)')
			.run(sessionId, agentId, question, response, cost);
	},
	getAgentHistory: (sessionId, limit = 50) => {
		return db.prepare('SELECT * FROM agent_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?')
			.all(sessionId, limit);
	}
};

module.exports = { initDB, getDB, ...queries };
