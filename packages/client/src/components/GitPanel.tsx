import { useState, useEffect } from 'react';
import { GitBranch, GitCommit, RefreshCw } from 'lucide-react';
import { useStore } from '../store';

interface GitStatus {
	isRepo: boolean;
	branch: string;
	changes: Array<{ status: string; file: string }>;
}

interface Commit {
	hash: string;
	message: string;
	author: string;
	time: string;
}

export function GitPanel() {
	const { serverUrl } = useStore();
	const [status, setStatus] = useState<GitStatus | null>(null);
	const [commits, setCommits] = useState<Commit[]>([]);
	const [commitMessage, setCommitMessage] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		loadGitStatus();
	}, []);

	const loadGitStatus = async () => {
		try {
			const res = await fetch(`${serverUrl}/api/git/status/my-project`);
			const data = await res.json();
			setStatus(data);

			if (data.isRepo) {
				const logRes = await fetch(`${serverUrl}/api/git/log/my-project?limit=10`);
				const logData = await logRes.json();
				setCommits(logData.commits || []);
			}
		} catch (err) {
			console.error('Failed to load git status:', err);
		}
	};

	const initRepo = async () => {
		setLoading(true);
		try {
			await fetch(`${serverUrl}/api/git/init/my-project`, { method: 'POST' });
			loadGitStatus();
		} catch (err) {
			console.error('Failed to init repo:', err);
		}
		setLoading(false);
	};

	const stageAll = async () => {
		setLoading(true);
		try {
			await fetch(`${serverUrl}/api/git/add/my-project`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files: '.' })
			});
			loadGitStatus();
		} catch (err) {
			console.error('Failed to stage:', err);
		}
		setLoading(false);
	};

	const commit = async () => {
		if (!commitMessage.trim()) return;

		setLoading(true);
		try {
			await fetch(`${serverUrl}/api/git/commit/my-project`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: commitMessage })
			});
			setCommitMessage('');
			loadGitStatus();
		} catch (err) {
			console.error('Failed to commit:', err);
		}
		setLoading(false);
	};

	const push = async () => {
		setLoading(true);
		try {
			await fetch(`${serverUrl}/api/git/push/my-project`, { method: 'POST' });
			loadGitStatus();
		} catch (err) {
			console.error('Failed to push:', err);
		}
		setLoading(false);
	};

	const pull = async () => {
		setLoading(true);
		try {
			await fetch(`${serverUrl}/api/git/pull/my-project`, { method: 'POST' });
			loadGitStatus();
		} catch (err) {
			console.error('Failed to pull:', err);
		}
		setLoading(false);
	};

	if (!status?.isRepo) {
		return (
			<div className="git-panel">
				<div className="git-init-message">
					<GitBranch size={32} />
					<p>Not a git repository</p>
					<button className="btn btn-primary" onClick={initRepo} disabled={loading}>
						Initialize Repository
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="git-panel">
			<div className="git-header">
				<GitBranch size={14} />
				<span>{status.branch}</span>
				<button className="icon-btn" onClick={loadGitStatus} title="Refresh">
					<RefreshCw size={14} />
				</button>
			</div>

			<div className="git-section">
				<div className="section-title">Changes ({status.changes.length})</div>
				{status.changes.length === 0 ? (
					<div className="git-empty">No changes</div>
				) : (
					<>
						<div className="git-changes">
							{status.changes.map((change, i) => (
								<div key={i} className="git-change">
									<span className={`git-status git-status-${change.status}`}>{change.status}</span>
									<span>{change.file}</span>
								</div>
							))}
						</div>
						<button className="btn btn-secondary" onClick={stageAll} disabled={loading}>
							Stage All
						</button>
					</>
				)}
			</div>

			<div className="git-section">
				<div className="section-title">Commit</div>
				<input
					className="git-input"
					value={commitMessage}
					onChange={e => setCommitMessage(e.target.value)}
					placeholder="Commit message..."
				/>
				<div className="git-actions">
					<button className="btn btn-primary" onClick={commit} disabled={loading || !commitMessage}>
						<GitCommit size={14} /> Commit
					</button>
					<button className="btn btn-secondary" onClick={push} disabled={loading}>
						⬆️ Push
					</button>
					<button className="btn btn-secondary" onClick={pull} disabled={loading}>
						⬇️ Pull
					</button>
				</div>
			</div>

			<div className="git-section">
				<div className="section-title">Recent Commits</div>
				<div className="git-commits">
					{commits.map(c => (
						<div key={c.hash} className="git-commit">
							<span className="git-hash">{c.hash}</span>
							<span className="git-msg">{c.message}</span>
							<span className="git-time">{c.time}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
