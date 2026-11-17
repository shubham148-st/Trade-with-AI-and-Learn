import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Route Error Boundary with Granular Fallback.
 * Isolates module chunk loading failures or route component errors without breaking the shell.
 */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Component crash:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleRetry
        });
      }

      const isChunkLoadFailed = 
        this.state.error?.name === 'ChunkLoadError' ||
        (this.state.error?.message && 
          (this.state.error.message.toLowerCase().includes('failed to fetch dynamically imported module') ||
           this.state.error.message.toLowerCase().includes('loading chunk')));

      return (
        <div 
          role="alert"
          style={{
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--bg-card, #1a1d23)',
            border: '1px solid var(--border, #2a2d35)',
            borderRadius: '12px',
            padding: '2.5rem 1.5rem',
            margin: '1.5rem 0',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            background: 'var(--red-subtle, rgba(255, 71, 87, 0.15))',
            border: '1px solid var(--red, #ff4757)',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={28} color="var(--red, #ff4757)" />
          </div>

          <h2 style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 0.5rem 0'
          }}>
            {isChunkLoadFailed ? 'Route Module Failed to Load' : 'Unable to Render Component'}
          </h2>

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted, #888888)',
            maxWidth: '480px',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0'
          }}>
            {isChunkLoadFailed
              ? 'A temporary network interruption prevented loading this section. Please click retry or reload the page.'
              : (this.state.error?.message || 'An unexpected error occurred while rendering this view.')}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'var(--accent, #00d4aa)',
                color: '#0f1117',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.15s ease'
              }}
            >
              <RefreshCw size={14} /> Retry View
            </button>

            <button
              onClick={this.handleReload}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main, #d1d5db)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.15s ease'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
