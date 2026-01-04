/**
 * File Operations Component
 * Create, rename, delete files and folders
 */

import { useState } from 'react';
import { Plus, FolderPlus, Trash2, Edit3, X, Check } from 'lucide-react';
import { useStore } from '../store';

interface FileOpsProps {
	onRefresh: () => void;
}

export function FileOps({ onRefresh }: FileOpsProps) {
	const { serverUrl } = useStore();
	const [showNewFile, setShowNewFile] = useState(false);
	const [showNewFolder, setShowNewFolder] = useState(false);
	const [newName, setNewName] = useState('');
	const [error, setError] = useState('');

	const createFile = async () => {
		if (!newName.trim()) {
			setError('Name is required');
			return;
		}

		try {
			const res = await fetch(`${serverUrl}/api/files/content/my-project/${newName}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: '' })
			});

			if (res.ok) {
				setNewName('');
				setShowNewFile(false);
				setError('');
				onRefresh();
			} else {
				setError('Failed to create file');
			}
		} catch {
			setError('Server error');
		}
	};

	const createFolder = async () => {
		if (!newName.trim()) {
			setError('Name is required');
			return;
		}

		try {
			const res = await fetch(`${serverUrl}/api/files/folder/my-project`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName })
			});

			if (res.ok) {
				setNewName('');
				setShowNewFolder(false);
				setError('');
				onRefresh();
			} else {
				setError('Failed to create folder');
			}
		} catch {
			setError('Server error');
		}
	};

	const deleteFile = async (path: string) => {
		if (!confirm(`Delete ${path}?`)) return;

		try {
			const res = await fetch(`${serverUrl}/api/files/content/my-project/${path}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				onRefresh();
			}
		} catch {
			setError('Failed to delete');
		}
	};

	return (
		<div className="file-ops">
			<div className="file-ops-buttons">
				<button
					className="file-op-btn"
					onClick={() => { setShowNewFile(true); setShowNewFolder(false); }}
					title="New File"
				>
					<Plus size={14} />
				</button>
				<button
					className="file-op-btn"
					onClick={() => { setShowNewFolder(true); setShowNewFile(false); }}
					title="New Folder"
				>
					<FolderPlus size={14} />
				</button>
			</div>

			{(showNewFile || showNewFolder) && (
				<div className="file-ops-input">
					<input
						type="text"
						value={newName}
						onChange={e => setNewName(e.target.value)}
						placeholder={showNewFile ? 'filename.ts' : 'folder-name'}
						autoFocus
						onKeyPress={e => {
							if (e.key === 'Enter') {
								showNewFile ? createFile() : createFolder();
							}
						}}
					/>
					<button onClick={showNewFile ? createFile : createFolder}>
						<Check size={14} />
					</button>
					<button onClick={() => { setShowNewFile(false); setShowNewFolder(false); setNewName(''); }}>
						<X size={14} />
					</button>
				</div>
			)}

			{error && <div className="file-ops-error">{error}</div>}
		</div>
	);
}

