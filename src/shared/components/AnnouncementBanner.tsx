'use client';

import React from 'react';
import { X, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import Link from 'next/link';
import { useLang } from '@/shared/context/LanguageContext';

interface Announcement {
  id: string;
  message: string;
  link_label?: string;
  link_url?: string;
  bg_color: string;
}

const BG: Record<string, string> = {
  red:    'bg-[#C1272D]',
  blue:   'bg-blue-600',
  green:  'bg-emerald-600',
  purple: 'bg-violet-600',
  amber:  'bg-amber-500',
  slate:  'bg-slate-800',
};

export default function AnnouncementBanner() {
  const { lang } = useLang();
  const [items,     setItems]     = React.useState<Announcement[]>([]);
  const [current,   setCurrent]   = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const load = () =>
      supabase
        .from('announcements')
        .select('id, message, link_label, link_url, bg_color')
        .eq('is_active', true)
        .eq('lang', lang)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setItems(data);
            setDismissed(false);
          } else {
            setItems([]);
          }
        });

    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (dismissed || items.length === 0) return null;

  const ann = items[current];
  const bg  = BG[ann.bg_color] ?? 'bg-[#C1272D]';

  return (
    <div className={`${bg} text-white w-full`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {items.length > 1 && (
          <button onClick={() => setCurrent(c => (c - 1 + items.length) % items.length)}
            className="shrink-0 p-1 rounded-full hover:bg-white/20">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0">
          <Megaphone className="w-4 h-4 shrink-0 opacity-80" />
          <p className="text-sm font-bold truncate">
            {ann.message}
            {ann.link_url && ann.link_label && (
              <>
                {' — '}
                {ann.link_url.startsWith('/') ? (
                  <Link href={ann.link_url} className="underline underline-offset-2 hover:opacity-80">{ann.link_label}</Link>
                ) : (
                  <a href={ann.link_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">{ann.link_label}</a>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <>
              <div className="flex gap-1">
                {items.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                ))}
              </div>
              <button onClick={() => setCurrent(c => (c + 1) % items.length)}
                className="p-1 rounded-full hover:bg-white/20">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={() => setDismissed(true)} className="p-1 rounded-full hover:bg-white/20 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}