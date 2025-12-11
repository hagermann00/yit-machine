import React, { Component, ErrorInfo, ReactNode } from 'react';
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h2>
            <p className="text-gray-400 mb-6 text-sm">
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
                <div className="bg-black/50 p-3 rounded text-left mb-6 overflow-auto max-h-32 text-xs font-mono text-red-300">
                    {this.state.error.message}
                </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
