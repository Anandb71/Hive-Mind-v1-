import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store';

interface QuickOpenProps {
	isOpen: boolean;
	onClose: () => void;
}

export function QuickOpen({ isOpen, onClose }: QuickOpenProps) {
	const { files, openTab } = useStore();
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const flattenFiles = (nodes: any[], path = ''): string[] => {
		let result: string[] = [];
		for (const node of nodes) {
			const fullPath = path ? `${path}/${node.name}` : node.name;
			if (node.type === 'file') {
				result.push(fullPath);
			}
			if (node.children) {
				result = result.concat(flattenFiles(node.children, fullPath));
			}
		}
		return result;
	};

	const allFiles = flattenFiles(files);
	const filtered = allFiles.filter(f =>
		f.toLowerCase().includes(query.toLowerCase())
	);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
			setQuery('');
			setSelectedIndex(0);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex(i => Math.max(i - 1, 0));
			} else if (e.key === 'Enter' && filtered[selectedIndex]) {
				e.preventDefault();
				openTab(filtered[selectedIndex]);
				onClose();
			} else if (e.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, filtered, selectedIndex, openTab, onClose]);

	if (!isOpen) return null;

	return (
		<div className="quick-open-overlay" onClick={onClose}>
			<div className="quick-open-modal" onClick={e => e.stopPropagation()}>
				<div className="quick-open-input-row">
					<Search size={16} />
					<input
						ref={inputRef}
						type="text"
						placeholder="Search files..."
						value={query}
						onChange={e => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
					/>
				</div>
				<div className="quick-open-results">
					{filtered.slice(0, 10).map((file, i) => (
						<div
							key={file}
							className={`quick-open-item ${i === selectedIndex ? 'selected' : ''}`}
							onClick={() => {
								openTab(file);
								onClose();
							}}
						>
							<span className="quick-open-icon">📄</span>
							<span className="quick-open-name">{file.split('/').pop()}</span>
							<span className="quick-open-path">{file}</span>
						</div>
					))}
					{filtered.length === 0 && (
						<div className="quick-open-empty">No files found</div>
					)}
				</div>
			</div>
		</div>
	);
}
