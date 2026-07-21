'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi, Network, Shield, Camera, Satellite, Server, CheckCircle,
  Wrench, Zap, Video, Globe, Lock, Radio, HardDrive, Truck,
  TrafficCone, Construction, LineChart, Megaphone, Palette, Tv,
  Scissors, Clapperboard, Film, Cpu, Database, Phone, Monitor,
  ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { cn } from '@/shared/lib/utils';
import { useLang, type Translations } from '@/shared/context/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Network, Wifi, Shield, Camera, Satellite, Server, Wrench, Zap,
  Video, Globe, Lock, Radio, HardDrive, Truck, TrafficCone,
  Construction, LineChart, Megaphone, Palette, Tv, Scissors,
  Clapperboard, Film, Cpu, Database, Phone, Monitor,
};

const SERVICE_ICONS = [Network, Wifi, Satellite, Server, Camera, Shield] as const;

const SLIDE_SRCS = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600',
] as const;

function getSlides(t: Translations) {
  const s = t.services_page.slides;
  return SLIDE_SRCS.map((src, i) => ({
    src,
    tag: s[`tag${i + 1}` as keyof typeof s],
    title: s[`title${i + 1}` as keyof typeof s],
    sub: s[`sub${i + 1}` as keyof typeof s],
  }));
}

function getStaticServices(t: Translations) {
  const ss = t.services_page.static_services;
  return ss.map((s: { title: string; desc: string; features: readonly string[] }, i: number) => ({
    icon: SERVICE_ICONS[i],
    title: s.title,
    description: s.desc,
    features: s.features,
  }));
}

export default function ServicesPage() {
  const { t } = useLang();
  const SLIDES = React.useMemo(() => getSlides(t), [t]);
  const STATIC_SERVICES = React.useMemo(() => getStaticServices(t), [t]);

  const [allServices, setAllServices] = React.useState<{ icon: React.ElementType; title: string; description: string; features: readonly string[] }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    supabase.from('services').select('id, title, description, icon').eq('is_active', true)
      .order('order_index', { ascending: true })
      .then(({ data, error }) => {
        setAllServices(!error && data?.length ? data.map((s: { icon: string; title: string; description: string }) => ({ icon: ICON_MAP[s.icon] || Wrench, title: s.title, description: s.description, features: [] })) : STATIC_SERVICES);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── Hero slideshow ── */}
      <div className="relative h-[56vh] min-h-[420px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div key={slide}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }} className="absolute inset-0">
            <Image src={SLIDES[slide].src} alt={SLIDES[slide].tag} fill className="object-cover" sizes="100vw" priority />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-16">
          <AnimatePresence mode="wait">
            <motion.div key={slide}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }} className="flex flex-col items-center">
              <span className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-black uppercase tracking-widest text-white mb-4">
                {SLIDES[slide].tag}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight max-w-3xl">
                {SLIDES[slide].title}
              </h1>
              <p className="text-white/80 text-lg max-w-xl">{SLIDES[slide].sub}</p>
            </motion.div>
          </AnimatePresence>
          <motion.a href="/#contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#C1272D] text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg">
            {t.services_page.hero_cta} <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={cn('h-1 rounded-full transition-all', i === slide ? 'w-6 bg-white' : 'w-2 bg-white/40')} />
          ))}
        </div>
        <button onClick={() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setSlide(s => (s + 1) % SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 animate-pulse">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-6" />
                <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-3/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allServices.map((service, idx) => (
              <motion.div key={service.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C1272D] transition-colors">
                  <service.icon className="w-7 h-7 text-[#C1272D] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{service.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{service.description}</p>
                {service.features.length > 0 && (
                  <ul className="space-y-2">
                    {service.features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="w-4 h-4 text-[#C1272D]" />{feature}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.services_page.cta_title}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">{t.services_page.cta_text}</p>
          <a href="/#contact" className="inline-flex items-center gap-2 bg-[#C1272D] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-red-700 transition-all">
            {t.services_page.cta_btn}
          </a>
        </div>
      </div>
    </div>
  );
}