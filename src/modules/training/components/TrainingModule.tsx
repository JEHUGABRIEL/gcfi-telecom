'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Clock, ChevronRight, X, CheckCircle, Info, Search, Filter, ArrowUpDown } from 'lucide-react';
import Fuse from 'fuse.js';
import { Course } from '@/shared/types';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/context/AuthContext';
import { useTrainings } from '@/shared/lib/queries';
import { useContact } from '@/shared/context/ContactContext';


export default function TrainingModule() {
  const { openContact: onContactOpen } = useContact();
  const { user, profile, requireAuth } = useAuth();

  const { data: courses = [], isLoading: coursesLoading } = useTrainings() as { data: Course[], isLoading: boolean };
  const [selectedTag, setSelectedTag]   = React.useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [searchQuery, setSearchQuery]   = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [sortBy, setSortBy]             = React.useState('default');

  const sortOptions = [
    { value: 'default', label: 'Par défaut' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'duration', label: 'Durée' },
  ];

  const allTags = React.useMemo(
    () => Array.from(new Set(courses.flatMap(c => c.tags || []))),
    [courses]
  );

  const fuse = React.useMemo(() => new Fuse(courses, {
    keys: ['title', 'description', 'category', 'tags'],
    threshold: 0.35,
    minMatchCharLength: 2,
  }), [courses]);

  const filteredCourses = React.useMemo(() => {
    let result = searchQuery.trim().length >= 2
      ? fuse.search(searchQuery).map(r => r.item)
      : [...courses];

    if (selectedTag) result = result.filter(c => c.tags?.includes(selectedTag));

    return result.sort((a, b) => {
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'duration')   return (a.duration || '').localeCompare(b.duration || '');
      return 0;
    });
  }, [courses, searchQuery, selectedTag, sortBy, fuse]);

  const handleEnroll = (courseTitle: string, price: number) => {
    requireAuth(() => {
      const userName = profile?.full_name || 'Client';
      const message = `Bonjour GCFI, je suis ${userName}. Je souhaite m'inscrire à :\n\n- *${courseTitle}*\n- Prix : ${price.toLocaleString()} FCFA\n\nMerci de me recontacter.`;
      window.open(`https://wa.me/237681371449?text=${encodeURIComponent(message)}`, '_blank');
    });
  };

  if (coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 border-t-[#C1272D] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-24 bg-white dark:bg-slate-900 transition-colors">
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <button onClick={() => setSelectedCourse(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20">
                <X className="w-6 h-6" />
              </button>
              <div className="w-full md:w-5/12 h-64 md:h-full relative">
                <Image src={selectedCourse.image} alt={selectedCourse.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
              <div className="p-8 md:w-7/12 overflow-y-auto max-h-[80vh]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-[#C1272D] text-[10px] font-black uppercase tracking-widest rounded-full">{selectedCourse.category}</span>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />{selectedCourse.duration}
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4">{selectedCourse.title}</h2>
                <div className="text-xl font-black text-[#C1272D] mb-6">{selectedCourse.price.toLocaleString()} FCFA</div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">{selectedCourse.description}</p>
                <div className="space-y-3 mb-8">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Au programme
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {['Fondamentaux techniques', 'Ateliers pratiques', 'Certification officielle', 'Support post-formation'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 bg-[#C1272D] rounded-full" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => { handleEnroll(selectedCourse.title, selectedCourse.price); setSelectedCourse(null); }}
                    className="flex-1 bg-[#C1272D] text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-[#1E4D8C] transition-all flex items-center justify-center gap-3 active:scale-95">
                    S'inscrire via WhatsApp
                  </button>
                  <button onClick={() => setSelectedCourse(null)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#C1272D] hover:text-[#C1272D]">
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Centre de Formation GCFI</h2>
            <p className="text-slate-500 dark:text-slate-400">Formations certifiantes en télécom et cybersécurité.</p>
          </div>
          <button onClick={() => setIsFilterOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start md:self-auto">
            <Filter className="w-4 h-4" /> Filtres
            {(selectedTag || sortBy !== 'default') && (
              <span className="w-2 h-2 rounded-full bg-[#C1272D]" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#C1272D] transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thématique */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Thématique</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedTag(null)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                        selectedTag === null ? "bg-[#C1272D] text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100")}>
                      Tous
                    </button>
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setSelectedTag(tag)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                          selectedTag === tag ? "bg-[#C1272D] text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100")}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Tri */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Trier par</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all",
                          sortBy === opt.value ? "bg-[#C1272D] text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100")}>
                        <ArrowUpDown className="w-3 h-3" /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              {courses.length === 0 ? 'Aucune formation disponible pour le moment.' : 'Aucune formation trouvée.'}
            </p>
            {courses.length === 0
              ? <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Contactez-nous pour connaître le planning.</p>
              : <button onClick={() => { setSearchQuery(''); setSelectedTag(null); setSortBy('default'); }}
                  className="mt-4 text-sm text-[#C1272D] font-bold hover:underline">
                  Réinitialiser les filtres
                </button>
            }
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course) => (
                <motion.div key={course.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all shadow-sm flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <Image src={course.image} alt={course.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 50vw" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C1272D] text-white">{course.category}</span>
                    </div>
                    {(course.discount ?? 0) > 0 && (
                      <span className="absolute top-4 right-4 bg-amber-400 text-white text-[10px] font-black px-2 py-1 rounded-full shadow">
                        -{course.discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4">
                      <Clock className="w-4 h-4 mr-2" />{course.duration}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#C1272D] transition-colors">{course.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.tags?.map(tag => (
                        <button key={tag} onClick={e => { e.stopPropagation(); setSelectedTag(tag); }}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#C1272D] transition-colors">
                          #{tag}
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-2 italic flex-1">{course.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 mt-auto">
                      <button onClick={() => setSelectedCourse(course)}
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#C1272D] transition-colors flex items-center gap-1">
                        <Info className="w-3 h-3" /> Détails
                      </button>
                      {(course.discount ?? 0) > 0 ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg font-bold text-[#C1272D]">
                            {Math.round(course.price * (1 - (course.discount ?? 0) / 100)).toLocaleString()} FCFA
                          </span>
                          <span className="text-sm text-slate-400 line-through">{course.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-[#C1272D]">{course.price.toLocaleString()} FCFA</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <button onClick={() => handleEnroll(course.title, course.price)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-[#C1272D] hover:text-white transition-all group">
                        S'inscrire <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-20 bg-[#C1272D] rounded-[2rem] p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-3xl font-bold mb-4">Besoin d'un programme sur mesure ?</h3>
              <p className="text-red-100 opacity-80">Nous accompagnons les entreprises dans la montée en compétences de leurs équipes techniques.</p>
            </div>
            <button onClick={onContactOpen} className="bg-white text-[#C1272D] px-8 py-4 rounded-full font-bold hover:bg-red-50 transition-colors whitespace-nowrap">
              Demander un devis formation
            </button>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full" />
        </div>
      </div>
    </section>
  );
}
