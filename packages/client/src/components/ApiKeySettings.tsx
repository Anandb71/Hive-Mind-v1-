import { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

const PROVIDERS = [
	{ id: 'openai', name: 'OpenAI', placeholder: 'sk-...', docs: 'https://platform.openai.com/api-keys' },
	{ id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', docs: 'https://console.anthropic.com/' },
	{ id: 'google', name: 'Google AI', placeholder: 'AI...', docs: 'https://aistudio.google.com/app/apikey' },
	{ id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...', docs: 'https://platform.deepseek.com/' },
	{ id: 'mistral', name: 'Mistral', placeholder: 'sk-...', docs: 'https://console.mistral.ai/' }
];

export function ApiKeySettings() {
	const { serverUrl, budget, spent } = useStore();
	const [keys, setKeys] = useState<Record<string, string>>({});
	const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
	const [savedKeys, setSavedKeys] = useState<string[]>([]);
	const [newBudget, setNewBudget] = useState(budget.toString());
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadSavedKeys();
	}, []);

	const loadSavedKeys = async () => {
		try {
			const res = await fetch(`${serverUrl}/api/keys`);
			if (res.ok) {
				const data = await res.json();
				setSavedKeys(data.providers || []);
			}
		} catch (err) {
			console.error('Failed to load keys:', err);
		}
	};

	const saveKey = async (provider: string) => {
		const key = keys[provider];
		if (!key) return;

		setSaving(true);
		try {
			const res = await fetch(`${serverUrl}/api/keys/${provider}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ key })
			});

			if (res.ok) {
				setSavedKeys(prev => [...prev.filter(p => p !== provider), provider]);
				setKeys(prev => ({ ...prev, [provider]: '' }));
			}
		} catch (err) {
			console.error('Failed to save key:', err);
		}
		setSaving(false);
	};

	const updateBudget = async () => {
		try {
			await fetch(`${serverUrl}/api/budget`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ total: parseFloat(newBudget) })
			});
		} catch (err) {
			console.error('Failed to update budget:', err);
		}
	};

	return (
		<div className="settings-panel">
			<div className="settings-section">
				<div className="section-title">
					<Key size={14} /> API Keys
				</div>
				<p className="settings-info">
					Add your API keys to enable real AI agents. Keys are stored securely in SQLite.
				</p>

				{PROVIDERS.map(provider => (
					<div key={provider.id} className="key-row">
						<div className="key-header">
							<span className="key-name">{provider.name}</span>
							{savedKeys.includes(provider.id) && (
								<span className="key-saved"><Check size={12} /> Saved</span>
							)}
							<a href={provider.docs} target="_blank" rel="noopener" className="key-link">
								Get Key →
							</a>
						</div>
						<div className="key-input-row">
							<input
								type={showKeys[provider.id] ? 'text' : 'password'}
								value={keys[provider.id] || ''}
								onChange={e => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
								placeholder={savedKeys.includes(provider.id) ? '••••••••••••' : provider.placeholder}
							/>
							<button
								className="icon-btn"
								onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
							>
								{showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
							</button>
							<button
								className="save-btn"
								onClick={() => saveKey(provider.id)}
								disabled={!keys[provider.id] || saving}
							>
								<Save size={14} />
							</button>
						</div>
					</div>
				))}
			</div>

			<div className="settings-section">
				<div className="section-title">💰 Budget</div>
				<div className="budget-info">
					<div>Spent: ${spent.toFixed(2)} / ${budget.toFixed(2)}</div>
					<div className="budget-bar">
						<div className="budget-fill" style={{ width: `${(spent / budget) * 100}%` }} />
					</div>
				</div>
				<div className="budget-input-row">
					<span>$</span>
					<input
						type="number"
						value={newBudget}
						onChange={e => setNewBudget(e.target.value)}
						min="0"
						step="0.5"
					/>
					<button onClick={updateBudget}>Update</button>
				</div>
			</div>

			<div className="settings-section">
				<div className="section-title">🔒 Security</div>
				<ul className="security-info">
					<li><Check size={12} /> API keys stored locally in SQLite</li>
					<li><Check size={12} /> Keys never sent to any external servers</li>
					<li><Check size={12} /> Terminal commands restricted to safe list</li>
					<li><AlertCircle size={12} /> Keys transmitted over local network (use HTTPS in production)</li>
				</ul>
			</div>
		</div>
	);
}
