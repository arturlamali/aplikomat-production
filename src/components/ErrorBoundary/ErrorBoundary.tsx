"use client";

import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error to error reporting service (e.g., Sentry)
		console.error("ErrorBoundary caught an error:", error, errorInfo);

		// TODO: Send to error tracking service
		// if (typeof window !== 'undefined') {
		//   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
		// }
	}

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default fallback UI
			return (
				<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
					<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
						<div className="mb-4 flex items-center justify-center">
							<div className="rounded-full bg-red-100 p-3">
								<svg
									className="h-8 w-8 text-red-600"
									fill="none"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
						</div>
						<h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
							Coś poszło nie tak
						</h1>
						<p className="mb-6 text-center text-gray-600">
							Wystąpił nieoczekiwany błąd. Przepraszamy za niedogodności.
						</p>
						{process.env.NODE_ENV === "development" && this.state.error && (
							<div className="mb-4 rounded-md bg-red-50 p-4">
								<p className="mb-2 text-sm font-semibold text-red-800">
									Error Details (Dev Only):
								</p>
								<p className="text-xs text-red-700">
									{this.state.error.toString()}
								</p>
								{this.state.error.stack && (
									<pre className="mt-2 overflow-x-auto text-xs text-red-600">
										{this.state.error.stack}
									</pre>
								)}
							</div>
						)}
						<div className="flex gap-2">
							<button
								onClick={() => {
									this.setState({ hasError: false, error: null });
									window.location.reload();
								}}
								className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
							>
								Odśwież stronę
							</button>
							<button
								onClick={() => {
									this.setState({ hasError: false, error: null });
									window.location.href = "/";
								}}
								className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300"
							>
								Strona główna
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
