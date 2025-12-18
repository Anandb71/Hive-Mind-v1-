/**
 * HiveMind UI - Cursor Overlay
 * Renders collaborative cursors from other users
 */

import React from 'react';

export interface RemoteCursor {
	userId: string;
	username: string;
	color: string;
	position: { line: number; column: number };
	selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

interface CursorOverlayProps {
	cursors: RemoteCursor[];
	lineHeight: number;
	charWidth: number;
	scrollTop: number;
	scrollLeft: number;
}

export const CursorOverlay: React.FC<CursorOverlayProps> = ({
	cursors,
	lineHeight,
	charWidth,
	scrollTop,
	scrollLeft
}) => {
	return (
		<div className="cursor-overlay" style={{
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			pointerEvents: 'none',
			overflow: 'hidden'
		}}>
			{cursors.map(cursor => {
				const top = cursor.position.line * lineHeight - scrollTop;
				const left = cursor.position.column * charWidth - scrollLeft;

				return (
					<div
						key={cursor.userId}
						className="remote-cursor"
						style={{
							position: 'absolute',
							top: `${top}px`,
							left: `${left}px`,
							zIndex: 100
						}}
					>
						{/* Cursor line */}
						<div style={{
							width: '2px',
							height: `${lineHeight}px`,
							backgroundColor: cursor.color,
							animation: 'blink 1s infinite'
						}} />

						{/* Username label */}
						<div style={{
							position: 'absolute',
							top: '-18px',
							left: '0',
							backgroundColor: cursor.color,
							color: '#fff',
							padding: '2px 6px',
							borderRadius: '3px',
							fontSize: '10px',
							fontWeight: 500,
							whiteSpace: 'nowrap',
							boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
						}}>
							{cursor.username}
						</div>

						{/* Selection highlight */}
						{cursor.selection && (
							<div style={{
								position: 'absolute',
								top: 0,
								left: 0,
								backgroundColor: cursor.color,
								opacity: 0.2,
								height: `${lineHeight}px`,
								width: `${(cursor.selection.end.column - cursor.selection.start.column) * charWidth}px`
							}} />
						)}
					</div>
				);
			})}

			<style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
		</div>
	);
};

export default CursorOverlay;
