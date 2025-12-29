import { useState } from 'react';
import { useStore } from './store';
import { IDE } from './components/IDE';
import './index.css';

function App() {
	const { mode, setMode, user, setUser, serverUrl, setServerUrl, setSession } = useStore();
	const [hostName, setHostName] = useState('');
	const [joinUrl, setJoinUrl] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleHost = async () => {
		if (!hostName.trim()) return;
		setLoading(true);
		setError('');

		try {
			const res = await fetch(`${serverUrl}/api/session/create`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Campfire', hostName: hostName.trim() })
			});

			if (!res.ok) throw new Error('Failed to create session');

			const session = await res.json();
			setUser({ name: hostName.trim() });
			setSession({ ...session, serverUrl });
			setMode('connected');
		} catch (err) {
			setError('Failed to start server. Make sure the server is running.');
		} finally {
			setLoading(false);
		}
	};

	const handleJoin = async () => {
		if (!displayName.trim() || !joinUrl.trim()) return;
		setLoading(true);
		setError('');

		try {
			// Extract session ID from URL or use as-is
			const url = joinUrl.includes('/') ? joinUrl : `http://${joinUrl}`;
			const baseUrl = new URL(url).origin;

			// Get session info
			const sessionRes = await fetch(`${baseUrl}/health`);
			if (!sessionRes.ok) throw new Error('Cannot connect to host');

			setServerUrl(baseUrl);
			setUser({ name: displayName.trim() });
			setMode('connected');
		} catch (err) {
			setError('Cannot connect to host. Check the URL and try again.');
		} finally {
			setLoading(false);
		}
	};

	if (mode === 'connected') {
		return <IDE />;
	}

	return (
		<div className="start-screen">
			{mode === 'start' && (
				<>
					<div className="start-logo">🐝</div>
					<h1 className="start-title">HiveMind</h1>
					<p className="start-subtitle">Local-First Multiplayer IDE</p>

					<div className="start-buttons">
						<button className="start-btn primary" onClick={() => setMode('host')}>
							🔥 Host Session
						</button>
						<button className="start-btn secondary" onClick={() => setMode('join')}>
							🔗 Join Session
						</button>
					</div>
				</>
			)}

			{mode === 'host' && (
				<div className="join-form">
					<h2>🔥 Host a Campfire</h2>

					<div className="form-group">
						<label>Your Name</label>
						<input
							type="text"
							value={hostName}
							onChange={e => setHostName(e.target.value)}
							placeholder="Enter your name..."
							autoFocus
						/>
					</div>

					{error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 10 }}>{error}</div>}

					<div className="form-actions">
						<button className="secondary" onClick={() => setMode('start')}>Back</button>
						<button className="primary" onClick={handleHost} disabled={loading}>
							{loading ? 'Starting...' : 'Start Hosting'}
						</button>
					</div>

					<div className="connection-info">
						<div style={{ fontSize: 12, color: '#8b949e' }}>Server URL</div>
						<div className="url">{serverUrl}</div>
						<div style={{ fontSize: 11, color: '#8b949e', marginTop: 8 }}>
							Share your network IP with collaborators
						</div>
					</div>
				</div>
			)}

			{mode === 'join' && (
				<div className="join-form">
					<h2>🔗 Join Session</h2>

					<div className="form-group">
						<label>Your Name</label>
						<input
							type="text"
							value={displayName}
							onChange={e => setDisplayName(e.target.value)}
							placeholder="Enter your name..."
							autoFocus
						/>
					</div>

					<div className="form-group">
						<label>Host URL or IP</label>
						<input
							type="text"
							value={joinUrl}
							onChange={e => setJoinUrl(e.target.value)}
							placeholder="192.168.1.x:3001 or localhost:3001"
						/>
					</div>

					{error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 10 }}>{error}</div>}

					<div className="form-actions">
						<button className="secondary" onClick={() => setMode('start')}>Back</button>
						<button className="primary" onClick={handleJoin} disabled={loading}>
							{loading ? 'Connecting...' : 'Join'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
