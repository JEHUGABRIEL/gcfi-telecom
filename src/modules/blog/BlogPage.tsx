'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Calendar, Clock, Tag, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface BlogPost {
  id: string; title: string; excerpt: string; content: string;
  image: string | null; category: string; tags: string[];
  author: string; published: boolean; created_at: string; read_time?: number;
}

function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts').select('*').eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default function BlogPage() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const [selected, setSelected] = React.useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
  const filtered = activeCategory ? posts.filter(p => p.category === activeCategory) : posts;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );

  if (selected) return <ArticleDetail post={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-[var(--accent-light)] text-[var(--accent)] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Blog GCFI
          </span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Actualités & Ressources</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Découvrez nos articles sur les télécommunications, la cybersécurité et les nouvelles technologies en Centrafrique.
          </p>
        </motion.div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setActiveCategory(null)}
              className={cn('px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all',
                !activeCategory ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100')}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn('px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all',
                  activeCategory === cat ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100')}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Aucun article publié pour le moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post, i) => (
              <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} onClick={() => setSelected(post)}
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
                      {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time} min</span>}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 flex-1 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500">{post.author}</span>
                    <span className="flex items-center gap-1 text-xs font-black text-[var(--accent)]">
                      Lire <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleDetail({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--accent)] transition-colors mb-8">
          ← Retour au blog
        </button>
        {post.image && <div className="aspect-video rounded-3xl overflow-hidden mb-8 relative"><Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority /></div>}
        {post.category && <span className="inline-block bg-[var(--accent-light)] text-[var(--accent)] text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">{post.category}</span>}
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />
            {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {post.read_time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.read_time} min</span>}
          <span className="font-bold text-slate-700 dark:text-slate-300">{post.author}</span>
        </div>
        <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">{post.content}</div>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <Tag className="w-4 h-4 text-slate-400" />
            {post.tags.map(t => <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}