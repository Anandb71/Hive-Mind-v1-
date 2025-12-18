/**
 * HiveMind UI - Budget Meter Widget
 * Shows AI usage budget status
 */

import React from 'react';

interface BudgetMeterProps {
	totalBudget: number;
	spent: number;
	onAddFunds?: () => void;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
	totalBudget,
	spent,
	onAddFunds
}) => {
	const remaining = totalBudget - spent;
	const percentage = (spent / totalBudget) * 100;
	const isLow = remaining < totalBudget * 0.2;
	const isCritical = remaining < totalBudget * 0.05;

	const getColor = () => {
		if (isCritical) return '#FF6B6B';
		if (isLow) return '#FFEAA7';
		return '#4ECDC4';
	};

	return (
		<div className="budget-meter" style={{
			padding: '12px',
			backgroundColor: 'var(--vscode-editor-background)',
			border: `1px solid ${isCritical ? '#FF6B6B' : 'var(--vscode-panel-border)'}`,
			borderRadius: '8px'
		}}>
			<div className="budget-header" style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '8px'
			}}>
				<span style={{ fontSize: '13px', fontWeight: 500 }}>
					💰 Session Budget
				</span>
				<span style={{
					fontSize: '14px',
					fontWeight: 700,
					color: getColor()
				}}>
					${remaining.toFixed(2)}
				</span>
			</div>

			<div className="budget-bar" style={{
				height: '6px',
				backgroundColor: 'var(--vscode-progressBar-background)',
				borderRadius: '3px',
				overflow: 'hidden',
				marginBottom: '8px'
			}}>
				<div style={{
					height: '100%',
					width: `${100 - percentage}%`,
					backgroundColor: getColor(),
					borderRadius: '3px',
					transition: 'width 0.3s ease'
				}} />
			</div>

			<div className="budget-details" style={{
				display: 'flex',
				justifyContent: 'space-between',
				fontSize: '11px',
				color: 'var(--vscode-descriptionForeground)'
			}}>
				<span>Spent: ${spent.toFixed(2)}</span>
				<span>Total: ${totalBudget.toFixed(2)}</span>
			</div>

			{isCritical && (
				<div style={{
					marginTop: '8px',
					padding: '6px 8px',
					backgroundColor: 'rgba(255, 107, 107, 0.1)',
					borderRadius: '4px',
					fontSize: '11px',
					color: '#FF6B6B',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}>
					<span>⚠️ Budget almost depleted!</span>
					{onAddFunds && (
						<button
							onClick={onAddFunds}
							style={{
								padding: '2px 8px',
								backgroundColor: '#FF6B6B',
								color: '#fff',
								border: 'none',
								borderRadius: '3px',
								cursor: 'pointer',
								fontSize: '10px'
							}}
						>
							Add funds
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default BudgetMeter;
