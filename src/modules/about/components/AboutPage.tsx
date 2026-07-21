'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Target, Eye, Heart, Zap, Users, Award,
  Network, Globe, ShieldCheck, Wifi, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLang, type Translations } from '@/shared/context/LanguageContext';

/* ── Données statiques (icônes, couleurs — indépendants de la langue) ── */
const VALUE_STYLES = [
  { icon: Heart,       color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { icon: Zap,         color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Users,       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
];

const GRID_STYLES = [
  { icon: Network, label: 'networks',  bg: 'bg-blue-50 dark:bg-blue-900/20',    color: 'text-blue-500' },
  { icon: Globe,   label: 'connectivity', bg: 'bg-emerald-50 dark:bg-emerald-900/20', color: 'text-emerald-500' },
  { icon: Wifi,    label: 'hotspot',  bg: 'bg-violet-50 dark:bg-violet-900/20', color: 'text-violet-500' },
  { icon: Award,   label: 'certification', bg: 'bg-amber-50 dark:bg-amber-900/20',   color: 'text-amber-500' },
];

function getStats(t: Translations) {
  return [
    { value: '9+', label: t.about_page.year_prefix },
    { value: '200+', label: t.about_page.projects_count },
    { value: '100+', label: t.about_page.clients_count },
    { value: '17', label: t.about_page.services_count },
  ];
}

const TEAM = [
  {
    name: 'Gaveaux Christian Adriaque',
    role: 'Directeur Général & Fondateur',
    initials: 'GC',
    photo: '/team/gaveaux-christian-1.png',
  },
  {
    name: 'Gaveaux Christian Adriaque',
    role: 'Directeur Technique',
    initials: 'GC',
    photo: '/team/gaveaux-christian-2.png',
  },
  { name: 'GCFI Studios',       role: 'Production vidéo & Communication',    initials: 'GS', photo: null },
  { name: 'Support Technique',  role: 'Assistance & Maintenance 24/7',        initials: 'ST', photo: null },
];

/* ── Composant ───────────────────────────────────────────────── */
export default function AboutPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pt-20">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-150 h-150 rounded-full bg-[#C1272D]/5 dark:bg-[#C1272D]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-100 h-100 rounded-full bg-slate-100 dark:bg-slate-800/50 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center">
            <span className="inline-block px-4 py-1.5 bg-[#C1272D]/10 text-[#C1272D] rounded-full text-xs font-black uppercase tracking-widest mb-6">
              {t.about_page.hero_tag}
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-6">
              {t.about_page.hero_title}{' '}
              <span className="text-[#C1272D] relative">
                GCFI
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q100 0 200 6" stroke="#C1272D" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                </svg>
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              {t.about_page.hero_text}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-800/50 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {getStats(t).map((s: { value: string; label: string }, i: number) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-4xl md:text-5xl font-black text-[#C1272D] mb-2">{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="bg-[#C1272D] rounded-3xl p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black mb-4">{t.about_page.mission_title}</h2>
            <p className="text-white/80 leading-relaxed">{t.about_page.mission_text}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10 text-white relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black mb-4">{t.about_page.vision_title}</h2>
            <p className="text-white/80 leading-relaxed">{t.about_page.vision_text}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Qui sommes-nous ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}>
              <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-3 block">{t.about_page.who_tag}</span>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                {t.about_page.who_title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{t.about_page.who_text1}</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">{t.about_page.who_text2}</p>
              <div className="flex flex-wrap gap-3">
                {['Ubiquiti', 'Mikrotik', 'Starlink', 'TP-Link', 'CCTV', 'Fibre Optique'].map(tech => (
                  <span key={tech}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Visual grid */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} className="grid grid-cols-2 gap-4">
              {GRID_STYLES.map((item, i) => (
                <div key={item.label}
                  className={`${item.bg} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 aspect-square`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{(t.about_page.grid_labels as unknown as string[])[i]}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Historique ───────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-3 block">{t.about_page.timeline_tag}</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">{t.about_page.timeline_title}</h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-10">
              {t.about_page.timeline.map((item: { year: string; title: string; text: string }, i: number) => (
                <motion.div key={item.year}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex gap-8 pl-16 relative">
                  {/* Dot */}
                  <div className="absolute left-0 top-1 w-12 h-12 rounded-2xl bg-[#C1272D] flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                    <span className="text-white text-[10px] font-black">{item.year.slice(2)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-black text-[#C1272D] uppercase tracking-widest">{item.year}</span>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-3 block">{t.about_page.values_tag}</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">{t.about_page.values_title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(t.about_page.values as unknown as {title:string;text:string}[]).map((v: {title: string; text: string}, i: number) => {
              const vs = VALUE_STYLES[i];
              return (
                <motion.div key={v.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all">
                  <div className={`w-12 h-12 ${vs.bg} rounded-2xl flex items-center justify-center mb-5`}>
                    <vs.icon className={`w-6 h-6 ${vs.color}`} />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Équipe ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#C1272D] mb-3 block">{t.about_page.team_tag}</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">{t.about_page.team_title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <motion.div key={`${member.name}-${i}`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden text-center border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all">
                {/* Photo ou initiales */}
                {member.photo ? (
                  <div className="relative w-full h-52 overflow-hidden">
                    <Image
                      src={member.photo}
                      alt={member.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-52 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                    <span className="text-4xl font-black text-[#C1272D]">{member.initials}</span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-black text-slate-900 dark:text-white mb-1 text-sm">{member.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{(t.about_page.team_roles as unknown as string[])[i]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-linear-to-br from-[#C1272D] to-[#8B0000] rounded-[2.5rem] p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-24 h-24 border-2 border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
            </div>
            <h2 className="text-3xl font-black mb-4 relative">{t.about_page.cta_title}</h2>
            <p className="text-white/80 mb-8 relative max-w-xl mx-auto">{t.about_page.cta_text}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <a href="/#contact"
                className="inline-flex items-center gap-2 bg-white text-[#C1272D] px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 transition-colors">
                {t.about_page.cta_btn} <ChevronRight className="w-4 h-4" />
              </a>
              <Link href="/services"
                className="inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/30 transition-colors">
                {t.about_page.cta_link}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}