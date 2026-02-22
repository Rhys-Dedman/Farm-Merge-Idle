import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#1a1a1a',
            color: '#fff',
            padding: 24,
            overflow: 'auto',
            fontFamily: 'system-ui, sans-serif',
            zIndex: 99999,
          }}
        >
          <h2 style={{ color: '#f87171', marginBottom: 16 }}>Something went wrong</h2>
          <pre
            style={{
              background: '#333',
              padding: 16,
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
          </pre>
          <pre
            style={{
              marginTop: 12,
              background: '#333',
              padding: 16,
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            {this.state.error.stack}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Dismiss and try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
