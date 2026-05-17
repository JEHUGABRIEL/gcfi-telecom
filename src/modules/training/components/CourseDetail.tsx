import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Tag, GraduationCap, CheckCircle2, Phone, Share2, Users, Award } from 'lucide-react';
import { useCourses } from '@/shared/lib/queries';
import type { Course } from '@/shared/types';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useCourses();

  const course = courses.find((c: Course) => c.id === id);

  React.useEffect(() => {
    if (!isLoading && !course) navigate('/formation', { replace: true });
  }, [course, isLoading, navigate]);

  const handleContact = () => {
    window.open(
      `https://wa.me/23761371449?text=Bonjour, je suis intéressé par la formation "${course?.title}"`,
      '_blank'
    );
  };

  const handleShare = () => {
    navigator.share?.({ title: course?.title, url: window.location.href })
      .catch(() => navigator.clipboard.writeText(window.location.href));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#2563B0] rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  const inclus = [
    'Accès aux supports de cours',
    'Exercices pratiques',
    'Certificat de fin de formation',
    'Suivi post-formation (1 mois)',
    'Accès aux enregistrements',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Retour */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#2563B0] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Image hero */}
              <div className="aspect-video bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 mb-8 relative">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2563B0] to-[#1E3A8A] flex items-center justify-center">
                    <GraduationCap className="w-24 h-24 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-[#2563B0] text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
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
                    <Clock className="w-4 h-4 text-[#2563B0]" />
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4 text-[#2563B0]" />
                  <span className="font-medium">Toutes niveaux</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Award className="w-4 h-4 text-[#2563B0]" />
                  <span className="font-medium">Certificat inclus</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Description</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  {course.description}
                </p>
              </div>

              {/* Ce qui est inclus */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Ce qui est inclus</h2>
                <div className="space-y-3">
                  {inclus.map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#2563B0] shrink-0" />
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
                  <span className="text-4xl font-black text-[#2563B0]">
                    {course.price === 0 ? 'Gratuit' : course.price.toLocaleString('fr-FR')}
                  </span>
                  {course.price > 0 && (
                    <span className="text-base font-bold text-slate-500">FCFA</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-8">Prix par participant</p>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContact}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#2563B0] hover:bg-[#1E4D8C] text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#2563B0]/20 mb-4"
                >
                  <Phone className="w-4 h-4" />
                  S&apos;inscrire via WhatsApp
                </motion.button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#2563B0] hover:text-[#2563B0] rounded-2xl text-sm font-bold transition-all"
                >
                  <Share2 className="w-4 h-4" /> Partager
                </button>

                {/* Infos rapides */}
                <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {[
                    { label: 'Durée', value: course.duration || 'À définir' },
                    { label: 'Catégorie', value: course.category },
                    { label: 'Niveau', value: 'Tous niveaux' },
                    { label: 'Langue', value: 'Français' },
                    { label: 'Certificat', value: 'Oui, inclus' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">{label}</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}