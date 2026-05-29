'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-[#C1272D]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          Une erreur est survenue
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Quelque chose s'est mal passé. Vous pouvez réessayer ou retourner à l'accueil.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-[#C1272D] text-white rounded-2xl font-bold text-sm hover:bg-[#9E1E24] transition-colors shadow-lg shadow-[#C1272D]/20"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Home className="w-4 h-4" /> Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
