/**
 * HiveMind Electron Main Process
 * Spawns the Node.js server and opens the app
 */

const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';
const SERVER_PORT = 3001;
const CLIENT_PORT = 5173;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 800,
		minHeight: 600,
		title: 'HiveMind IDE',
		icon: path.join(__dirname, 'icon.png'),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	// Load the app
	const url = isDev
		? `http://localhost:${CLIENT_PORT}`
		: `file://${path.join(__dirname, '../packages/client/dist/index.html')}`;

	mainWindow.loadURL(url);

	// Open external links in browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

function startServer() {
	const serverPath = path.join(__dirname, '../packages/server/index.js');

	serverProcess = spawn('node', [serverPath], {
		stdio: 'inherit',
		env: { ...process.env, PORT: SERVER_PORT }
	});

	serverProcess.on('error', (err) => {
		console.error('Failed to start server:', err);
	});

	console.log(`[Electron] Server started on port ${SERVER_PORT}`);
}

app.whenReady().then(() => {
	startServer();

	// Wait a bit for server to start
	setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
	if (serverProcess) {
		serverProcess.kill();
	}
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});

app.on('before-quit', () => {
	if (serverProcess) {
		serverProcess.kill();
	}
});
