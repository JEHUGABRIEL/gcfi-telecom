import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, GraduationCap, ShoppingBag } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

// ✅ setActiveModule remplacé par onNavigate (react-router NavigateFunction)
interface HeroProps {
  onNavigate: NavigateFunction;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-white dark:bg-slate-800/50 skew-x-12 origin-top-right transition-colors border-l border-slate-50 dark:border-transparent" />
      <div className="absolute top-1/4 left-0 -z-10 w-64 h-64 bg-(--accent)/5 dark:bg-(--accent)/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-(--accent)/10 text-(--accent) text-xs font-bold uppercase tracking-wider mb-6">
              Leader en Télécommunication 
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1] mb-6">
              Propulsez votre <span className="text-(--accent)">Avenir</span> avec GCFI.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
              De la formation d'experts en cybersécurité à tous vos besoins en équipements télécom, GCFI est votre partenaire technologique en République Centrafricaine.
            </p>

            <div className="flex flex-wrap gap-4">
              {/* ✅ navigate('/formation') au lieu de setActiveModule('training') */}
              <button
                onClick={() => onNavigate('/formation')}
                className="bg-(--accent) text-white px-8 py-4 rounded-full font-bold hover:bg-(--accent-hover) transition-all flex items-center shadow-lg shadow-(--accent)/20"
              >
                Nos Formations
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('/boutique')}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-full font-bold hover:bg-white dark:hover:bg-slate-700 hover:border-(--accent)/30 transition-all shadow-sm"
              >
                Boutique en ligne
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-100 dark:border-slate-800 pt-12">
              <div>
                <p className="text-3xl font-bold text-(--accent)">15+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Années d'Expertise</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-(--accent)">500+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Étudiants Formés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-(--accent)">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Engagement Local</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-64 rounded-3xl overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" alt="Cybersecurity" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="h-48 bg-slate-900 dark:bg-slate-950 rounded-3xl flex flex-col justify-end p-6 text-white border border-white/5">
                  <GraduationCap className="w-8 h-8 mb-4 text-(--accent)" />
                  <h3 className="font-bold text-xl">Formation IT</h3>
                  <p className="text-sm opacity-80">Telecom & Cybersécurité</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-48 bg-(--accent) rounded-3xl flex flex-col justify-end p-6 text-white shadow-xl shadow-black/10">
                  <GraduationCap className="w-8 h-8 mb-4" />
                  <h3 className="font-bold text-xl">Formation</h3>
                  <p className="text-sm opacity-80">Telecom & Cyber</p>
                </div>
                <div className="h-64 rounded-3xl overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800" alt="Telecom" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center transition-colors">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4">
                <ShoppingBag className="text-green-600 dark:text-green-400 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Boutique Ouverte</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Livraison Bangui & Provinces</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
