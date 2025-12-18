/**
 * HiveMind API Provider
 * Unified interface for multiple AI API providers
 */

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface ChatCompletionOptions {
	model: string;
	messages: ChatMessage[];
	maxTokens?: number;
	temperature?: number;
	stream?: boolean;
}

export interface ChatCompletionResponse {
	content: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	cost: number;
}

export interface StreamChunk {
	content: string;
	done: boolean;
}

export abstract class ApiProvider {
	abstract name: string;
	abstract models: string[];

	abstract complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
	abstract stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk>;

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		// Override in subclasses with actual pricing
		return 0;
	}
}

/**
 * OpenAI API Provider
 */
export class OpenAIProvider extends ApiProvider {
	name = 'OpenAI';
	models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
	private apiKey: string;
	private baseUrl = 'https://api.openai.com/v1';

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature
			})
		});

		const data = await response.json();

		return {
			content: data.choices[0].message.content,
			usage: {
				promptTokens: data.usage.prompt_tokens,
				completionTokens: data.usage.completion_tokens,
				totalTokens: data.usage.total_tokens
			},
			cost: this.calculateCost(options.model, data.usage.prompt_tokens, data.usage.completion_tokens)
		};
	}

	async *stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature,
				stream: true
			})
		});

		const reader = response.body?.getReader();
		if (!reader) return;

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') {
						yield { content: '', done: true };
						return;
					}
					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices[0].delta.content || '';
						yield { content, done: false };
					} catch {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		const pricing: Record<string, { input: number; output: number }> = {
			'gpt-4o': { input: 0.0025, output: 0.01 },
			'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
			'gpt-4-turbo': { input: 0.01, output: 0.03 }
		};
		const price = pricing[model] || { input: 0, output: 0 };
		return (promptTokens / 1000 * price.input) + (completionTokens / 1000 * price.output);
	}
}

/**
 * Anthropic API Provider
 */
export class AnthropicProvider extends ApiProvider {
	name = 'Anthropic';
	models = ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'];
	private apiKey: string;
	private baseUrl = 'https://api.anthropic.com/v1';

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		const systemMessage = options.messages.find(m => m.role === 'system');
		const otherMessages = options.messages.filter(m => m.role !== 'system');

		const response = await fetch(`${this.baseUrl}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: options.model,
				system: systemMessage?.content,
				messages: otherMessages,
				max_tokens: options.maxTokens || 4096,
				temperature: options.temperature
			})
		});

		const data = await response.json();

		return {
			content: data.content[0].text,
			usage: {
				promptTokens: data.usage.input_tokens,
				completionTokens: data.usage.output_tokens,
				totalTokens: data.usage.input_tokens + data.usage.output_tokens
			},
			cost: this.calculateCost(options.model, data.usage.input_tokens, data.usage.output_tokens)
		};
	}

	async *stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
		const systemMessage = options.messages.find(m => m.role === 'system');
		const otherMessages = options.messages.filter(m => m.role !== 'system');

		const response = await fetch(`${this.baseUrl}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: options.model,
				system: systemMessage?.content,
				messages: otherMessages,
				max_tokens: options.maxTokens || 4096,
				temperature: options.temperature,
				stream: true
			})
		});

		const reader = response.body?.getReader();
		if (!reader) return;

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					try {
						const data = JSON.parse(line.slice(6));
						if (data.type === 'content_block_delta') {
							yield { content: data.delta.text || '', done: false };
						} else if (data.type === 'message_stop') {
							yield { content: '', done: true };
							return;
						}
					} catch {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		const pricing: Record<string, { input: number; output: number }> = {
			'claude-3-5-sonnet-latest': { input: 0.003, output: 0.015 },
			'claude-3-5-haiku-latest': { input: 0.001, output: 0.005 },
			'claude-3-opus-latest': { input: 0.015, output: 0.075 }
		};
		const price = pricing[model] || { input: 0, output: 0 };
		return (promptTokens / 1000 * price.input) + (completionTokens / 1000 * price.output);
	}
}

/**
 * Google Gemini API Provider
 */
