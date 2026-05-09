import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ChevronRight, ExternalLink, RefreshCw, Radio, TrendingUp, Cpu } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { useNews } from '@/shared/lib/queries';
import { logError } from '@/shared/lib/supabase-helpers';
import type { NewsItem } from '@/shared/types';

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
            <div className="flex items-center gap-3 text-[#2563B0] font-black uppercase tracking-[0.3em] text-xs mb-4">
              <Newspaper className="w-4 h-4" />
              Actualités du Secteur
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
              Veille <span className="text-[#2563B0]">Stratégique</span>
            </h2>
          </div>
          <button
            onClick={fetchNews} disabled={loading}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#2563B0] transition-colors disabled:opacity-50"
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
                      className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 group hover:border-[#2563B0]/30 hover:shadow-2xl transition-all"
                    >
                      <div className="relative h-56 overflow-hidden m-4 rounded-[2rem]">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#2563B0] flex items-center gap-2 shadow-lg">
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
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-[#2563B0] transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-2 leading-relaxed italic">
                          {item.excerpt}
                        </p>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#2563B0] hover:gap-3 transition-all">
                          Lire la suite <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.article>
                  );
                })}
          </AnimatePresence>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full shadow-lg">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Restez informé de l'actualité locale</span>
            <button className="bg-[#2563B0] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#1E4D8C] transition-all flex items-center gap-2">
              S'abonner <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
