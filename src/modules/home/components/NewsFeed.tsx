'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ChevronRight, ExternalLink, RefreshCw, Radio, TrendingUp, Cpu, Mail, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { useNews } from '@/shared/lib/queries';
import { logError } from '@/shared/lib/supabase-helpers';
import type { NewsItem } from '@/shared/types';

// ── Bloc d'abonnement newsletter ──────────────────────────────
function SubscribeBlock() {
  const [subscribed] = React.useState(() =>
    localStorage.getItem('gcfi-newsletter-subscribed') === 'true'
  );
  const [showForm, setShowForm] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(subscribed);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  // ✅ Honeypot anti-bot
  const [honeypot, setHoneypot] = React.useState('');

  // ✅ Rate limiting newsletter — 2 tentatives max par heure
  function checkNewsletterRate(): boolean {
    const KEY = 'gcfi-nl-ts';
    const now = Date.now();
    const stored: number[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const recent = stored.filter(t => now - t < 3600000);
    if (recent.length >= 2) return false;
    recent.push(now);
    localStorage.setItem(KEY, JSON.stringify(recent));
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Honeypot check
    if (honeypot) { setDone(true); return; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!checkNewsletterRate()) {
      setError('Trop de tentatives. Réessayez dans une heure.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await supabase.from('subscribers').insert([{ email: email.trim().toLowerCase(), subscribed_at: new Date().toISOString() }]);
    } catch (_) { /* table absente → silencieux */ }
    // ✅ Seulement le flag, jamais l'email en clair
    localStorage.setItem('gcfi-newsletter-subscribed', 'true');
    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-16 flex justify-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <span className="text-sm font-bold text-green-700 dark:text-green-400">
            Vous êtes abonné aux actualités GCFI !
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-16 flex justify-center">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-flex items-center gap-4 p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full shadow-lg"
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Restez informé de l&apos;actualité locale
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#C1272D] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#1E4D8C] transition-all flex items-center gap-2"
            >
              <Mail className="w-3 h-3" /> S&apos;abonner
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl p-8 w-full max-w-md"
          >
            {/* ✅ Honeypot anti-bot */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <input type="text" name="url" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Newsletter GCFI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Recevez les dernières actualités télécom & IT.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="votre@email.com"
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#C1272D] focus:ring-2 focus:ring-[#C1272D]/10 transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#C1272D] text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1E4D8C] transition-all disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                OK
              </button>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// Données de secours si la table est vide
const fallbackNews: NewsItem[] = [
  { id: '1', title: 'Orange RCA déploie la 4G dans 5 nouvelles villes', excerpt: 'Le groupe Orange accélère son déploiement réseau en RCA avec la couverture 4G de plusieurs villes.', category: 'telecom', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800', source: 'ACP', url: '#', published_at: new Date().toISOString() },
  { id: '3', title: "Cybersécurité : l'Afrique centrale face aux cyberattaques", excerpt: 'Une hausse de 47% des incidents cyber en Afrique centrale. La formation de spécialistes devient prioritaire.', category: 'it', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', source: 'IT News Africa', url: '#', published_at: new Date().toISOString() },
];

export default function NewsFeed() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(3);
      if (err) throw err;
      setNews(data && data.length > 0 ? (data as NewsItem[]) : fallbackNews);
    } catch (err) {
      logError('NewsFeed/fetchNews', err);
      setNews(fallbackNews);
      setError('Impossible de charger les actualités depuis la base de données.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchNews(); }, []);

  const categoryIcons = { telecom: Radio, it: Cpu };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[#C1272D] font-black uppercase tracking-[0.3em] text-xs mb-4">
              <Newspaper className="w-4 h-4" />
              Actualités du Secteur
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
              Veille <span className="text-[#C1272D]">Stratégique</span>
            </h2>
          </div>
          <button
            onClick={fetchNews} disabled={loading}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#C1272D] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-amber-700 dark:text-amber-400 text-sm font-medium">
            {error} — Affichage des données de démonstration.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={`sk-${i}`} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 animate-pulse">
                    <div className="h-56 bg-slate-100 dark:bg-slate-800 rounded-3xl mb-6" />
                    <div className="px-4 pb-4 space-y-4">
                      <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    </div>
                  </div>
                ))
              : news.map((item, index) => {
                  const Icon = categoryIcons[item.category] ?? Newspaper;
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 group hover:border-[#C1272D]/30 hover:shadow-2xl transition-all"
                    >
                      <div className="relative h-56 overflow-hidden m-4 rounded-[2rem]">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#C1272D] flex items-center gap-2 shadow-lg">
                            <Icon className="w-3 h-3" />
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 pt-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                          <span>{item.source}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>{formatDate(item.published_at)}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-[#C1272D] transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-2 leading-relaxed italic">
                          {item.excerpt}
                        </p>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#C1272D] hover:gap-3 transition-all">
                          Lire la suite <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.article>
                  );
                })}
          </AnimatePresence>
        </div>

        {/* ── Bloc abonnement ── */}
        <SubscribeBlock />
      </div>
    </section>
  );
}
