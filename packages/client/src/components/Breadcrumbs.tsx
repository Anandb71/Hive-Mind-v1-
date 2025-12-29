/**
 * Breadcrumbs Component
 * File path navigation breadcrumbs
 */

import { ChevronRight, Home } from 'lucide-react';
import { useStore } from '../store';

export function Breadcrumbs() {
	const { activeFile, setActiveFile } = useStore();

	if (!activeFile) {
		return (
			<div className="breadcrumbs">
				<Home size={14} />
				<span>No file selected</span>
			</div>
		);
	}

	const parts = activeFile.split('/');

	return (
		<div className="breadcrumbs">
			<button className="breadcrumb-item" onClick={() => setActiveFile(null)}>
				<Home size={14} />
			</button>

			{parts.map((part, i) => {
				const path = parts.slice(0, i + 1).join('/');
				const isLast = i === parts.length - 1;

				return (
					<span key={path} className="breadcrumb-segment">
						<ChevronRight size={14} className="breadcrumb-separator" />
						<button
							className={`breadcrumb-item ${isLast ? 'active' : ''}`}
							onClick={() => !isLast && setActiveFile(path)}
							disabled={isLast}
						>
							{part}
						</button>
					</span>
				);
			})}
		</div>
	);
}
