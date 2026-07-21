'use client';

import Link from 'next/link';
import { useLang } from '@/shared/context/LanguageContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-8xl font-black text-slate-200 dark:text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.common.error_404_title}</h2>
        <p className="text-slate-500 mb-8">{t.common.error_404_text}</p>
        <Link href="/" className="px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all">
          {t.common.error_404_back}
        </Link>
      </div>
    </div>
  );
}
