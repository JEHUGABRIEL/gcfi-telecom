import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Award, ChevronLeft, ChevronRight, X, Calendar, ExternalLink } from 'lucide-react';
import { Hero, GcfiServices, NewsFeed } from '@/modules/home';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import { cn } from '@/shared/lib/utils';
import type { Testimonial, Achievement, Partner } from '@/shared/types';

// ── Données de secours (affichées si les tables sont vides) ──
const fallbackTestimonials: Testimonial[] = [
  { id: '1', name: 'Jean-Pierre Ndombe',    role: 'Directeur IT, Bank of Africa RCA', content: 'GCFI a transformé notre infrastructure réseau avec un professionnalisme exemplaire.', avatar_url: 'https://i.pravatar.cc/150?u=jpn', rating: 5, status: 'approved' },
  { id: '2', name: 'Marie-Claire Touadera', role: 'Étudiante en Cybersécurité',        content: "La formation chez GCFI est d'un niveau international. J'ai trouvé un emploi avant même la fin de mon cursus.", avatar_url: 'https://i.pravatar.cc/150?u=mct', rating: 5, status: 'approved' },
  { id: '3', name: 'Sylvain Banga',         role: 'Entrepreneur, Bangui',              content: "Leur expertise dans le business de l'or est inégalée en RCA.", avatar_url: 'https://i.pravatar.cc/150?u=sb', rating: 5, status: 'approved' },
];
const fallbackAchievements: Achievement[] = [
  { id: '1', title: 'Déploiement Fibre Optique Bangui', description: 'Installation de plus de 50km de fibre optique pour les institutions publiques.', year: '2023', image: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&q=80&w=800', gallery: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800'] },
  { id: '2', title: 'Centre de Données National', description: 'Conception et mise en œuvre du premier datacenter haute disponibilité.', year: '2022', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=800', gallery: [] },
  { id: '3', title: 'Sécurisation Réseau Bancaire', description: 'Audit et renforcement de la cybersécurité pour les banques locales.', year: '2023', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800', gallery: [] },
];
const fallbackPartners: Partner[] = [
  { id: '1', name: 'Orange RCA',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png' },
  { id: '2', name: 'Telecel',         logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Telecel_Logo.png' },
  { id: '3', name: 'Banque Mondiale', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/World_Bank_logo.svg/1200px-World_Bank_logo.svg.png' },
  { id: '4', name: 'Huawei',          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Huawei_Logo.svg/1200px-Huawei_Logo.svg.png' },
];

interface HomeViewProps { onContactOpen: () => void; }

export default function HomeView({ onContactOpen }: HomeViewProps) {
  const navigate = useNavigate();

  // ✅ Toutes les données chargées depuis Supabase avec fallback
  const [testimonials,  setTestimonials]  = React.useState<Testimonial[]>(fallbackTestimonials);
  const [achievements,  setAchievements]  = React.useState<Achievement[]>(fallbackAchievements);
  const [partners,      setPartners]      = React.useState<Partner[]>(fallbackPartners);
  const [testimonialIndex, setTestimonialIndex] = React.useState(0);
  const [selectedAchievement, setSelectedAchievement] = React.useState<Achievement | null>(null);
  const [fullscreenImage, setFullscreenImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Témoignages approuvés
    supabase.from('testimonials').select('*').eq('status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setTestimonials(data as Testimonial[]); })
      .catch(err => logError('HomeView/testimonials', err));

    // Réalisations
    supabase.from('achievements').select('*').order('year', { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setAchievements(data as Achievement[]); })
      .catch(err => logError('HomeView/achievements', err));

    // Partenaires
    supabase.from('partners').select('*').order('order_index', { ascending: true })
      .then(({ data }) => { if (data && data.length > 0) setPartners(data as Partner[]); })
      .catch(err => logError('HomeView/partners', err));
  }, []);

  return (
    <>
      <Hero onNavigate={navigate} />
      <GcfiServices />
      <NewsFeed />

      {/* Piliers */}
      <div className="py-20 bg-white dark:bg-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Nos Piliers d'Excellence</h2>
            <p className="text-slate-600 dark:text-slate-400">Trois domaines d'expertise pour transformer l'économie numérique.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { path: '/formation', icon: '🎓', title: 'Formation',    desc: 'Programmes intensifs en télécom et cybersécurité.', cta: 'Découvrir', onClick: null },
              { path: '/boutique', icon: '🛍️',  title: 'Boutique',    desc: 'Équipements réseaux et terminaux mobiles certifiés.', cta: 'Acheter', onClick: null },
              { path: '/services', icon: '🔧', title: 'Services', desc: 'Déploiement réseau, fibre optique, vidéosurveillance et cybersécurité.', cta: 'Demander un devis', onClick: onContactOpen },
            ].map(item => (
              <div key={item.title} onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
                className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-[#2563B0] transition-all cursor-pointer group">
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{item.desc}</p>
                <span className="text-[#2563B0] font-bold flex items-center gap-2">{item.cta} <ChevronRight className="w-4 h-4" /></span>
              </div>
            ))}
          </div>

          {/* ✅ Réalisations chargées depuis Supabase */}
          <div className="mt-32">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Nos Réalisations</h2>
                <p className="text-slate-600 dark:text-slate-400">Des projets d'envergure qui façonnent l'avenir de la RCA.</p>
              </div>
              <Award className="w-12 h-12 text-[#2563B0] opacity-20" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {achievements.map(item => (
                <div key={item.id} className="group cursor-pointer" onClick={() => setSelectedAchievement(item)}>
                  <div className="h-64 rounded-3xl overflow-hidden mb-6 relative">
                    <motion.img whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }} src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30"><ExternalLink className="w-6 h-6 text-white" /></div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-full text-xs font-bold text-[#2563B0]">{item.year}</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#2563B0] transition-colors">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Partenaires chargés depuis Supabase */}
          <div className="mt-32 py-16 border-y border-slate-200 dark:border-slate-800 overflow-hidden">
            <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-12">Ils nous font confiance</p>
            <div className="flex w-fit">
              <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                className="flex gap-12 md:gap-24 px-12 items-center">
                {[...partners, ...partners].map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all shrink-0">
                    <img src={p.logo} alt={p.name} className="h-8 md:h-12 object-contain dark:invert dark:brightness-200" loading="lazy" />
                    <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{p.name}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* ✅ Témoignages chargés depuis Supabase */}
          <div className="mt-32">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                Avis de nos <span className="text-[#2563B0]">Clients</span>
              </h2>
              <div className="flex gap-4">
                <button onClick={() => setTestimonialIndex(p => (p - 1 + testimonials.length) % testimonials.length)}
                  className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#2563B0] hover:border-[#2563B0] hover:text-white transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setTestimonialIndex(p => (p + 1) % testimonials.length)}
                  className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#2563B0] hover:border-[#2563B0] hover:text-white transition-all">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2].map(offset => {
                const t = testimonials[(testimonialIndex + offset) % testimonials.length];
                const avatarSrc = t.avatar_url || t.avatar || `https://i.pravatar.cc/150?u=${t.id}`;
                return (
                  <motion.div key={`${t.id}-${testimonialIndex}-${offset}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className={cn('bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col',
                      offset === 1 ? 'hidden md:flex' : '', offset === 2 ? 'hidden lg:flex' : '')}>
                    <div className="flex items-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-yellow-400 fill-current' : 'text-slate-200 dark:text-slate-700')} />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic mb-8 leading-relaxed h-24 line-clamp-4">"{t.content}"</p>
                    <div className="mt-auto flex items-center">
                      <img src={avatarSrc} alt={t.name} loading="lazy" className="w-12 h-12 rounded-full mr-4 border-2 border-[#2563B0]/20" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</p>
                        <p className="text-xs text-[#2563B0] font-medium tracking-wide uppercase">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAchievement(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedAchievement(null)} className="absolute top-8 right-8 z-10 bg-slate-100 dark:bg-slate-800 p-3 rounded-full hover:text-[#2563B0] transition-all">
                <X className="w-6 h-6" />
              </button>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-80 md:h-[500px]">
                  <img src={selectedAchievement.image} alt={selectedAchievement.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="md:w-1/2 p-12">
                  <div className="flex items-center gap-3 text-[#2563B0] font-black uppercase tracking-widest text-xs mb-6">
                    <Calendar className="w-4 h-4" />{selectedAchievement.year}
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-8">{selectedAchievement.title}</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{selectedAchievement.description}</p>
                  {selectedAchievement.gallery && selectedAchievement.gallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      {selectedAchievement.gallery.map((img, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.05 }} onClick={() => setFullscreenImage(img)} className="h-24 rounded-2xl overflow-hidden cursor-zoom-in">
                          <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen image */}
      <AnimatePresence>
        {fullscreenImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFullscreenImage(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-5xl w-full">
              <button onClick={() => setFullscreenImage(null)} className="absolute -top-16 right-0 p-4 text-white hover:text-red-500 transition-colors"><X className="w-8 h-8" /></button>
              <img src={fullscreenImage} alt="" loading="lazy" className="w-full h-auto rounded-3xl shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
