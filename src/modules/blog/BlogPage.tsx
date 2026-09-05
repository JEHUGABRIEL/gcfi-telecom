'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, ArrowRight, BookOpen, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useLang, type Translations } from '@/shared/context/LanguageContext';
import { useBlogPosts, type BlogPost } from './services/blog.service';

function formatDate(dateStr: string, lang: string) {
  return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const HERO_SLIDE_SRCS = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600',
] as const;

function getHeroSlides(t: Translations) {
  const s = (t.blog as any).slides;
  return HERO_SLIDE_SRCS.map((src, i) => ({
    src,
    tag: s[`tag${i + 1}`] as string,
    title: s[`title${i + 1}`] as string,
    sub: s[`sub${i + 1}`] as string,
  }));
}

function AuthorAvatar({ name, className }: { name: string; className?: string }) {
  const initial = (name?.[0] || '?').toUpperCase();
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-black shrink-0', className)}>
      {initial}
    </span>
  );
}

function FeaturedPost({ post, lang, t, onOpen }: { post: BlogPost; lang: string; t: any; onOpen: () => void }) {
  return (
    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="group grid md:grid-cols-2 gap-0 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer mb-14">
      <div className="relative h-64 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-800">
        {post.image ? (
          <Image src={post.image} alt={post.title} fill priority
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-slate-800 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/30" />
          </div>
        )}
      </div>
      <div className="p-8 md:p-10 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" /> {t.blog.featured_badge}
          </span>
          {post.category && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{post.category}</span>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-[var(--accent)] transition-colors">
          {post.title}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6">{post.excerpt}</p>
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <AuthorAvatar name={post.author} className="w-9 h-9 text-sm" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{post.author}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(post.created_at, lang)}
              </p>
            </div>
          </div>
          {post.read_time && (
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <Clock className="w-3.5 h-3.5" /> {post.read_time} {t.blog.min_read}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-black text-[var(--accent)] w-fit">
          {t.blog.read_more} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.article>
  );
}

export default function BlogPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { data: posts = [], isLoading } = useBlogPosts();
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [heroSlide, setHeroSlide] = React.useState(0);

  const SLIDES = React.useMemo(() => getHeroSlides(t), [t]);

  React.useEffect(() => {
    const id = setInterval(() => setHeroSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [SLIDES.length]);

  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

  const filtered = posts.filter(p => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const [featured, ...rest] = filtered;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── Hero slideshow ── */}
      <div className="relative h-[56vh] min-h-[420px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div key={heroSlide}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }} className="absolute inset-0">
            <Image src={SLIDES[heroSlide].src} alt={SLIDES[heroSlide].tag} fill className="object-cover" sizes="100vw" priority />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-16">
          <AnimatePresence mode="wait">
            <motion.div key={heroSlide}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }} className="flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-black uppercase tracking-widest text-white mb-4">
                <BookOpen className="w-3.5 h-3.5" /> {SLIDES[heroSlide].tag}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight max-w-3xl">
                {SLIDES[heroSlide].title}
              </h1>
              <p className="text-white/80 text-lg max-w-xl">{SLIDES[heroSlide].sub}</p>
            </motion.div>
          </AnimatePresence>
          <motion.a href="#articles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#C1272D] text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg">
            {t.blog.hero_cta} <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </div>

      <div id="articles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* ── Recherche + filtres ────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.blog.search_placeholder}
              className="w-full pl-11 pr-10 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <button onClick={() => setActiveCategory(null)}
                className={cn('px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all',
                  !activeCategory ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[var(--accent)] hover:text-[var(--accent)]')}>
                {t.blog.all}
              </button>
              {categories.map((cat: string) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn('px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all',
                    activeCategory === cat ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[var(--accent)] hover:text-[var(--accent)]')}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">{posts.length === 0 ? t.blog.empty : t.blog.no_results}</p>
          </div>
        ) : (
          <>
            {/* ── Article à la une ─────────────────────────────── */}
            <FeaturedPost post={featured} lang={lang} t={t} onOpen={() => router.push(`/blog/${featured.id}`)} />

            {/* ── Grille des autres articles ───────────────────── */}
            {rest.length > 0 && (
              <>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">{t.blog.latest_articles}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((post, i) => (
                    <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }} onClick={() => router.push(`/blog/${post.id}`)}
                      className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all cursor-pointer flex flex-col">
                      <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                        {post.image ? (
                          <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-slate-800 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                        {post.category && (
                          <span className="absolute top-4 left-4 bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.created_at, lang)}
                          </span>
                          {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time} {t.blog.min_read}</span>}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">{post.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1 mb-5">{post.excerpt}</p>
                        <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <AuthorAvatar name={post.author} className="w-7 h-7 text-xs" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex-1 truncate">{post.author}</span>
                          <ArrowRight className="w-4 h-4 text-[var(--accent)] group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
