'use client';
import React from 'react';
import { useLang } from '@/shared/context/LanguageContext';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  const { t } = useLang();

  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t.common.error_title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {t.common.error_boundary_text}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#C1272D] text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors"
        >
          {t.common.error_reload}
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundaryInner fallback={fallback ?? defaultFallback}>
      {children}
    </ErrorBoundaryInner>
  );
}

/* ── Inner class component for error boundary lifecycle ─────── */
/* getDerivedStateFromError / componentDidCatch have no hook     */
/* equivalents in React 19, so we keep a minimal class wrapper.  */
class ErrorBoundaryInner extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GCFI] Component error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
