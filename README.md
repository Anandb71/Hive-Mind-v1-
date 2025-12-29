# HiveMind IDE

Local-First Multiplayer IDE with AI Agents

## Quick Start

```bash
# Install dependencies
npm install

# Run development (server + client)
npm run dev

# Or run the Electron desktop app
npm run electron:dev
```

## How It Works

### Host a Session

1. Run `npm run dev`
2. Click "Host Session"
3. Share your IP address with collaborators

### Join a Session

1. Get the host's IP (e.g., `192.168.1.x:3001`)
2. Click "Join Session"
3. Enter the IP and your name

## Architecture

```
/hivemind-local
├── /packages
│   ├── /client       # React + Vite + Monaco
│   └── /server       # Node.js + Socket.io + SQLite
├── /electron         # Desktop wrapper
└── /projects         # Local project files
```

## Features

- 🐝 **6 AI Agents** - Architect, Devil's Advocate, Historian, Scribe, Security, Intern
- 📝 **Monaco Editor** - Same as VS Code
- 🔥 **Real-time Collaboration** - Yjs CRDT sync
- 💬 **Team Chat** - Socket.io based
- 📁 **Local File System** - No cloud required
- 💾 **SQLite Database** - API keys, budget, history

## License

MIT
