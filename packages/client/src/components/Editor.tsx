import { useEffect, useState, useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { useStore } from '../store';

export function Editor() {
	const { activeFile, fileContents, setFileContent, serverUrl, session } = useStore();
	const [content, setContent] = useState('');
	const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
	const editorRef = useRef<any>(null);

	useEffect(() => {
		if (activeFile) {
			loadFileContent();
		}
	}, [activeFile]);

	const loadFileContent = async () => {
		if (!activeFile) return;

		if (fileContents[activeFile]) {
			setContent(fileContents[activeFile]);
			return;
		}

		try {
			const res = await fetch(`${serverUrl}/api/files/content/my-project/${activeFile}`);
			const data = await res.json();
			setContent(data.content);
			setFileContent(activeFile, data.content);
		} catch (err) {
			console.error('Failed to load file:', err);
		}
	};

	const handleEditorMount: OnMount = (editor) => {
		editorRef.current = editor;

		// Track cursor position
		editor.onDidChangeCursorPosition((e) => {
			setCursorPosition({
				line: e.position.lineNumber,
				column: e.position.column
			});
		});
	};

	const handleChange = (value: string | undefined) => {
		if (value !== undefined) {
			setContent(value);
			setFileContent(activeFile!, value);
			saveFile(value);
		}
	};

	const saveFile = async (value: string) => {
		if (!activeFile) return;

		try {
			await fetch(`${serverUrl}/api/files/content/my-project/${activeFile}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: value })
			});
		} catch (err) {
			console.error('Failed to save file:', err);
		}
	};

	const getLanguage = (filename: string) => {
		const ext = filename.split('.').pop();
		const langMap: Record<string, string> = {
			ts: 'typescript',
			tsx: 'typescript',
			js: 'javascript',
			jsx: 'javascript',
			json: 'json',
			css: 'css',
			html: 'html',
			md: 'markdown',
			py: 'python',
			rs: 'rust',
			go: 'go',
			c: 'c',
			cpp: 'cpp',
			java: 'java'
		};
		return langMap[ext || ''] || 'plaintext';
	};

	if (!activeFile) {
		return (
			<div className="editor-container">
				<div className="editor-empty">
					<div className="editor-empty-icon">📝</div>
					<div>Select a file to edit</div>
				</div>
				<div className="status-bar">
					<div className="status-item">🐝 HiveMind</div>
					{session && <div className="status-item">🔥 {session.participants.length} online</div>}
				</div>
			</div>
		);
	}

	return (
		<div className="editor-container">
			<div className="editor-tabs">
				<div className="tab active">
					<span>📄</span>
					<span>{activeFile.split('/').pop()}</span>
					<span className="tab-close">×</span>
				</div>
			</div>

			<div className="editor-content">
				<MonacoEditor
					height="100%"
					language={getLanguage(activeFile)}
					theme="vs-dark"
					value={content}
					onChange={handleChange}
					onMount={handleEditorMount}
					options={{
						fontSize: 14,
						fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
						minimap: { enabled: true },
						scrollBeyondLastLine: false,
						cursorBlinking: 'smooth',
						smoothScrolling: true,
						padding: { top: 16 },
						automaticLayout: true
					}}
				/>

				{session?.participants.filter(p => p.cursor).map(p => (
					<div
						key={p.id}
						className="remote-cursor"
						style={{
							left: `${(p.cursor?.column || 0) * 8 + 60}px`,
							top: `${(p.cursor?.line || 0) * 20 + 50}px`
						}}
					>
						<div className="cursor-line" style={{ background: p.color }} />
						<div className="cursor-label" style={{ background: p.color }}>{p.name}</div>
					</div>
				))}
			</div>

			<div className="status-bar">
				<div className="status-item">🐝 HiveMind</div>
				{session && <div className="status-item">🔥 {session.participants.length} online</div>}
				<div className="status-item">{getLanguage(activeFile)}</div>
				<div className="status-item right">Ln {cursorPosition.line}, Col {cursorPosition.column}</div>
			</div>
		</div>
	);
}
