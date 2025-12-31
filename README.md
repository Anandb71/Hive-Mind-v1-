# 🐝 HiveMind IDE

**Local-first, collaborative IDE with AI agents for multiplayer coding.**

![HiveMind IDE](./screenshot.png)

## ✨ Features

- **🔥 Real-time Collaboration** - Code together with friends via Socket.io & Yjs
- **🤖 6 AI Agents** - Architect, Devil's Advocate, Historian, Scribe, Security Guard, Intern
- **📝 Monaco Editor** - Full VSCode-quality editing experience
- **📂 Multi-Tab Support** - Open multiple files with dirty indicators
- **💾 Auto-Save** - Debounced auto-save (1 second delay)
- **🎨 5 Themes** - Dark, Light, Midnight, Forest, Sunset
- **⌨️ Keyboard Shortcuts** - 15+ configurable shortcuts
- **🔍 Global Search** - Ctrl+P quick file search
- **📟 Terminal** - Run/build commands from the IDE
- **🌿 Git Integration** - Status, commit, push, pull

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/Anandb71/Hive-Mind-v1.git
cd Hive-Mind-v1

# Install server dependencies
cd packages/server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running

```bash
# Terminal 1: Start server
cd packages/server
node index.js

# Terminal 2: Start client
cd packages/client
npm run dev
```

Open <http://localhost:5173> → Click **Host Session** → Start coding!

## 🔧 Configuration

### AI API Keys

Add your API keys in the Settings panel:

- **OpenAI** (GPT-4o for Devil's Advocate)
- **Anthropic** (Claude 3.5 for Architect & Security Guard)
- **Google** (Gemini Pro for Historian)
- **Mistral** (for Scribe)
- **DeepSeek** (for Intern)

### Environment Variables

```bash
PORT=3001  # Server port
```

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save file |
| Ctrl+P | Quick search |
| Ctrl+Shift+P | Command palette |
| Ctrl+` | Toggle terminal |
| Ctrl+B | Toggle sidebar |

## 📦 Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Editor**: Monaco Editor
- **Backend**: Express + Socket.io
- **Collaboration**: Yjs
- **Database**: SQLite (API keys, sessions)
- **Styling**: CSS Variables + Themes

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

Built with ❤️ for developers who love coding together.