export class GeminiProvider extends ApiProvider {
	name = 'Google';
	models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
	private apiKey: string;
	private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		const contents = options.messages.map(m => ({
			role: m.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: m.content }]
		}));

		const response = await fetch(
			`${this.baseUrl}/models/${options.model}:generateContent?key=${this.apiKey}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents,
					generationConfig: {
						maxOutputTokens: options.maxTokens,
						temperature: options.temperature
					}
				})
			}
		);

		const data = await response.json();
		const usage = data.usageMetadata || {};

		return {
			content: data.candidates[0].content.parts[0].text,
			usage: {
				promptTokens: usage.promptTokenCount || 0,
				completionTokens: usage.candidatesTokenCount || 0,
				totalTokens: usage.totalTokenCount || 0
			},
			cost: this.calculateCost(options.model, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0)
		};
	}

	async *stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
		const contents = options.messages.map(m => ({
			role: m.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: m.content }]
		}));

		const response = await fetch(
			`${this.baseUrl}/models/${options.model}:streamGenerateContent?key=${this.apiKey}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents,
					generationConfig: {
						maxOutputTokens: options.maxTokens,
						temperature: options.temperature
					}
				})
			}
		);

		const reader = response.body?.getReader();
		if (!reader) return;

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				yield { content: '', done: true };
				return;
			}

			buffer += decoder.decode(value, { stream: true });

			// Gemini returns JSON array chunks
			try {
				const data = JSON.parse(buffer);
				if (Array.isArray(data)) {
					for (const item of data) {
						const text = item.candidates?.[0]?.content?.parts?.[0]?.text || '';
						yield { content: text, done: false };
					}
				}
				buffer = '';
			} catch {
				// Incomplete JSON, continue buffering
			}
		}
	}

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		const pricing: Record<string, { input: number; output: number }> = {
			'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
			'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
			'gemini-2.0-flash-exp': { input: 0, output: 0 }
		};
		const price = pricing[model] || { input: 0, output: 0 };
		return (promptTokens / 1000 * price.input) + (completionTokens / 1000 * price.output);
	}
}

/**
 * DeepSeek API Provider
 */
export class DeepSeekProvider extends ApiProvider {
	name = 'DeepSeek';
	models = ['deepseek-chat', 'deepseek-coder'];
	private apiKey: string;
	private baseUrl = 'https://api.deepseek.com/v1';

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature
			})
		});

		const data = await response.json();

		return {
			content: data.choices[0].message.content,
			usage: {
				promptTokens: data.usage.prompt_tokens,
				completionTokens: data.usage.completion_tokens,
				totalTokens: data.usage.total_tokens
			},
			cost: this.calculateCost(options.model, data.usage.prompt_tokens, data.usage.completion_tokens)
		};
	}

	async *stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature,
				stream: true
			})
		});

		const reader = response.body?.getReader();
		if (!reader) { return; }

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) { break; }

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') {
						yield { content: '', done: true };
						return;
					}
					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices[0].delta.content || '';
						yield { content, done: false };
					} catch {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		const pricing: Record<string, { input: number; output: number }> = {
			'deepseek-chat': { input: 0.00014, output: 0.00028 },
			'deepseek-coder': { input: 0.00014, output: 0.00028 }
		};
		const price = pricing[model] || { input: 0, output: 0 };
		return (promptTokens / 1000 * price.input) + (completionTokens / 1000 * price.output);
	}
}

/**
 * Mistral API Provider
 */
export class MistralProvider extends ApiProvider {
	name = 'Mistral';
	models = ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'];
	private apiKey: string;
	private baseUrl = 'https://api.mistral.ai/v1';

	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
	}

	async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature
			})
		});

		const data = await response.json();

		return {
			content: data.choices[0].message.content,
			usage: {
				promptTokens: data.usage.prompt_tokens,
				completionTokens: data.usage.completion_tokens,
				totalTokens: data.usage.total_tokens
			},
			cost: this.calculateCost(options.model, data.usage.prompt_tokens, data.usage.completion_tokens)
		};
	}

	async *stream(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: options.model,
				messages: options.messages,
				max_tokens: options.maxTokens,
				temperature: options.temperature,
				stream: true
			})
		});

		const reader = response.body?.getReader();
		if (!reader) { return; }

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) { break; }

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') {
						yield { content: '', done: true };
						return;
					}
					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices[0].delta.content || '';
						yield { content, done: false };
					} catch {
						// Skip invalid JSON
					}
				}
			}
		}
	}

	protected calculateCost(model: string, promptTokens: number, completionTokens: number): number {
		const pricing: Record<string, { input: number; output: number }> = {
			'mistral-large-latest': { input: 0.002, output: 0.006 },
			'mistral-small-latest': { input: 0.0002, output: 0.0006 },
			'codestral-latest': { input: 0.0002, output: 0.0006 }
		};
		const price = pricing[model] || { input: 0, output: 0 };
		return (promptTokens / 1000 * price.input) + (completionTokens / 1000 * price.output);
	}
}

export default ApiProvider;

