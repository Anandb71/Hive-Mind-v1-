/**
 * HiveMind UI - Key Vault Settings Panel
 * UI for managing API keys and budget
 */

import React from 'react';

export interface ApiKeyEntry {
	provider: string;
	key: string;
	enabled: boolean;
	displayName: string;
}

interface KeyVaultSettingsProps {
	keys: ApiKeyEntry[];
	budget: number;
	spent: number;
	onAddKey: (provider: string, key: string) => void;
	onRemoveKey: (provider: string) => void;
	onToggleKey: (provider: string, enabled: boolean) => void;
	onSetBudget: (amount: number) => void;
	onResetSpending: () => void;
}

const PROVIDERS = [
	{ id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
	{ id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
	{ id: 'google', name: 'Google AI', placeholder: 'AIza...' },
	{ id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
	{ id: 'mistral', name: 'Mistral', placeholder: '...' }
];

export const KeyVaultSettings: React.FC<KeyVaultSettingsProps> = ({
	keys,
	budget,
	spent,
	onAddKey,
	onRemoveKey,
	onToggleKey,
	onSetBudget,
	onResetSpending
}) => {
	const [newProvider, setNewProvider] = React.useState('');
	const [newKey, setNewKey] = React.useState('');
	const [showKey, setShowKey] = React.useState<Record<string, boolean>>({});

	const handleAddKey = () => {
		if (newProvider && newKey) {
			onAddKey(newProvider, newKey);
			setNewProvider('');
			setNewKey('');
		}
	};

	const maskKey = (key: string): string => {
		if (key.length <= 8) return '••••••••';
		return key.slice(0, 4) + '••••' + key.slice(-4);
	};

	return (
		<div className="keyvault-settings" style={{
			padding: '16px',
			backgroundColor: 'var(--vscode-editor-background)',
			color: 'var(--vscode-foreground)'
		}}>
			<h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
				🔐 Key Vault
			</h2>

			{/* Budget Section */}
			<div className="budget-section" style={{
				marginBottom: '20px',
				padding: '12px',
				backgroundColor: 'var(--vscode-input-background)',
				borderRadius: '6px'
			}}>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
					<span style={{ fontWeight: 500 }}>Session Budget</span>
					<span style={{ color: spent > budget * 0.8 ? '#FF6B6B' : '#4ECDC4' }}>
						${(budget - spent).toFixed(2)} remaining
					</span>
				</div>

				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<input
						type="number"
						value={budget}
						onChange={(e) => onSetBudget(parseFloat(e.target.value) || 0)}
						min="0"
						step="0.5"
						style={{
							flex: 1,
							padding: '6px 10px',
							backgroundColor: 'var(--vscode-input-background)',
							border: '1px solid var(--vscode-input-border)',
							borderRadius: '4px',
							color: 'var(--vscode-input-foreground)'
						}}
					/>
					<button
						onClick={onResetSpending}
						style={{
							padding: '6px 12px',
							backgroundColor: 'var(--vscode-button-secondaryBackground)',
							color: 'var(--vscode-button-secondaryForeground)',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px'
						}}
					>
						Reset
					</button>
				</div>

				<div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginTop: '4px' }}>
					Spent: ${spent.toFixed(2)}
				</div>
			</div>

			{/* Current Keys */}
			<div className="keys-list" style={{ marginBottom: '20px' }}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500 }}>
					API Keys
				</h3>

				{keys.length === 0 ? (
					<p style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
						No API keys configured
					</p>
				) : (
					keys.map(entry => (
						<div
							key={entry.provider}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px',
								marginBottom: '4px',
								backgroundColor: 'var(--vscode-input-background)',
								borderRadius: '4px'
							}}
						>
							<input
								type="checkbox"
								checked={entry.enabled}
								onChange={(e) => onToggleKey(entry.provider, e.target.checked)}
							/>
							<span style={{ flex: 1, fontSize: '13px' }}>
								{entry.displayName}
							</span>
							<code style={{
								fontSize: '11px',
								color: 'var(--vscode-descriptionForeground)',
								cursor: 'pointer'
							}}
								onClick={() => setShowKey(prev => ({ ...prev, [entry.provider]: !prev[entry.provider] }))}
							>
								{showKey[entry.provider] ? entry.key : maskKey(entry.key)}
							</code>
							<button
								onClick={() => onRemoveKey(entry.provider)}
								style={{
									padding: '2px 6px',
									backgroundColor: 'transparent',
									color: '#FF6B6B',
									border: '1px solid #FF6B6B',
									borderRadius: '3px',
									cursor: 'pointer',
									fontSize: '10px'
								}}
							>
								×
							</button>
						</div>
					))
				)}
			</div>

			{/* Add New Key */}
			<div className="add-key" style={{
				padding: '12px',
				backgroundColor: 'var(--vscode-input-background)',
				borderRadius: '6px'
			}}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500 }}>
					Add New Key
				</h3>
				<select
					value={newProvider}
					onChange={(e) => setNewProvider(e.target.value)}
					style={{
						width: '100%',
						padding: '6px 10px',
						marginBottom: '8px',
						backgroundColor: 'var(--vscode-input-background)',
						border: '1px solid var(--vscode-input-border)',
						borderRadius: '4px',
						color: 'var(--vscode-input-foreground)'
					}}
				>
					<option value="">Select provider...</option>
					{PROVIDERS.filter(p => !keys.find(k => k.provider === p.id)).map(p => (
						<option key={p.id} value={p.id}>{p.name}</option>
					))}
				</select>

				<input
					type="password"
					value={newKey}
					onChange={(e) => setNewKey(e.target.value)}
					placeholder={PROVIDERS.find(p => p.id === newProvider)?.placeholder || 'API Key...'}
					style={{
						width: '100%',
						padding: '6px 10px',
						marginBottom: '8px',
						backgroundColor: 'var(--vscode-input-background)',
						border: '1px solid var(--vscode-input-border)',
						borderRadius: '4px',
						color: 'var(--vscode-input-foreground)'
					}}
				/>

				<button
					onClick={handleAddKey}
					disabled={!newProvider || !newKey}
					style={{
						width: '100%',
						padding: '8px',
						backgroundColor: newProvider && newKey ? 'var(--vscode-button-background)' : 'var(--vscode-button-secondaryBackground)',
						color: 'var(--vscode-button-foreground)',
						border: 'none',
						borderRadius: '4px',
						cursor: newProvider && newKey ? 'pointer' : 'not-allowed',
						fontSize: '13px'
					}}
				>
					Add Key
				</button>
			</div>

			<p style={{
				fontSize: '11px',
				color: 'var(--vscode-descriptionForeground)',
				marginTop: '12px',
				textAlign: 'center'
			}}>
				🔒 Keys are stored locally using OS-native encryption
			</p>
		</div>
	);
};

export default KeyVaultSettings;
