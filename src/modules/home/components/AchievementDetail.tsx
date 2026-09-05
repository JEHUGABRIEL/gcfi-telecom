'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, Award, X, ExternalLink } from 'lucide-react';
import { useAchievements } from '@/shared/lib/queries';
import { sanitizeHtml } from '@/shared/lib/sanitize';
import { useLang, type Translations } from '@/shared/context/LanguageContext';
import { useContact } from '@/shared/context/ContactContext';
import { cn } from '@/shared/lib/utils';
import type { Achievement } from '@/shared/types';

/* ── Fallback (mêmes données que la section accueil) ─────────── */
const FALLBACK_ACHIEVEMENT_BASE = [
  { id: '1', year: '2023', image: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&q=80&w=1400', gallery: [] as string[] },
  { id: '2', year: '2022', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1400', gallery: [] as string[] },
  { id: '3', year: '2023', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1400', gallery: [] as string[] },
];

function buildFallbackAchievements(t: Translations): Achievement[] {
  const titles = t.home_page.achievement_titles as unknown as string[];
  const descs   = t.home_page.achievement_descs   as unknown as string[];
  return FALLBACK_ACHIEVEMENT_BASE.map((b, i) => ({ ...b, title: titles[i] || '', description: descs[i] || '' }));
}

/* Lignes qui ressemblent à des sous-titres dans la description
   (ex. "2.3 Configuration du User Manager v7") */
function isSubtitle(line: string): boolean {
  const l = line.trim();
  if (!l) return false;
  if (/^\d+(\.\d+)+[.)]?\s*\S/.test(l)) return true;            // "2.3 Configuration…"
  if (/^[-–—•]\s*\S/.test(l) && l.length <= 80) return true;     // puce courte
  return l.length <= 60 && !/[.!?:]$/.test(l) && /\S{3}/.test(l); // courte phrase sans ponctuation finale
}

export default function AchievementDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, lang } = useLang();
  const fallback = React.useMemo(() => buildFallbackAchievements(t), [t]);
  const { data: remote = [], isLoading } = useAchievements(lang) as { data: Achievement[]; isLoading: boolean };
  const { openContact } = useContact();
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const list = remote.length ? remote : fallback;
  const achievement = list.find(a => a.id === id);
  const others = list.filter(a => a.id !== id).slice(0, 3);

  React.useEffect(() => {
    if (!isLoading && !achievement) router.replace('/');
  }, [isLoading, achievement, router]);

  if (isLoading || !achievement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  const isHtmlDescription = /<[a-z][\s\S]*>/i.test(achievement.description);

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* ── Hero ── */}
        <div className="relative h-[52vh] min-h-[400px] md:h-[60vh] overflow-hidden">
          <Image src={achievement.image} alt={achievement.title} fill priority
            className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/10" />
          <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
            <Link href="/#realisations"
              className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {t.home_page.section6_title}
            </Link>
            <div className="w-full flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] text-white bg-[#C1272D]">
                  <Award className="w-3.5 h-3.5" /> {t.home_page.section6_tag}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20">
                  <Calendar className="w-3.5 h-3.5" /> {achievement.year}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{achievement.title}</h1>
            </div>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto pt-10 md:pt-14 pb-12 md:pb-16">
            {isHtmlDescription ? (
              <div
                className="rich-editor-content text-justify text-base md:text-lg text-slate-600 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(achievement.description) }}
              />
            ) : (
              achievement.description
                .replace(/\r/g, '')
                .split(/\n+/)
                .filter(p => p.trim())
                .map((par, i) => (
                  <p key={i} className={cn(
                    'leading-relaxed text-slate-600 dark:text-slate-300',
                    isSubtitle(par)
                      ? 'mt-6 mb-1 font-semibold text-slate-900 dark:text-white text-base md:text-lg'
                      : cn(
                          'md:text-justify',
                          i === 0 ? 'text-lg md:text-xl' : 'text-base md:text-lg mt-5'
                        )
                  )}>
                    {par}
                  </p>
                ))
            )}

            {/* Galerie photos */}
            {achievement.gallery && achievement.gallery.length > 0 && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-10 md:my-12" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C1272D] mb-6">
                  {t.home_page.section6_photos}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {achievement.gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setLightbox(src)}
                      aria-label={`${t.home_page.section6_photos} ${i + 1}`}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in border border-slate-200 dark:border-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D]/70"
                    >
                      <Image src={src} alt={`${achievement.title} — ${i + 1}`} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 50vw, 100vw" />
                      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  ))}
                </div>
              </>
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
                  <Link key={other.id} href={`/realisations/${other.id}`}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-[#C1272D]/40 hover:-translate-y-1 transition-all duration-300">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image src={other.image} alt={other.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 33vw, 100vw" />
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-slate-900/55 backdrop-blur-sm border border-white/15">
                        <Calendar className="w-3 h-3" /> {other.year}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#C1272D] transition-colors">{other.title}</h3>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{other.description}</p>
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

      {/* ── Visionneuse plein écran ── */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightbox(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full">
              <button onClick={() => setLightbox(null)} className="absolute -top-14 right-0 p-3 text-white hover:text-red-400 transition-colors" aria-label="Fermer">
                <X className="w-7 h-7" />
              </button>
              <Image src={lightbox} alt="" width={0} height={0} sizes="100vw"
                className="w-full rounded-2xl" style={{ width: '100%', height: 'auto' }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
