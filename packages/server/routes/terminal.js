/**
 * Terminal/Run Routes
 * Execute code and terminal commands
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

function terminalRoutes(projectsDir) {
	const router = express.Router();

	// Run a command in project directory
	router.post('/run', (req, res) => {
		const { project, command, cwd } = req.body;
		const workDir = path.join(projectsDir, project, cwd || '');

		// Security: Only allow safe commands
		const ALLOWED_COMMANDS = ['npm', 'node', 'npx', 'python', 'python3', 'pip', 'cargo', 'rustc', 'go', 'deno'];
		const cmd = command.split(' ')[0];

		if (!ALLOWED_COMMANDS.includes(cmd)) {
			return res.status(403).json({ error: `Command '${cmd}' not allowed for security reasons` });
		}

		const args = command.split(' ').slice(1);
		const child = spawn(cmd, args, {
			cwd: workDir,
			shell: true,
			env: { ...process.env, FORCE_COLOR: '1' }
		});

		let output = '';
		let errorOutput = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.stderr.on('data', (data) => {
			errorOutput += data.toString();
		});

		child.on('close', (code) => {
			res.json({
				exitCode: code,
				output,
				error: errorOutput,
				command,
				cwd: workDir
			});
		});

		child.on('error', (err) => {
			res.status(500).json({ error: err.message });
		});

		// Timeout after 30 seconds
		setTimeout(() => {
			child.kill();
			res.json({ error: 'Command timed out', output, exitCode: -1 });
		}, 30000);
	});

	// Install dependencies
	router.post('/install', (req, res) => {
		const { project, packageManager } = req.body;
		const workDir = path.join(projectsDir, project);
		const pm = packageManager || 'npm';

		const child = spawn(pm, ['install'], {
			cwd: workDir,
			shell: true
		});

		let output = '';
		child.stdout.on('data', (data) => { output += data; });
		child.stderr.on('data', (data) => { output += data; });

		child.on('close', (code) => {
			res.json({ exitCode: code, output });
		});
	});

	// Build project
	router.post('/build', (req, res) => {
		const { project, buildCommand } = req.body;
		const workDir = path.join(projectsDir, project);
		const cmd = buildCommand || 'npm run build';

		const child = spawn(cmd, {
			cwd: workDir,
			shell: true
		});

		let output = '';
		child.stdout.on('data', (data) => { output += data; });
		child.stderr.on('data', (data) => { output += data; });

		child.on('close', (code) => {
			res.json({ exitCode: code, output });
		});
	});

	return router;
}

module.exports = terminalRoutes;
