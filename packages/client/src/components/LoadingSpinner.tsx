import './LoadingSpinner.css';

interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large';
	message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
	return (
		<div className={`loading-spinner ${size}`}>
			<div className="spinner">
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
				<span className="spinner-bee">🐝</span>
			</div>
			{message && <p className="loading-message">{message}</p>}
		</div>
	);
}
