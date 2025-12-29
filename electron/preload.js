/**
 * Preload script for Electron
 * Exposes safe APIs to renderer
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('hivemind', {
	platform: process.platform,
	isElectron: true
});
