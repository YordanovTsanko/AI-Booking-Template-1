import { Component } from 'react';

/**
 * Catches render errors anywhere in the tree and shows a friendly fallback.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a trace for developers; the user sees the fallback UI
    console.error('ErrorBoundary caught an error:', error, info?.componentStack);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-lg p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
            <svg className="h-8 w-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ох, нещо се обърка</h1>
          <p className="mt-2 text-sm text-slate-600">
            Възникна неочаквана грешка в приложението. Опитай отново – ако проблемът продължава, презареди страницата.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="thin-scroll mt-4 max-h-40 overflow-auto rounded-xl bg-slate-900 p-3 text-left text-xs text-rose-200">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" className="btn-primary" onClick={this.handleRetry}>
              Опитай отново
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.location.assign('/')}>
              Към началото
            </button>
          </div>
        </div>
      </div>
    );
  }
}
