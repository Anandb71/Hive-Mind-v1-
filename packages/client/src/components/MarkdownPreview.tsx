/**
 * Markdown Preview Component
 * Live preview for markdown files with syntax highlighting
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
	content: string;
	filename: string;
}

export function MarkdownPreview({ content, filename }: MarkdownPreviewProps) {
	const [showPreview, setShowPreview] = useState(true);
	const [copied, setCopied] = useState(false);
	const [html, setHtml] = useState('');

	useEffect(() => {
		setHtml(parseMarkdown(content));
	}, [content]);

	const parseMarkdown = (md: string): string => {
		let result = md
			// Headers
			.replace(/^### (.*$)/gm, '<h3>$1</h3>')
			.replace(/^## (.*$)/gm, '<h2>$1</h2>')
			.replace(/^# (.*$)/gm, '<h1>$1</h1>')
			// Bold and Italic
			.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			// Code blocks
			.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			// Links and Images
			.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
			.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
			// Lists
			.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')
			.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
			// Blockquotes
			.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>')
			// Horizontal rules
			.replace(/^---$/gm, '<hr />')
			// Paragraphs
			.replace(/\n\n/g, '</p><p>')
			// Line breaks
			.replace(/\n/g, '<br />');

		return `<p>${result}</p>`;
	};

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (!filename.endsWith('.md')) {
		return null;
	}

	return (
		<div className="markdown-preview">
			<div className="preview-header">
				<span className="preview-title">📖 {filename}</span>
				<div className="preview-actions">
					<button onClick={copyToClipboard} title="Copy content">
						{copied ? <Check size={14} /> : <Copy size={14} />}
					</button>
					<button onClick={() => setShowPreview(!showPreview)} title="Toggle preview">
						{showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
					</button>
				</div>
			</div>

			{showPreview && (
				<div
					className="preview-content"
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			)}
		</div>
	);
}
