# 🐝 HiveMind IDE

**The Agentic Multiplayer IDE** - Real-time collaboration with AI agents that work alongside you.

## Features

### 🤖 Agent Hub
8 specialized AI agents:
- **The Architect** (Claude) - Code structure & architecture
- **The Devil's Advocate** (GPT-4o) - Chaos testing & edge cases
- **The Historian** (Gemini) - Context memory & git history
- **The Scribe** (Mistral) - Documentation
- **The Diplomat** (DeepSeek) - Merge conflict resolution
- **The Designer** (Gemini Flash) - UI preview
- **The Security Guard** (Claude) - Vulnerability scanning
- **The Intern** (DeepSeek) - Unit test generation

### 🔥 Campfire Mode
Real-time multiplayer coding:
- WebRTC P2P sync
- Live cursor presence
- Invite tokens with expiration
- Voice chat integration hooks

### 💰 Key Vault
- Bring your own API keys
- Session budget tracking
- Encrypted local storage

### 📄 CRDT Sync
- Conflict-free document editing
- Rust WASM engine (coming soon)
- Operation transforms

## Project Structure

```
src/
├── agents/          # AI agent implementations
├── core/            # KeyVault, AgentHub, SessionManager, ApiProviders
├── sync/            # SyncEngine, P2P, Signaling, CollaborativeSession
├── ui/              # React components
└── crdt-engine/     # Rust CRDT module
```

## Getting Started

```bash
npm install
npm run dev
```

## License

MIT
