'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, GraduationCap, ShoppingBag, Network, Wifi, ShieldCheck, Zap, Radio } from 'lucide-react';
import { useLang, type Translations } from '@/shared/context/LanguageContext';

interface HeroProps {
  onNavigate: (path: string) => void;
}

const HERO_SLIDE_SRCS = [
  { src: '/team/gcfi-formation-salle.png', alt: 'Salle de formation GCFI' },
  { src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600', alt: 'Infrastructure réseau datacenter' },
  { src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1600', alt: 'Salle serveurs' },
  { src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=1600', alt: 'Technicien réseau' },
  { src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=1600', alt: 'Formation professionnelle' },
];

export default function Hero({ onNavigate }: HeroProps) {
  const { t } = useLang();
  const [slide, setSlide] = React.useState(0);

  const SLIDES = React.useMemo(() =>
    HERO_SLIDE_SRCS.map((base, i) => ({
      ...base,
      tag: (t.hero_slides[i] as Translations['hero_slides'][number]).tag,
      title: t.hero_slides[i].title,
      sub: t.hero_slides[i].sub,
    })),
    [t]
  );

  React.useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center pt-[68px] overflow-hidden">

      {/* ── Background slideshow ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div key={slide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0">
            <Image
              src={SLIDES[slide].src}
              alt={SLIDES[slide].alt}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
              unoptimized={SLIDES[slide].src.startsWith('/')}
            />
          </motion.div>
        </AnimatePresence>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl">

          {/* Texts — change with each slide */}
          <AnimatePresence mode="wait">
            <motion.div key={slide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}>

              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D] animate-pulse" />
                {SLIDES[slide].tag}
              </span>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                {SLIDES[slide].title.includes('Centrafrique') ? (
                  <>
                    Connecter la{' '}
                    <span className="relative">
                      <span className="text-[#ff4d4d]">Centrafrique</span>
                      <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 10" fill="none" preserveAspectRatio="none">
                        <path d="M0 8 Q75 2 150 6 Q225 10 300 4" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
                      </svg>
                    </span>{' '}
                    au monde numérique
                  </>
                ) : SLIDES[slide].title}
              </h1>

              <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-xl">
                {SLIDES[slide].sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs — fixes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button onClick={() => onNavigate('/formation')}
              className="flex items-center gap-2.5 px-8 py-4 bg-[#C1272D] text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:-translate-y-0.5">
              <GraduationCap className="w-4 h-4" /> {t.hero.cta_formations} <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('/boutique')}
              className="flex items-center gap-2.5 px-8 py-4 bg-white/15 backdrop-blur-sm text-white border border-white/30 rounded-2xl font-bold text-sm hover:bg-white/25 transition-all hover:-translate-y-0.5">
              <ShoppingBag className="w-4 h-4" /> {t.nav.boutique}
            </button>
          </motion.div>

          {/* Stats — fixes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex items-center gap-8 flex-wrap border-t border-white/15 pt-10"
          >
            {[
              { v: '9+', l: (t.profile_page.hero_stats as unknown as string[])[0] },
              { v: '200+', l: (t.profile_page.hero_stats as unknown as string[])[1] },
              { v: '500+', l: (t.profile_page.hero_stats as unknown as string[])[2] },
            ].map(s => (
              <div key={s.l}>
                <p className="text-3xl font-black text-white">{s.v}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-0.5">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>


    </section>
  );
}