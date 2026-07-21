'use client';

import React from 'react';
import { useLang, type Lang } from '@/shared/context/LanguageContext';
import { Globe } from 'lucide-react';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Changer de langue"
      >
        <Globe className="w-4 h-4" />
        <span>{current.flag}</span>
        <span className="text-xs font-bold">{current.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setIsOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold transition-colors ${
                lang === l.code
                  ? 'text-[#C1272D] bg-red-50 dark:bg-red-900/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && (
                <span className="ml-auto text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
