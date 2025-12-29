/**
 * HiveMind AI Integration
 * Real API calls to OpenAI, Anthropic, etc.
 */

import { getApiKey, recordSpend } from '../db/sqlite';

const PROVIDERS = {
	openai: {
		url: 'https://api.openai.com/v1/chat/completions',
		models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
		costPer1k: { 'gpt-4o': 0.015, 'gpt-4-turbo': 0.03, 'gpt-3.5-turbo': 0.002 }
	},
	anthropic: {
		url: 'https://api.anthropic.com/v1/messages',
		models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
		costPer1k: { 'claude-3-5-sonnet-20241022': 0.015, 'claude-3-opus-20240229': 0.075, 'claude-3-haiku-20240307': 0.001 }
	},
	google: {
		url: 'https://generativelanguage.googleapis.com/v1beta/models',
		models: ['gemini-pro', 'gemini-1.5-flash'],
		costPer1k: { 'gemini-pro': 0.001, 'gemini-1.5-flash': 0.0005 }
	},
	deepseek: {
		url: 'https://api.deepseek.com/v1/chat/completions',
		models: ['deepseek-coder', 'deepseek-chat'],
		costPer1k: { 'deepseek-coder': 0.0015, 'deepseek-chat': 0.001 }
	},
	mistral: {
		url: 'https://api.mistral.ai/v1/chat/completions',
		models: ['mistral-large-latest', 'mistral-medium-latest'],
		costPer1k: { 'mistral-large-latest': 0.008, 'mistral-medium-latest': 0.003 }
	}
};

const AGENT_CONFIG = {
	architect: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', systemPrompt: 'You are The Architect, an expert in code structure and design patterns. Analyze code and suggest improvements.' },
	devil: { provider: 'openai', model: 'gpt-4o', systemPrompt: 'You are the Devil\'s Advocate. Challenge assumptions, find edge cases, and identify potential issues.' },
	historian: { provider: 'google', model: 'gemini-pro', systemPrompt: 'You are The Historian. Provide context about code decisions based on project history.' },
	scribe: { provider: 'mistral', model: 'mistral-large-latest', systemPrompt: 'You are The Scribe. Generate documentation, comments, and explanations.' },
	security: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', systemPrompt: 'You are the Security Guard. Scan code for vulnerabilities, injection risks, and security issues.' },
	intern: { provider: 'deepseek', model: 'deepseek-coder', systemPrompt: 'You are The Intern. Generate unit tests and boilerplate code.' }
};

async function callOpenAI(apiKey, model, messages) {
	const res = await fetch(PROVIDERS.openai.url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({ model, messages, max_tokens: 2000 })
	});

	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.error?.message || 'OpenAI API error');
	}

	const data = await res.json();
	const tokens = data.usage?.total_tokens || 0;
	return {
		content: data.choices[0].message.content,
		tokens,
		cost: (tokens / 1000) * (PROVIDERS.openai.costPer1k[model] || 0.01)
	};
}

async function callAnthropic(apiKey, model, messages) {
	const res = await fetch(PROVIDERS.anthropic.url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model,
			max_tokens: 2000,
			messages: messages.filter(m => m.role !== 'system').map(m => ({
				role: m.role,
				content: m.content
			})),
			system: messages.find(m => m.role === 'system')?.content || ''
		})
	});

	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.error?.message || 'Anthropic API error');
	}

	const data = await res.json();
	const tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;
	return {
		content: data.content[0].text,
		tokens,
		cost: (tokens / 1000) * (PROVIDERS.anthropic.costPer1k[model] || 0.01)
	};
}

async function callGoogle(apiKey, model, messages) {
	const url = `${PROVIDERS.google.url}/${model}:generateContent?key=${apiKey}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: messages.map(m => ({
				role: m.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: m.content }]
			}))
		})
	});

	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.error?.message || 'Google API error');
	}

	const data = await res.json();
	const tokens = data.usageMetadata?.totalTokenCount || 0;
	return {
		content: data.candidates[0].content.parts[0].text,
		tokens,
		cost: (tokens / 1000) * (PROVIDERS.google.costPer1k[model] || 0.001)
	};
}

async function callDeepSeek(apiKey, model, messages) {
	const res = await fetch(PROVIDERS.deepseek.url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({ model, messages, max_tokens: 2000 })
	});

	if (!res.ok) throw new Error('DeepSeek API error');

	const data = await res.json();
	return {
		content: data.choices[0].message.content,
		tokens: data.usage?.total_tokens || 0,
		cost: (data.usage?.total_tokens / 1000) * (PROVIDERS.deepseek.costPer1k[model] || 0.001)
	};
}

async function callMistral(apiKey, model, messages) {
	const res = await fetch(PROVIDERS.mistral.url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({ model, messages, max_tokens: 2000 })
	});

	if (!res.ok) throw new Error('Mistral API error');

	const data = await res.json();
	return {
		content: data.choices[0].message.content,
		tokens: data.usage?.total_tokens || 0,
		cost: (data.usage?.total_tokens / 1000) * (PROVIDERS.mistral.costPer1k[model] || 0.005)
	};
}

async function askAgent(agentId, question, context = '') {
	const config = AGENT_CONFIG[agentId];
	if (!config) throw new Error(`Unknown agent: ${agentId}`);

	const apiKey = getApiKey(config.provider);
	if (!apiKey) throw new Error(`No API key for ${config.provider}. Please add it in Settings.`);

	const messages = [
		{ role: 'system', content: config.systemPrompt },
		{ role: 'user', content: context ? `Context:\n${context}\n\nQuestion: ${question}` : question }
	];

	let result;
	switch (config.provider) {
		case 'openai': result = await callOpenAI(apiKey, config.model, messages); break;
		case 'anthropic': result = await callAnthropic(apiKey, config.model, messages); break;
		case 'google': result = await callGoogle(apiKey, config.model, messages); break;
		case 'deepseek': result = await callDeepSeek(apiKey, config.model, messages); break;
		case 'mistral': result = await callMistral(apiKey, config.model, messages); break;
		default: throw new Error(`Unsupported provider: ${config.provider}`);
	}

	// Record spending
	recordSpend(result.cost);

	return {
		content: result.content,
		tokens: result.tokens,
		cost: result.cost,
		provider: config.provider,
		model: config.model
	};
}

module.exports = { askAgent, PROVIDERS, AGENT_CONFIG };
