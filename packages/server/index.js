/**
 * HiveMind Server
 * Local-first collaborative server with Socket.io + Yjs
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { setupYjsServer } = require('./socket');
const { initDB, setApiKey, getApiKey, getAllApiKeys, getBudget, recordSpend, resetBudget } = require('./db/sqlite');
const fileRoutes = require('./routes/files');
const terminalRoutes = require('./routes/terminal');
const gitRoutes = require('./routes/git');

const PORT = process.env.PORT || 3001;
const PROJECTS_DIR = path.join(__dirname, '../../projects');

const app = express();
const server = http.createServer(app);

// Socket.io with CORS for local network
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', version: '0.1.0' });
});

// File routes
app.use('/api/files', fileRoutes(PROJECTS_DIR));

// Terminal routes
app.use('/api/terminal', terminalRoutes(PROJECTS_DIR));

// Git routes
app.use('/api/git', gitRoutes(PROJECTS_DIR));

// API Key management
app.get('/api/keys', (req, res) => {
	const keys = getAllApiKeys();
	res.json({ providers: keys.map(k => k.provider) });
});

app.post('/api/keys/:provider', (req, res) => {
	const { key } = req.body;
	if (!key) return res.status(400).json({ error: 'Key required' });
	setApiKey(req.params.provider, key);
	res.json({ success: true });
});

// Budget management
app.get('/api/budget', (req, res) => {
	res.json(getBudget());
});

app.post('/api/budget', (req, res) => {
	const { total } = req.body;
	resetBudget(total);
	res.json({ success: true });
});

app.post('/api/budget/spend', (req, res) => {
	const { amount } = req.body;
	recordSpend(amount);
	res.json({ success: true });
});

// Session management
const sessions = new Map();

app.post('/api/session/create', (req, res) => {
	const { name, hostName } = req.body;
	const sessionId = Math.random().toString(36).substring(2, 10);

	sessions.set(sessionId, {
		id: sessionId,
		name: name || 'Untitled Session',
		hostName: hostName || 'Host',
		participants: [{ id: 'host', name: hostName || 'Host', color: '#ff6b6b' }],
		createdAt: Date.now()
	});

	res.json({ sessionId, ...sessions.get(sessionId) });
});

app.get('/api/session/:id', (req, res) => {
	const session = sessions.get(req.params.id);
	if (!session) return res.status(404).json({ error: 'Session not found' });
	res.json(session);
});

app.post('/api/session/:id/join', (req, res) => {
	const session = sessions.get(req.params.id);
	if (!session) return res.status(404).json({ error: 'Session not found' });

	const { name } = req.body;
	const colors = ['#4ecdc4', '#ffeaa7', '#a29bfe', '#fd79a8', '#74b9ff'];
	const participant = {
		id: Math.random().toString(36).substring(2, 8),
		name: name || 'Guest',
		color: colors[session.participants.length % colors.length]
	};

	session.participants.push(participant);
	io.to(req.params.id).emit('participant-joined', participant);

	res.json({ participant, session });
});

// Initialize Yjs WebSocket handling
setupYjsServer(io, sessions);

// Start server
async function start() {
	await initDB();

	server.listen(PORT, '0.0.0.0', () => {
		console.log(`
🐝 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HiveMind Server v0.1.0

   Local:   http://localhost:${PORT}
   Network: http://${getLocalIP()}:${PORT}

   Share the Network URL with collaborators!
🐝 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
	});
}

function getLocalIP() {
	const { networkInterfaces } = require('os');
	const nets = networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			if (net.family === 'IPv4' && !net.internal) {
				return net.address;
			}
		}
	}
	return 'localhost';
}

start().catch(console.error);
