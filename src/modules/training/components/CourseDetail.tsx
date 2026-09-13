'use client';

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Tag, GraduationCap, CheckCircle2, Phone, Share2, Users, Award, ArrowRight } from 'lucide-react';
import { useCourses } from '@/shared/lib/queries';
import { useLang } from '@/shared/context/LanguageContext';
import { trackEnroll, trackViewItem } from '@/shared/lib/ga-events';
import type { Course } from '@/shared/types';

export default function CourseDetail({ initialCourse }: { initialCourse?: Course }) {
  const params = useParams(); const id = params.id as string;
  const router = useRouter();
  const { t, lang } = useLang();
  const { data: courses = [], isLoading } = useCourses(lang);

  // Rendu dès la réponse serveur grâce à `initialCourse` : sans lui, le HTML
  // envoyé aux crawlers ne contient que l'écran de chargement.
  const course = courses.find((c: Course) => c.id === id) ?? initialCourse;

  React.useEffect(() => {
    if (!isLoading && !course) router.replace('/formation');
  }, [course, isLoading, router]);

  // Page vue — tracker la consultation de la formation.
  // Doit rester au-dessus de tout `return` anticipé : un hook placé après
  // change le nombre de hooks entre deux rendus et fait planter React.
  React.useEffect(() => {
    if (course) {
      trackViewItem({
        id: course.id,
        name: course.title,
        price: course.price,
        category: course.category,
      });
    }
  }, [course?.id]);

  const handleContact = () => {
    if (course) {
      trackEnroll({
        id: course.id,
        title: course.title,
        price: course.price,
        category: course.category,
      });
    }
    window.open(
      `https://wa.me/23672727208?text=${encodeURIComponent(t.course_detail.enroll_message + ' "' + (course?.title ?? '') + '"')}`,
      '_blank'
    );
  };

  const handleShare = () => {
    navigator.share?.({ title: course?.title, url: window.location.href })
      .catch(() => navigator.clipboard.writeText(window.location.href));
  };

  if (isLoading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  const similarCourses = courses
    .filter((candidate: Course) => candidate.id !== course.id)
    .map((candidate: Course) => ({
      course: candidate,
      score:
        (candidate.category === course.category ? 2 : 0) +
        (candidate.tags?.some(tag => course.tags?.includes(tag)) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.course);

  const inclus = t.course_detail.included_items as unknown as string[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Retour */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#C1272D] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> {t.course_detail.back}
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Image hero */}
              <div className="aspect-video bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 mb-8 relative">
                {course.image ? (
                  <Image src={course.image} alt={course.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 66vw" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#C1272D] to-[#1E3A8A] flex items-center justify-center">
                    <GraduationCap className="w-24 h-24 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-[#C1272D] text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Titre */}
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                {course.title}
              </h1>

              {/* Méta */}
              <div className="flex flex-wrap gap-4 mb-8">
                {course.duration && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4 text-[#C1272D]" />
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4 text-[#C1272D]" />
                  <span className="font-medium">{t.course_detail.level_all}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Award className="w-4 h-4 text-[#C1272D]" />
                  <span className="font-medium">{t.course_detail.cert_included}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t.course_detail.description}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  {course.description}
                </p>
              </div>

              {/* Ce qui est inclus */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">{t.course_detail.what_included}</h2>
                <div className="space-y-3">
                  {inclus.map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#C1272D] shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags - Correction ici : typage de tag */}
              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  {course.tags.map((tag: string) => (
                    <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar sticky */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="sticky top-24"
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-8">
                {/* Prix */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-[#C1272D]">
                    {course.price === 0 ? t.course_detail.value_free : course.price.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
                  </span>
                  {course.price > 0 && (
                    <span className="text-base font-bold text-slate-500">FCFA</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-8">{t.course_detail.price_per}</p>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContact}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#C1272D] hover:bg-[#1E4D8C] text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#C1272D]/20 mb-4"
                >
                  <Phone className="w-4 h-4" />
                  {t.course_detail.enroll_whatsapp}
                </motion.button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#C1272D] hover:text-[#C1272D] rounded-2xl text-sm font-bold transition-all"
                >
                  <Share2 className="w-4 h-4" /> {t.course_detail.share}
                </button>

                {/* Infos rapides */}
                <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {[
                    { label: t.course_detail.info_duration, value: course.duration || t.course_detail.value_to_define },
                    { label: t.course_detail.info_category, value: course.category },
                    { label: t.course_detail.info_level, value: t.course_detail.value_all_levels },
                    { label: t.course_detail.info_language, value: t.course_detail.value_french },
                    { label: t.course_detail.info_certificate, value: t.course_detail.value_yes_included },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">{label}</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>        </div>

        {similarCourses.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-2">{t.course_detail.discover_also_tag}</p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{t.course_detail.discover_also_title}</h2>
              </div>
              <button onClick={() => router.push('/formation')} className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#C1272D]">
                {t.course_detail.discover_also_link} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {similarCourses.map((candidate: Course) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => router.push(`/formation/${candidate.id}`)}
                  className="group text-left bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all"
                >
                  <div className="relative h-36 overflow-hidden">
                    <Image src={candidate.image} alt={candidate.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C1272D] mb-1">{candidate.category}</p>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{candidate.title}</h3>
                    <p className="mt-2 text-sm font-black text-[#C1272D]">{candidate.price.toLocaleString()} FCFA</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
