/**
 * Git Routes
 * Version control operations
 */

const express = require('express');
const { execSync, spawn } = require('child_process');
const path = require('path');

function gitRoutes(projectsDir) {
	const router = express.Router();

	// Git status
	router.get('/status/:project', (req, res) => {
		const workDir = path.join(projectsDir, req.params.project);
		try {
			const status = execSync('git status --porcelain', { cwd: workDir, encoding: 'utf-8' });
			const branch = execSync('git branch --show-current', { cwd: workDir, encoding: 'utf-8' }).trim();

			const changes = status.split('\n').filter(Boolean).map(line => ({
				status: line.substring(0, 2).trim(),
				file: line.substring(3)
			}));

			res.json({ branch, changes, isRepo: true });
		} catch (err) {
			res.json({ isRepo: false, error: 'Not a git repository' });
		}
	});

	// Git log
	router.get('/log/:project', (req, res) => {
		const workDir = path.join(projectsDir, req.params.project);
		const limit = req.query.limit || 20;

		try {
			const log = execSync(
				`git log --oneline -n ${limit} --format="%h|%s|%an|%ar"`,
				{ cwd: workDir, encoding: 'utf-8' }
			);

			const commits = log.split('\n').filter(Boolean).map(line => {
				const [hash, message, author, time] = line.split('|');
				return { hash, message, author, time };
			});

			res.json({ commits });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git init
	router.post('/init/:project', (req, res) => {
		const workDir = path.join(projectsDir, req.params.project);
		try {
			execSync('git init', { cwd: workDir });
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git add
	router.post('/add/:project', (req, res) => {
		const { files } = req.body; // array of files or '.'
		const workDir = path.join(projectsDir, req.params.project);

		try {
			const filesToAdd = Array.isArray(files) ? files.join(' ') : files || '.';
			execSync(`git add ${filesToAdd}`, { cwd: workDir });
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git commit
	router.post('/commit/:project', (req, res) => {
		const { message } = req.body;
		const workDir = path.join(projectsDir, req.params.project);

		if (!message) {
			return res.status(400).json({ error: 'Commit message required' });
		}

		try {
			execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: workDir });
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git push
	router.post('/push/:project', (req, res) => {
		const workDir = path.join(projectsDir, req.params.project);

		try {
			execSync('git push', { cwd: workDir });
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git pull
	router.post('/pull/:project', (req, res) => {
		const workDir = path.join(projectsDir, req.params.project);

		try {
			const output = execSync('git pull', { cwd: workDir, encoding: 'utf-8' });
			res.json({ success: true, output });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Git diff
	router.get('/diff/:project', (req, res) => {
		const { file } = req.query;
		const workDir = path.join(projectsDir, req.params.project);

		try {
			const diff = execSync(`git diff ${file || ''}`, { cwd: workDir, encoding: 'utf-8' });
			res.json({ diff });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	return router;
}

module.exports = gitRoutes;
