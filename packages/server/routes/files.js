/**
 * File System Routes
 * Read/write files from the local projects folder
 */

const express = require('express');
const fs = require('fs/promises');
const path = require('path');

function fileRoutes(projectsDir) {
	const router = express.Router();

	// Ensure projects directory exists
	fs.mkdir(projectsDir, { recursive: true }).catch(() => { });

	// List all projects
	router.get('/projects', async (req, res) => {
		try {
			const items = await fs.readdir(projectsDir, { withFileTypes: true });
			const projects = items
				.filter(item => item.isDirectory())
				.map(item => ({ name: item.name, type: 'project' }));
			res.json(projects);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Get file tree for a project
	router.get('/tree/:project', async (req, res) => {
		const projectPath = path.join(projectsDir, req.params.project);

		try {
			const tree = await buildFileTree(projectPath, '');
			res.json(tree);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Read file content
	router.get('/content/:project/*', async (req, res) => {
		const filePath = path.join(projectsDir, req.params.project, req.params[0]);

		try {
			const content = await fs.readFile(filePath, 'utf-8');
			res.json({ content, path: req.params[0] });
		} catch (err) {
			res.status(404).json({ error: 'File not found' });
		}
	});

	// Save file content
	router.put('/content/:project/*', async (req, res) => {
		const filePath = path.join(projectsDir, req.params.project, req.params[0]);

		try {
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, req.body.content, 'utf-8');
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Create new file
	router.post('/create/:project/*', async (req, res) => {
		const filePath = path.join(projectsDir, req.params.project, req.params[0]);

		try {
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, req.body.content || '', 'utf-8');
			res.json({ success: true, path: req.params[0] });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Delete file
	router.delete('/delete/:project/*', async (req, res) => {
		const filePath = path.join(projectsDir, req.params.project, req.params[0]);

		try {
			await fs.unlink(filePath);
			res.json({ success: true });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	// Create new project
	router.post('/projects', async (req, res) => {
		const { name } = req.body;
		const projectPath = path.join(projectsDir, name);

		try {
			await fs.mkdir(projectPath, { recursive: true });
			// Create a sample file
			await fs.writeFile(
				path.join(projectPath, 'main.ts'),
				'// Welcome to HiveMind!\nconsole.log("Hello, World!");'
			);
			res.json({ success: true, name });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});

	return router;
}

async function buildFileTree(basePath, relativePath) {
	const fullPath = path.join(basePath, relativePath);
	const items = await fs.readdir(fullPath, { withFileTypes: true });

	const tree = [];

	for (const item of items) {
		if (item.name.startsWith('.') || item.name === 'node_modules') continue;

		const itemPath = path.join(relativePath, item.name);

		if (item.isDirectory()) {
			tree.push({
				name: item.name,
				path: itemPath,
				type: 'directory',
				children: await buildFileTree(basePath, itemPath)
			});
		} else {
			tree.push({
				name: item.name,
				path: itemPath,
				type: 'file'
			});
		}
	}

	return tree.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}

module.exports = fileRoutes;
