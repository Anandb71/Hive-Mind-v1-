import { useState } from 'react';
import { Play, Square, Terminal as TermIcon } from 'lucide-react';
import { useStore } from '../store';

export function Terminal() {
	const { serverUrl } = useStore();
	const [command, setCommand] = useState('');
	const [output, setOutput] = useState<string[]>([]);
	const [running, setRunning] = useState(false);

	const runCommand = async () => {
		if (!command.trim() || running) return;

		setRunning(true);
		setOutput(prev => [...prev, `$ ${command}`]);

		try {
			const res = await fetch(`${serverUrl}/api/terminal/run`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project: 'my-project', command })
			});

			const data = await res.json();

			if (data.error) {
				setOutput(prev => [...prev, `Error: ${data.error}`]);
			} else {
				setOutput(prev => [...prev, data.output || '(no output)', `Exit code: ${data.exitCode}`]);
			}
		} catch (err) {
			setOutput(prev => [...prev, `Failed: ${err}`]);
		}

		setCommand('');
		setRunning(false);
	};

	const runBuild = async () => {
		setRunning(true);
		setOutput(prev => [...prev, '$ npm run build']);

		try {
			const res = await fetch(`${serverUrl}/api/terminal/build`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project: 'my-project' })
			});

			const data = await res.json();
			setOutput(prev => [...prev, data.output || '(no output)', `Exit code: ${data.exitCode}`]);
		} catch (err) {
			setOutput(prev => [...prev, `Failed: ${err}`]);
		}

		setRunning(false);
	};

	const runDev = async () => {
		setRunning(true);
		setOutput(prev => [...prev, '$ npm run dev']);

		try {
			const res = await fetch(`${serverUrl}/api/terminal/run`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project: 'my-project', command: 'npm run dev' })
			});

			const data = await res.json();
			setOutput(prev => [...prev, data.output || 'Dev server started...']);
		} catch (err) {
			setOutput(prev => [...prev, `Failed: ${err}`]);
		}

		setRunning(false);
	};

	return (
		<div className="terminal-panel">
			<div className="terminal-header">
				<span><TermIcon size={14} /> Terminal</span>
				<div className="terminal-actions">
					<button onClick={runDev} disabled={running} title="Run Dev Server">
						<Play size={14} /> Run
					</button>
					<button onClick={runBuild} disabled={running} title="Build Project">
						📦 Build
					</button>
					<button onClick={() => setOutput([])} title="Clear">
						🗑️
					</button>
				</div>
			</div>

			<div className="terminal-output">
				{output.length === 0 && (
					<div className="terminal-placeholder">Terminal output will appear here...</div>
				)}
				{output.map((line, i) => (
					<div key={i} className={line.startsWith('$') ? 'terminal-command' : 'terminal-line'}>
						{line}
					</div>
				))}
			</div>

			<div className="terminal-input">
				<span className="terminal-prompt">$</span>
				<input
					value={command}
					onChange={e => setCommand(e.target.value)}
					onKeyPress={e => e.key === 'Enter' && runCommand()}
					placeholder="Type a command..."
					disabled={running}
				/>
			</div>
		</div>
	);
}
