import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <h2 style={{ color: 'var(--color-text-heading)', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                color: '#fff',
                border: 'none',
                padding: '0.625rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: 'var(--text-body-md)',
                fontWeight: 500,
              }}
            >
              Refresh Page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
