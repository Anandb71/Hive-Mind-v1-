/**
 * HiveMind Key Vault
 * Secure storage for API keys using OS-native encryption
 */

export interface ApiKeyConfig {
	provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'mistral';
	key: string;
	budget?: number;
	enabled: boolean;
}

export interface KeyVaultStore {
	keys: Record<string, ApiKeyConfig>;
	sessionBudget: number;
	totalSpent: number;
}

export class KeyVault {
	private store: KeyVaultStore;
	private readonly storageKey = 'hivemind_keyvault';

	constructor() {
		this.store = this.load();
	}

	private load(): KeyVaultStore {
		// In real implementation, this would use OS keychain
		// For now, using localStorage as placeholder
		const stored = typeof localStorage !== 'undefined'
			? localStorage.getItem(this.storageKey)
			: null;

		if (stored) {
			return JSON.parse(stored);
		}

		return {
			keys: {},
			sessionBudget: 5.00, // Default $5 budget
			totalSpent: 0
		};
	}

	private save(): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(this.storageKey, JSON.stringify(this.store));
		}
	}

	addKey(provider: ApiKeyConfig['provider'], key: string): void {
		this.store.keys[provider] = {
			provider,
			key,
			enabled: true
		};
		this.save();
	}

	removeKey(provider: string): void {
		delete this.store.keys[provider];
		this.save();
	}

	getKey(provider: string): string | null {
		const config = this.store.keys[provider];
		return config?.enabled ? config.key : null;
	}

	setSessionBudget(amount: number): void {
		this.store.sessionBudget = amount;
		this.save();
	}

	recordSpend(amount: number): boolean {
		if (this.store.totalSpent + amount > this.store.sessionBudget) {
			return false; // Budget exceeded
		}
		this.store.totalSpent += amount;
		this.save();
		return true;
	}

	getBudgetRemaining(): number {
		return this.store.sessionBudget - this.store.totalSpent;
	}

	resetSession(): void {
		this.store.totalSpent = 0;
		this.save();
	}

	listProviders(): string[] {
		return Object.keys(this.store.keys);
	}
}

export default KeyVault;
