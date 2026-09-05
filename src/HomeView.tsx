'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  Star, Award, ChevronLeft, ChevronRight, Calendar,
  ArrowRight, Network, Wifi, Globe, ShieldCheck, Zap, Radio,
  Target, Eye, Heart, Zap as ZapIcon, Users, CheckCircle,
  GraduationCap, ShoppingBag, Phone, Play, Gift, PartyPopper
} from 'lucide-react';
import { useTestimonials, useAchievements, usePartners, useTrainings, useProducts } from '@/shared/lib/queries';
import { cn } from '@/shared/lib/utils';
import { useLang, type Translations } from '@/shared/context/LanguageContext';
import { useContact } from '@/shared/context/ContactContext';
import type { Testimonial, Achievement, Partner, Course } from '@/shared/types';

const needsUnoptimized = (src: string | undefined | null) =>
  typeof src === 'string' && !src.includes('cloudinary') && !src.includes('unsplash');

/* ── Fallback structure (non-translated parts) ──────────────── */
const FALLBACK_TESTIMONIAL_BASE = [
  { id: '1', name: 'Jean-Pierre Ndombe',    avatar_url: 'https://i.pravatar.cc/150?u=jpn', rating: 5, status: 'approved' as const },
  { id: '2', name: 'Marie-Claire Touadera', avatar_url: 'https://i.pravatar.cc/150?u=mct', rating: 5, status: 'approved' as const },
  { id: '3', name: 'Sylvain Banga',         avatar_url: 'https://i.pravatar.cc/150?u=sb', rating: 5, status: 'approved' as const },
];
const FALLBACK_ACHIEVEMENT_BASE = [
  { id: '1', year: '2023', image: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&q=80&w=800', gallery: [] as string[] },
  { id: '2', year: '2022', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800', gallery: [] as string[] },
  { id: '3', year: '2023', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', gallery: [] as string[] },
];

function buildFallbackTestimonials(t: Translations): Testimonial[] {
  const roles = t.home_page.testimonial_roles as unknown as string[];
  const contents = t.home_page.testimonial_contents as unknown as string[];
  return FALLBACK_TESTIMONIAL_BASE.map((b, i) => ({ ...b, role: roles[i] || '', content: contents[i] || '' }));
}
function buildFallbackAchievements(t: Translations): Achievement[] {
  const titles = t.home_page.achievement_titles as unknown as string[];
  const descs = t.home_page.achievement_descs as unknown as string[];
  return FALLBACK_ACHIEVEMENT_BASE.map((b, i) => ({ ...b, title: titles[i] || '', description: descs[i] || '' }));
}
const fallbackPartners: Partner[] = [
  { id: '1', name: 'Orange RCA',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png' },
  { id: '2', name: 'Telecel',         logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Telecel_Logo.png' },
  { id: '3', name: 'Banque Mondiale', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/World_Bank_logo.svg/1200px-World_Bank_logo.svg.png' },
  { id: '4', name: 'Huawei',          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Huawei_Logo.svg/1200px-Huawei_Logo.svg.png' },
];

/* ── Données About (intégrées) ───────────────────────────────── */
const VALUE_ICONS = [
  { icon: Heart,       color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { icon: ZapIcon,     color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Users,       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
];

const TOP_SERVICE_ICONS = [Network, Wifi, Globe, ShieldCheck, Zap, Radio] as const;

/* ── Confettis (client‑side only) ────────────────────────────── */
const CONFETTI_COLORS = ['#C1272D', '#2563B0', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#FFFFFF'];

function seededRandom(seed: number, index: number) {
  const x = Math.sin(seed * 9301 + index * 49297) * 49297;
  return x - Math.floor(x);
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <>{children}</>;
}

function ConfettiParticle({ i, seed }: { i: number; seed: number }) {
  const color = CONFETTI_COLORS[Math.floor(seededRandom(seed, i) * CONFETTI_COLORS.length)];
  const size = seededRandom(seed, i + 100) * 8 + 4;
  const left = seededRandom(seed, i + 200) * 100;
  const duration = seededRandom(seed, i + 300) * 3 + 3;
  const delay = seededRandom(seed, i + 400) * 3;
  const rotation = seededRandom(seed, i + 500) * 360;
  const shape = Math.floor(seededRandom(seed, i + 600) * 3);
  const clipPath = shape === 2 ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {};
  const borderRadius = shape === 0 ? '50%' : shape === 1 ? '2px' : '0';

  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{ left: `${left}%`, top: -20 }}
      animate={{
        y: [0, window.innerHeight + 100],
        x: [0, seededRandom(seed, i + 700) * 80 - 40],
        rotate: [0, rotation * 2],
        opacity: [1, 0.4, 0],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <div style={{ width: size, height: size, backgroundColor: color, borderRadius, ...clipPath }} />
    </motion.div>
  );
}

function BirthdayConfetti({ heroSlide }: { heroSlide: number }) {
  const isBirthdaySlide = heroSlide >= 6;
  const seedRef = React.useRef(Math.floor(Math.random() * 100000));

  if (!isBirthdaySlide) return null;

  return (
    <ClientOnly>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <ConfettiParticle key={i} i={i} seed={seedRef.current} />
        ))}
      </div>
    </ClientOnly>
  );
}

/* ── Section wrapper animée ─────────────────────────────────── */
function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref    = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Slider cartes : nb d'éléments visibles selon l'écran ────── */
const CARD_SLIDER_BREAKPOINTS = [
  { minWidth: 1024, perView: 3 }, // desktop
  { minWidth: 768,  perView: 2 }, // tablette
];
function useResponsivePerView(): number {
  // 1 carte par défaut (mobile + rendu SSR) pour éviter tout mismatch d'hydratation
  const [perView, setPerView] = React.useState(1);
  React.useEffect(() => {
    const mqls = CARD_SLIDER_BREAKPOINTS.map(b => window.matchMedia(`(min-width: ${b.minWidth}px)`));
    const update = () => {
      const matched = CARD_SLIDER_BREAKPOINTS.find((_, i) => mqls[i].matches);
      setPerView(matched?.perView ?? 1);
    };
    update();
    mqls.forEach(m => m.addEventListener('change', update));
    return () => mqls.forEach(m => m.removeEventListener('change', update));
  }, []);
  return perView;
}

// Fenêtre glissante : toujours `perView` éléments visibles, on avance d'un élément
function useCardSlider(itemCount: number) {
  const perView       = useResponsivePerView();
  const [start, setStart] = React.useState(0);
  const viewportRef   = React.useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = React.useState(0);

  // Mesure la largeur du viewport pour un défilement précis en pixels
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxStart       = Math.max(0, itemCount - perView);
  const safeStart      = Math.min(start, maxStart);
  const hasOverflow    = itemCount > perView;
  const positionCount  = maxStart + 1;
  const next = () => setStart(s => (Math.min(s, maxStart) + 1) % positionCount);
  const prev = () => setStart(s => (Math.min(s, maxStart) - 1 + positionCount) % positionCount);

  return { perView, start: safeStart, setStart, next, prev, viewportRef, viewportWidth, hasOverflow, positionCount };
}

/* ── Images hero slideshow ───────────────────────────────────── */
const HERO_BASE = [
  { src: '/team/gcfi-formation-salle.png', alt: 'Salle de formation GCFI',    card: { icon: GraduationCap, label: 'Formation Professionnelle', desc: 'Certifications réseaux & cybersécurité' } },
  { src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1600', alt: 'Infrastructure réseau datacenter', card: { icon: Network,     label: 'Réseaux LAN/WAN',    desc: 'Infrastructure réseau enterprise robuste' } },
  { src: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?auto=format&fit=crop&q=80&w=1600', alt: 'Déploiement fibre optique',         card: { icon: Zap,         label: 'Fibre Optique',        desc: "Jusqu'à 10 Gbps, fiabilité maximale" } },
  { src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1600', alt: 'Salle serveurs',                   card: { icon: ShieldCheck, label: 'Cybersécurité',       desc: 'Audit, protection et monitoring 24/7' } },
  { src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=1600', alt: 'Technicien réseau',              card: { icon: Radio,       label: 'Liaisons Hertziennes', desc: 'P2P Ubiquiti, Mikrotik, TP-Link' } },
  { src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=1600', alt: 'Formation professionnelle',        card: { icon: GraduationCap, label: 'Formation Pro',       desc: 'Certifications Mikrotik, VPN, ISP Core' } },
  { src: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=1600', alt: 'Anniversaire GCFI - Gâteau',       card: { icon: Gift,        label: 'Anniv. 9 Ans',       desc: 'GCFI fête ses 9 années d\'excellence' } },
  { src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=1600', alt: 'Anniversaire GCFI - Fête',        card: { icon: PartyPopper, label: 'Offre Anniversaire', desc: 'Profitez de -20% sur nos services' } },
];

/* ══════════════════════════════════════════════════════════════ */
export default function HomeView() {
  const router = useRouter();
  const { openContact } = useContact();
  const { t, lang } = useLang();
  const fallbackTestimonials = React.useMemo(() => buildFallbackTestimonials(t), [t]);
  const fallbackAchievements = React.useMemo(() => buildFallbackAchievements(t), [t]);
  const { data: testimonials = fallbackTestimonials } = useTestimonials(lang) as { data: Testimonial[] };
  const { data: achievements = fallbackAchievements } = useAchievements(lang) as { data: Achievement[] };
  const { data: partners     = fallbackPartners }     = usePartners(lang)     as { data: Partner[] };
  const { data: trainings    = [] }                   = useTrainings(lang);
  const { data: products     = [] }                   = useProducts(lang);

  const [heroSlide,           setHeroSlide]           = React.useState(0);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [mvIndex, setMvIndex] = React.useState(0); // 0 = mission, 1 = vision
  const achievementsSlider = useCardSlider(achievements.length);
  const testimonialsSlider = useCardSlider(testimonials.length);

  const VALUES = React.useMemo(() =>
    (t.about_page.values as unknown as {title:string;text:string}[]).map((v, i) => ({ ...v, ...VALUE_ICONS[i] })),
    [t]
  );

  // Slides dynamiques avec traductions
  const HERO_IMAGES = React.useMemo(() =>
    HERO_BASE.map((base, i) => ({
      ...base,
      tag: t.home_hero.slides[i].tag,
      title: t.home_hero.slides[i].title,
      sub: t.home_hero.slides[i].sub,
      card: {
        ...base.card,
        label: (t.home_hero.card_labels as unknown as string[])[i],
        desc: (t.home_hero.card_descs as unknown as string[])[i],
      },
    })),
    [t]
  );

  // Auto-avance du slideshow hero toutes les 5s
  React.useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Auto-avance du carrousel anniversaire toutes les 4s
  React.useEffect(() => {
    const t = setInterval(() => setCarouselIndex(s => (s + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  // Alternance indéfinie de la carte flottante Mission / Vision
  React.useEffect(() => {
    const t = setInterval(() => setMvIndex(i => (i + 1) % 2), 3500);
    return () => clearInterval(t);
  }, []);

  // Préchargement de l'image suivante du carrousel pour éliminer le temps de chargement
  const BIRTHDAY_IMAGES = React.useMemo(() => [
    '/9e_anniv/ChatGPT Image 21 juil. 2026, 13_12_04.png',
    '/9e_anniv/ChatGPT Image 21 juil. 2026, 13_10_44.png',
    '/9e_anniv/ChatGPT Image 21 juil. 2026, 13_11_45.png',
  ], []);

  React.useEffect(() => {
    const nextIndex = (carouselIndex + 1) % 3;
    const img = new window.Image();
    img.src = BIRTHDAY_IMAGES[nextIndex];
  }, [carouselIndex, BIRTHDAY_IMAGES]);

  const featuredTrainings = trainings.slice(0, 3);
  const featuredProducts  = products.slice(0, 4);


  return (
    <div className="bg-white dark:bg-slate-900 overflow-x-hidden">

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center pt-17 overflow-hidden">

        {/* ── Slideshow background ── */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={heroSlide}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={HERO_IMAGES[heroSlide].src}
                alt={HERO_IMAGES[heroSlide].alt}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority
                unoptimized={HERO_IMAGES[heroSlide].src.startsWith('/')}
              />
            </motion.div>
          </AnimatePresence>
          {/* Overlay sombre gradient pour lisibilité du texte */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-900/85 via-slate-900/60 to-slate-900/20" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent" />
        </div>

        {/* 🎉 Confettis sur les slides d'anniversaire */}
        <BirthdayConfetti heroSlide={heroSlide} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative w-full z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div key={heroSlide}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}>

                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D] animate-pulse" />
                    {HERO_IMAGES[heroSlide].tag}
                  </span>

                  <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                    {HERO_IMAGES[heroSlide].title.includes('Centrafrique') ? (
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
                    ) : (
                      HERO_IMAGES[heroSlide].title
                    )}
                  </h1>

                  <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-lg">
                    {HERO_IMAGES[heroSlide].sub}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <button onClick={() => router.push('/services')}
                  className="flex items-center gap-2.5 px-8 py-4 bg-[#C1272D] text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:-translate-y-0.5">
                  {t.hero.cta_services} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => router.push('/formation')}
                  className="flex items-center gap-2.5 px-8 py-4 bg-white/15 backdrop-blur-sm text-white border border-white/30 rounded-2xl font-bold text-sm hover:bg-white/25 transition-all hover:-translate-y-0.5">
                  <GraduationCap className="w-4 h-4" /> {t.hero.cta_formations}
                </button>
              </motion.div>
            </div>

            {/* Right — single card that changes with each slide */}
            <div className="hidden lg:flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlide}
                  initial={{ opacity: 0, x: 40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  onClick={() => router.push('/services')}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 cursor-pointer w-full max-w-sm hover:bg-white/15 transition-all group"
                >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C1272D] transition-colors">
                    {React.createElement(HERO_IMAGES[heroSlide].card.icon, {
                      className: 'w-8 h-8 text-white'
                    })}
                  </div>
                  <p className="text-white font-black text-2xl mb-3">{HERO_IMAGES[heroSlide].card.label}</p>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">{HERO_IMAGES[heroSlide].card.desc}</p>
                  <span className="flex items-center gap-2 text-xs font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
                    {t.hero.card_more} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. QUI SOMMES-NOUS ══════════════════════════════════ */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <FadeIn>
              <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-4">{t.home_page.section2_tag}</span>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                {t.home_page.section2_title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {t.home_page.section2_text1}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                {t.home_page.section2_text2}
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {(t.home_page.tech_tags as unknown as string[]).map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">{tag}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={openContact}
                  className="flex items-center gap-2 px-6 py-3 bg-[#C1272D] text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all">
                  {t.home_page.section2_cta1} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => router.push('/services')}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  {t.home_page.section2_cta2}
                </button>
              </div>
            </FadeIn>

            <div className="relative pb-14">
              {/* Carte anniversaire */}
              <FadeIn>
                <div className="relative h-[26rem] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 group">
                  {/* Images du carrousel */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={carouselIndex}
                      initial={{ opacity: 0, x: 60, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -60, scale: 0.97 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={BIRTHDAY_IMAGES[carouselIndex]}
                        alt={[
                          '9e anniversaire GCFI',
                          '9e anniversaire GCFI - célébration',
                          '9e anniversaire GCFI - reconnaissance',
                        ][carouselIndex]}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized
                        priority
                      />
                      {/* Overlay gradient plus prononcé pour lisibilité */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Texte overlay — badge + titre qui changent avec chaque image */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`text-${carouselIndex}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#C1272D] to-[#2563B0] text-white text-xs font-bold rounded-full mb-3 shadow-lg">
                          <PartyPopper className="w-3.5 h-3.5" />{' '}
                          {(t.home_page.birthday_section.carousel_badges as unknown as string[])[carouselIndex]}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight max-w-lg drop-shadow-lg">
                          {(t.home_page.birthday_section.carousel_titles as unknown as string[])[carouselIndex]}
                        </h3>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </FadeIn>

              {/* Carte Mission / Vision flottante, superposée à la carte anniversaire, alterne indéfiniment */}
              <div className="absolute -bottom-10 right-6 z-20 w-[72%] sm:w-64">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mvIndex}
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={cn('rounded-2xl p-6 text-white shadow-2xl', mvIndex === 0 ? 'bg-[#C1272D]' : 'bg-slate-900 dark:bg-slate-700')}
                  >
                    {mvIndex === 0
                      ? <Target className="w-6 h-6 mb-3 opacity-80" />
                      : <Eye className="w-6 h-6 mb-3 opacity-80" />}
                    <h3 className="font-black mb-2">{mvIndex === 0 ? t.home_page.mission_title : t.home_page.vision_title}</h3>
                    <p className="text-xs text-white/80 leading-relaxed">{mvIndex === 0 ? t.home_page.mission_text : t.home_page.vision_text}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. PILIERS ══════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-3">{t.home_page.section3_tag}</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{t.home_page.section3_title}</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                path: '/services', emoji: '🌐',
                title: t.home_page.pillar1_title,
                desc: t.home_page.pillar1_desc,
                cta: t.home_page.pillar1_cta,
                features: t.home_page.pillar1_features as unknown as string[],
                bg: 'from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10',
                accent: '#C1272D',
              },
              {
                path: '/formation', emoji: '🎓',
                title: t.home_page.pillar2_title,
                desc: t.home_page.pillar2_desc,
                cta: t.home_page.pillar2_cta,
                features: t.home_page.pillar2_features as unknown as string[],
                bg: 'from-blue-50 to-sky-50 dark:from-blue-900/10 dark:to-sky-900/10',
                accent: '#2563EB',
              },
              {
                path: '/boutique', emoji: '🛍️',
                title: t.home_page.pillar3_title,
                desc: t.home_page.pillar3_desc,
                cta: t.home_page.pillar3_cta,
                features: t.home_page.pillar3_features as unknown as string[],
                bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10',
                accent: '#059669',
              },
            ].map((item, i) => (
              <FadeIn key={item.path} delay={i * 0.1}>
                <div onClick={() => router.push(item.path)}
                  className={cn(
                    'relative bg-linear-to-br rounded-3xl p-8 border border-slate-100 dark:border-slate-700 cursor-pointer group overflow-hidden h-full flex flex-col',
                    item.bg
                  )}>
                  <div className="text-4xl mb-5">{item.emoji}</div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                  <ul className="space-y-2 mb-8 flex-1">
                    {item.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: item.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <span className="flex items-center gap-2 text-sm font-bold mt-auto" style={{ color: item.accent }}>
                    {item.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ NOS PRODUITS POPULAIRES ═══════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-12 px-4 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-3">{t.home_page.products_tag}</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{t.home_page.products_title}</h2>
              </div>
              <Link href="/boutique" className="flex items-center gap-2 text-sm font-bold text-[#C1272D] hover:gap-3 transition-all shrink-0">
                {t.home_page.products_link} <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, i) => (
                <FadeIn key={product.id} delay={i * 0.08}>
                  <div onClick={() => router.push('/boutique')}
                    className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all shadow-sm cursor-pointer h-full flex flex-col">
                    <div className="relative h-44 overflow-hidden">
                      <Image src={product.image} alt={product.name} fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized={needsUnoptimized(product.image)} />
                      {(product.discount ?? 0) > 0 && (
                        <span className="absolute top-3 left-3 bg-[#C1272D] text-white text-[10px] font-black px-2 py-1 rounded-full shadow">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C1272D] mb-1">{product.category}</p>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#C1272D] transition-colors line-clamp-2">{product.name}</h3>
                      <div className="mt-auto flex items-baseline gap-2 flex-wrap">
                        {(product.discount ?? 0) > 0 ? (
                          <>
                            <p className="text-lg font-black text-[#C1272D]">
                              {Math.round(product.price * (1 - (product.discount ?? 0) / 100)).toLocaleString()}
                              <span className="text-xs font-bold ml-1">FCFA</span>
                            </p>
                            <p className="text-xs text-slate-400 line-through">{product.price.toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="text-lg font-black text-[#C1272D]">
                            {product.price.toLocaleString()} <span className="text-xs font-bold">FCFA</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 5. SERVICES GRID (6 services) ═══════════════════════ */}
      <section className="py-12 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-2">{t.home_page.section4_tag}</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t.home_page.section4_title}</h2>
            </div>
            <Link href="/services" className="hidden md:flex items-center gap-2 text-sm font-bold text-[#C1272D] hover:gap-3 transition-all">
              {t.home_page.section4_link} <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOP_SERVICE_ICONS.map((Icon, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div onClick={() => router.push('/services')}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-[#C1272D]/20 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#C1272D] transition-colors">
                    <Icon className="w-6 h-6 text-[#C1272D] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2 group-hover:text-[#C1272D] transition-colors">{(t.home_page.top_service_labels as unknown as string[])[i]}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{(t.home_page.top_service_descs as unknown as string[])[i]}</p>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#C1272D] opacity-0 group-hover:opacity-100 transition-all">
                    {t.home_page.section4_learn_more} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-bold text-[#C1272D]">
              {t.home_page.section4_mobile_link} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. FORMATIONS EN VEDETTE ════════════════════════════ */}
      {featuredTrainings.length > 0 && (
        <section className="py-16 px-4 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-2">{t.home_page.section5_tag}</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t.home_page.section5_title}</h2>
              </div>
              <Link href="/formation" className="hidden md:flex items-center gap-2 text-sm font-bold text-[#C1272D] hover:gap-3 transition-all">
                {t.home_page.section5_link} <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredTrainings.map((t: Course, i) => (
                <FadeIn key={t.id} delay={i * 0.08}>
                  <div onClick={() => router.push('/formation')}
                    className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all cursor-pointer group">
                    <div className="relative h-44 overflow-hidden">
                      <Image src={t.image || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600'}
                        alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-3 left-3 bg-[#C1272D] text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                        {t.category || 'Télécom'}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{t.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{t.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-[#C1272D]">{t.price?.toLocaleString()} <span className="text-xs">FCFA</span></span>
                        <span className="text-xs text-slate-400">{t.duration || '2 mois'}</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 7. RÉALISATIONS ═════════════════════════════════════ */}
      <section id="realisations" className="py-16 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-2">{t.home_page.section6_tag}</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t.home_page.section6_title}</h2>
            </div>
            {achievementsSlider.hasOverflow ? (
              <div className="flex gap-2">
                <button
                  onClick={achievementsSlider.prev}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#C1272D] hover:border-[#C1272D] hover:text-white transition-all"
                  aria-label="Réalisations précédentes"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={achievementsSlider.next}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#C1272D] hover:border-[#C1272D] hover:text-white transition-all"
                  aria-label="Réalisations suivantes"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Award className="w-10 h-10 text-[#C1272D] opacity-20" />
            )}
          </FadeIn>
          <FadeIn>
            <div ref={achievementsSlider.viewportRef} className="overflow-hidden -mx-3">
              <motion.div
                className="flex"
                animate={{ x: achievementsSlider.viewportWidth ? -achievementsSlider.start * (achievementsSlider.viewportWidth / achievementsSlider.perView) : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {achievements.map(item => (
                  <div key={item.id} className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/realisations/${item.id}`)}
                      aria-label={`${t.home_page.section6_view} — ${item.title}`}
                      className="group w-full h-full flex flex-col text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-xl hover:border-[#C1272D]/40 hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D]/70"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={item.image} alt={item.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white bg-slate-900/55 backdrop-blur-sm border border-white/15">
                          <Calendar className="w-3 h-3" /> {item.year}
                        </span>
                        <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/75">
                            {t.home_page.section6_tag}
                          </span>
                          <span className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:bg-[#C1272D] group-hover:border-[#C1272D] transition-all duration-300">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 p-5">
                        <h3 className="font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#C1272D] transition-colors">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">{item.description}</p>
                        <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#C1272D]">
                          {t.home_page.section6_view}
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </motion.div>
            </div>
          </FadeIn>
          {achievementsSlider.hasOverflow && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: achievementsSlider.positionCount }).map((_, i) => (
                <button key={i}
                  onClick={() => achievementsSlider.setStart(i)}
                  aria-label={`Aller à la réalisation ${i + 1}`}
                  className={cn('h-2 rounded-full transition-all',
                    i === achievementsSlider.start ? 'w-6 bg-[#C1272D]' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600')} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ 8. VALEURS ══════════════════════════════════════════ */}
      <section className="py-14 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-3">{t.home_page.section7_tag}</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t.home_page.section7_title}</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.08}>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', v.bg)}>
                    <v.icon className={cn('w-6 h-6', v.color)} />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. ILS NOUS FONT CONFIANCE ══════════════════════════ */}
      <section className="py-10 px-4 bg-slate-50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">{t.home_page.section9_tag}</p>
          <div className="overflow-hidden">
            <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
              className="flex gap-16 px-8 items-center w-fit">
              {[...partners, ...partners].map((p, idx) => (
                <div key={`trust-${p.id}-${idx}`} className="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all shrink-0">
                  <Image src={p.logo} alt={p.name} width={0} height={0} sizes="120px"
                    className="h-8 w-auto object-contain dark:invert dark:brightness-200" style={{ width: 'auto' }} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 10. TÉMOIGNAGES ══════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] block mb-2">{t.home_page.section10_tag}</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{t.home_page.section10_title}</h2>
            </div>
            {testimonialsSlider.hasOverflow ? (
              <div className="flex gap-2">
                <button
                  onClick={testimonialsSlider.prev}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#C1272D] hover:border-[#C1272D] hover:text-white transition-all"
                  aria-label="Avis précédent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={testimonialsSlider.next}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-[#C1272D] hover:border-[#C1272D] hover:text-white transition-all"
                  aria-label="Avis suivant"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </FadeIn>
          <FadeIn>
            <div ref={testimonialsSlider.viewportRef} className="overflow-hidden -mx-3">
              <motion.div
                className="flex"
                animate={{ x: testimonialsSlider.viewportWidth ? -testimonialsSlider.start * (testimonialsSlider.viewportWidth / testimonialsSlider.perView) : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {testimonials.map(testi => {
                  const avatarSrc = testi.avatar_url || testi.avatar || `https://i.pravatar.cc/150?u=${testi.id}`;
                  return (
                    <div key={testi.id} className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-3">
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col h-full">
                        <div className="flex mb-5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('w-4 h-4', i < testi.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700')} />
                          ))}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed flex-1">"{testi.content}"</p>
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                          <Image src={avatarSrc} alt={testi.name} width={40} height={40} className="rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{testi.name}</p>
                            <p className="text-xs text-[#C1272D] font-semibold">{testi.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </FadeIn>
          {testimonialsSlider.hasOverflow && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: testimonialsSlider.positionCount }).map((_, i) => (
                <button key={i}
                  onClick={() => testimonialsSlider.setStart(i)}
                  aria-label={`Aller à l'avis ${i + 1}`}
                  className={cn('h-2 rounded-full transition-all',
                    i === testimonialsSlider.start ? 'w-6 bg-[#C1272D]' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600')} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ 11. CTA FINAL ═══════════════════════════════════════ */}
      <section className="py-14 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden px-10 py-16 text-center border border-slate-200 dark:border-slate-700 shadow-xl">
              {/* Background deco */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C1272D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

              <span className="inline-block px-4 py-1.5 bg-[#C1272D]/10 text-[#C1272D] rounded-full text-xs font-black uppercase tracking-widest mb-6 relative">
                {t.home_page.section11_tag}
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-5 relative leading-tight">
                {t.home_page.section11_title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 relative max-w-lg mx-auto text-lg">
                {t.home_page.section11_text}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                <button onClick={openContact}
                  className="flex items-center justify-center gap-2 bg-[#C1272D] text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                  <Phone className="w-4 h-4" /> {t.home_page.section11_cta1}
                </button>
                <button onClick={() => router.push('/services')}
                  className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-white/20 transition-all">
                  {t.home_page.section11_cta2} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}