import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback || (
				<div className="error-boundary">
					<div className="error-icon">⚠️</div>
					<h3>Something went wrong</h3>
					<p>{this.state.error?.message || 'An unexpected error occurred'}</p>
					<button onClick={() => this.setState({ hasError: false })}>
						Try Again
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
