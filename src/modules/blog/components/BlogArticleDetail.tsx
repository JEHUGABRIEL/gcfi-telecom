'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, BookOpen } from 'lucide-react';
import { useBlogPosts, type BlogPost } from '../services/blog.service';
import { sanitizeHtml } from '@/shared/lib/sanitize';
import { useLang } from '@/shared/context/LanguageContext';
import { useContact } from '@/shared/context/ContactContext';

export default function BlogArticleDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, lang } = useLang();
  const { openContact } = useContact();
  const { data: posts = [], isLoading } = useBlogPosts();

  const post = posts.find(p => p.id === id);
  const others = posts.filter(p => p.id !== id).slice(0, 3);

  React.useEffect(() => {
    if (!isLoading && !post) router.replace('/blog');
  }, [isLoading, post, router]);

  if (isLoading || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  const dateLabel = new Date(post.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const isHtml = /<[a-z][\s\S]*>/i.test(post.content);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* ── Hero centré ── */}
      <div className="relative h-[52vh] min-h-[400px] md:h-[60vh] overflow-hidden">
        {post.image ? (
          <Image src={post.image} alt={post.title} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#C1272D] to-slate-900 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
        <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
          <Link href="/blog"
            className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.blog.title}
          </Link>
          <div className="w-full flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
              {post.category && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] text-white bg-[#C1272D]">
                  <Tag className="w-3 h-3" /> {post.category}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20">
                <Calendar className="w-3.5 h-3.5" /> {dateLabel}
              </span>
              {post.read_time && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20">
                  <Clock className="w-3.5 h-3.5" /> {post.read_time} {t.blog.min_read}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl">{post.title}</h1>
            {post.author && <p className="mt-4 text-white/80 text-sm font-semibold">{post.author}</p>}
          </div>
        </div>
      </div>

      {/* ── Galerie ── */}
      {(post as any).gallery?.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
            {((post as any).gallery ?? []).map((src: string, i: number) => (
              <div key={`${src}-${i}`} className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm">
                <Image src={src} alt={`${post.title} ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto pt-10 md:pt-14 pb-12 md:pb-16">
          {isHtml ? (
            <div
              className="rich-editor-content text-justify text-base md:text-lg text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-justify text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {post.content}
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
              <Tag className="w-4 h-4 text-slate-400" />
              {post.tags.map(tag => (
                <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── À lire aussi ── */}
      {others.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C1272D] mb-8">{t.home_page.read_also}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {others.map(other => (
                <Link key={other.id} href={`/blog/${other.id}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-[#C1272D]/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {other.image ? (
                      <Image src={other.image} alt={other.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 33vw, 100vw" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C1272D] to-slate-800 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white/25" />
                      </div>
                    )}
                    {other.category && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-white bg-[#C1272D]">
                        {other.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#C1272D] transition-colors">{other.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{other.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Discuter de votre projet ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden px-8 py-14 md:px-12 text-center border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C1272D]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 relative leading-tight">{t.home_page.detail_cta_title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 relative max-w-xl mx-auto text-base md:text-lg">{t.home_page.detail_cta_text}</p>
            <button onClick={openContact}
              className="inline-flex items-center gap-2 bg-[#C1272D] text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
              {t.home_page.detail_cta_button} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}