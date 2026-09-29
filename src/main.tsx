import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  sessionStorage.removeItem('bh_vite_reloaded');
  window.addEventListener(
    'error',
    (event) => {
      if (event.message === 'Script error.' || event.message === 'Script error') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected UI error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060813] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0B1021] border border-white/10 rounded-3xl p-6 text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-white">
              BoostHub
            </h1>
            <p className="text-xs text-slate-300">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => {
                try {
                  window.localStorage.removeItem('boosthub_auth_token');
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              Reload BoostHub
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
