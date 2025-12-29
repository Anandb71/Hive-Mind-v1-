/**
 * Search Component
 * Global file and content search with keyboard shortcuts
 */

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, File, Hash } from 'lucide-react';
import { useStore } from '../store';

interface SearchResult {
	type: 'file' | 'content';
	path: string;
	name: string;
	line?: number;
	preview?: string;
}

export function Search() {
	const { serverUrl, setActiveFile, files } = useStore();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResult[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [searching, setSearching] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
				e.preventDefault();
				setOpen(true);
			}
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
				e.preventDefault();
				setOpen(true);
			}
			if (e.key === 'Escape') {
				setOpen(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		const searchFiles = async () => {
			setSearching(true);
			const fileResults: SearchResult[] = [];

			const searchTree = (nodes: any[]) => {
				for (const node of nodes) {
					if (node.name.toLowerCase().includes(query.toLowerCase())) {
						fileResults.push({
							type: 'file',
							path: node.path,
							name: node.name
						});
					}
					if (node.children) {
						searchTree(node.children);
					}
				}
			};

			searchTree(files);

			try {
				const res = await fetch(`${serverUrl}/api/files/search/my-project?q=${encodeURIComponent(query)}`);
				if (res.ok) {
					const contentResults = await res.json();
					setResults([...fileResults, ...contentResults.slice(0, 10)]);
				} else {
					setResults(fileResults);
				}
			} catch {
				setResults(fileResults);
			}

			setSearching(false);
		};

		const debounce = setTimeout(searchFiles, 300);
		return () => clearTimeout(debounce);
	}, [query, files, serverUrl]);

	const handleSelect = (result: SearchResult) => {
		setActiveFile(result.path);
		setOpen(false);
		setQuery('');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex(i => Math.min(i + 1, results.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter' && results[selectedIndex]) {
			handleSelect(results[selectedIndex]);
		}
	};

	if (!open) return null;

	return (
		<div className="search-overlay" onClick={() => setOpen(false)}>
			<div className="search-modal" onClick={e => e.stopPropagation()}>
				<div className="search-header">
					<SearchIcon size={16} />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
						onKeyDown={handleKeyDown}
						placeholder="Search files and content... (Ctrl+P)"
					/>
					<button onClick={() => setOpen(false)}>
						<X size={16} />
					</button>
				</div>

				<div className="search-results">
					{searching && <div className="search-loading">Searching...</div>}

					{!searching && results.length === 0 && query.trim() && (
						<div className="search-empty">No results found</div>
					)}

					{results.map((result, i) => (
						<div
							key={`${result.path}-${result.line || 0}`}
							className={`search-result ${i === selectedIndex ? 'selected' : ''}`}
							onClick={() => handleSelect(result)}
						>
							{result.type === 'file' ? <File size={14} /> : <Hash size={14} />}
							<span className="result-name">{result.name}</span>
							<span className="result-path">{result.path}</span>
							{result.line && <span className="result-line">:{result.line}</span>}
						</div>
					))}
				</div>

				<div className="search-footer">
					<span>↑↓ Navigate</span>
					<span>↵ Select</span>
					<span>Esc Close</span>
				</div>
			</div>
		</div>
	);
}
