/**
 * Socket.io + Yjs Real-time Collaboration
 */

const Y = require('yjs');
const { LeveldbPersistence } = require('y-leveldb');
const path = require('path');

// Store Yjs documents in memory and persist to LevelDB
const docs = new Map();
const persistence = new LeveldbPersistence(path.join(__dirname, '../data/yjs-docs'));

function getYDoc(docName) {
	if (docs.has(docName)) {
		return docs.get(docName);
	}

	const doc = new Y.Doc();
	docs.set(docName, doc);

	// Load persisted state
	persistence.getYDoc(docName).then(persistedDoc => {
		const persistedState = Y.encodeStateAsUpdate(persistedDoc);
		Y.applyUpdate(doc, persistedState);
	}).catch(() => {
		// No persisted state, that's ok
	});

	// Auto-save on updates
	doc.on('update', (update, origin) => {
		persistence.storeUpdate(docName, update);
	});

	return doc;
}

function setupYjsServer(io, sessions) {
	io.on('connection', (socket) => {
		let currentRoom = null;
		let currentDocName = null;

		console.log(`[Socket] Connected: ${socket.id}`);

		// Join a session room
		socket.on('join-session', ({ sessionId, userId, userName, color }) => {
			currentRoom = sessionId;
			socket.join(sessionId);

			// Notify others
			socket.to(sessionId).emit('user-joined', { userId, userName, color });

			console.log(`[Socket] ${userName} joined session ${sessionId}`);
		});

		// Yjs document sync
		socket.on('join-document', ({ docName }) => {
			currentDocName = docName;
			const doc = getYDoc(docName);

			// Send current state to new client
			const state = Y.encodeStateAsUpdate(doc);
			socket.emit('sync-document', { docName, state: Array.from(state) });

			socket.join(`doc:${docName}`);
			console.log(`[Socket] ${socket.id} joined document: ${docName}`);
		});

		// Receive updates from client
		socket.on('document-update', ({ docName, update }) => {
			const doc = getYDoc(docName);
			const updateArray = new Uint8Array(update);

			Y.applyUpdate(doc, updateArray);

			// Broadcast to others in same document
			socket.to(`doc:${docName}`).emit('document-update', { docName, update });
		});

		// Cursor awareness
		socket.on('cursor-update', ({ sessionId, userId, cursor }) => {
			socket.to(sessionId).emit('cursor-update', { userId, cursor });
		});

		// Chat messages
		socket.on('chat-message', ({ sessionId, userId, userName, message }) => {
			io.to(sessionId).emit('chat-message', {
				id: Date.now().toString(),
				userId,
				userName,
				message,
				timestamp: Date.now()
			});
		});

		// Disconnect
		socket.on('disconnect', () => {
			if (currentRoom) {
				socket.to(currentRoom).emit('user-left', { socketId: socket.id });
			}
			console.log(`[Socket] Disconnected: ${socket.id}`);
		});
	});
}

module.exports = { setupYjsServer, getYDoc };
