/**
 * HiveMind Provider Factory
 * Creates API providers from stored keys
 */

import KeyVault from './KeyVault';
import {
	ApiProvider,
	OpenAIProvider,
	AnthropicProvider,
	GeminiProvider,
	DeepSeekProvider,
	MistralProvider
} from './ApiProvider';

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral';

export interface ProviderConfig {
	type: ProviderType;
	apiKey: string;
}

export class ProviderFactory {
	private keyVault: KeyVault;
	private providers: Map<ProviderType, ApiProvider> = new Map();

	constructor(keyVault: KeyVault) {
		this.keyVault = keyVault;
	}

	createProvider(type: ProviderType): ApiProvider | null {
		const key = this.keyVault.getKey(type);
		if (!key) {
			return null;
		}

		switch (type) {
			case 'openai':
				return new OpenAIProvider(key);
			case 'anthropic':
				return new AnthropicProvider(key);
			case 'google':
				return new GeminiProvider(key);
			case 'deepseek':
				return new DeepSeekProvider(key);
			case 'mistral':
				return new MistralProvider(key);
			default:
				return null;
		}
	}

	getProvider(type: ProviderType): ApiProvider | null {
		if (this.providers.has(type)) {
			return this.providers.get(type) || null;
		}

		const provider = this.createProvider(type);
		if (provider) {
			this.providers.set(type, provider);
		}
		return provider;
	}

	getAvailableProviders(): ProviderType[] {
		const available: ProviderType[] = [];
		const types: ProviderType[] = ['openai', 'anthropic', 'google', 'deepseek', 'mistral'];

		for (const type of types) {
			if (this.keyVault.getKey(type)) {
				available.push(type);
			}
		}
		return available;
	}

	getProviderForModel(model: string): ApiProvider | null {
		const modelToProvider: Record<string, ProviderType> = {
			'gpt-4o': 'openai',
			'gpt-4o-mini': 'openai',
			'gpt-4-turbo': 'openai',
			'gpt-3.5-turbo': 'openai',
			'claude-3-5-sonnet-latest': 'anthropic',
			'claude-3-5-haiku-latest': 'anthropic',
			'claude-3-opus-latest': 'anthropic',
			'gemini-1.5-pro': 'google',
			'gemini-1.5-flash': 'google',
			'gemini-2.0-flash-exp': 'google',
			'deepseek-chat': 'deepseek',
			'deepseek-coder': 'deepseek',
			'mistral-large-latest': 'mistral',
			'mistral-small-latest': 'mistral',
			'codestral-latest': 'mistral'
		};

		const providerType = modelToProvider[model];
		if (!providerType) {
			return null;
		}

		return this.getProvider(providerType);
	}

	clearCache(): void {
		this.providers.clear();
	}
}

export default ProviderFactory;
