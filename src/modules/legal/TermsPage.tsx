'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileText, User, ShoppingBag, Shield, AlertTriangle, Scale, RefreshCw, Mail, Ban, GraduationCap } from 'lucide-react';
import { useLang } from '@/shared/context/LanguageContext';

const LAST_UPDATED = '29 mai 2025';
const CONTACT_EMAIL = 'gcfitelecom@gmail.com';
const COMPANY_NAME = 'GCFI Centrafrique';
const SITE_URL = 'www.gcfi-rca.com';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        {children}
      </div>
    </motion.section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl px-4 py-3 text-amber-700 dark:text-amber-400 text-sm font-medium flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center">
                <Scale className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{t.terms_page.hero_badge}</p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t.terms_page.hero_title}</h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t.terms_page.last_update} : <strong className="text-slate-700 dark:text-slate-300">{LAST_UPDATED}</strong>
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.terms_page.hero_paragraph.replace('{SITE_URL}', SITE_URL).replace('{COMPANY_NAME}', COMPANY_NAME)}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">

        {/* 1. Présentation */}
        <Section icon={FileText} title={t.terms_page.section1_title}>
          <p>{t.terms_page.section1_text1.replace('{SITE_URL}', SITE_URL).replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <p>{t.terms_page.section1_text2}</p>
          <ul className="space-y-1 mt-1">
            {(t.terms_page.section1_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
          </ul>
        </Section>

        {/* 2. Compte utilisateur */}
        <Section icon={User} title={t.terms_page.section2_title}>
          <p>{t.terms_page.section2_text1}</p>
          <ul className="space-y-1 mt-1">
            {(t.terms_page.section2_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
          </ul>
          <p className="mt-2">{t.terms_page.section2_suspension.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <Warning>{t.terms_page.section2_warning}</Warning>
        </Section>

        {/* 3. Commandes */}
        <Section icon={ShoppingBag} title={t.terms_page.section3_title}>
          <p>{t.terms_page.section3_text1}</p>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t.terms_page.section3_steps_title}</p>
            <ol className="space-y-1 list-decimal list-inside ml-1">
              {(t.terms_page.section3_steps as unknown as string[]).map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
          <p>{t.terms_page.section3_pricing}</p>
          <Warning>{t.terms_page.section3_warning}</Warning>
        </Section>

        {/* 4. Formations */}
        <Section icon={GraduationCap} title={t.terms_page.section4_title}>
          <p>{t.terms_page.section4_text1}</p>
          <ul className="space-y-1 mt-1">
            {(t.terms_page.section4_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
          </ul>
          <p className="mt-2">{t.terms_page.section4_text2}</p>
        </Section>

        {/* 5. Utilisation interdite */}
        <Section icon={Ban} title={t.terms_page.section5_title}>
          <p>{t.terms_page.section5_text1}</p>
          <ul className="space-y-1 mt-1">
            {(t.terms_page.section5_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
          </ul>
          <p className="mt-2">{t.terms_page.section5_text2}</p>
        </Section>

        {/* 6. Propriété intellectuelle */}
        <Section icon={Shield} title={t.terms_page.section6_title}>
          <p>{t.terms_page.section6_text1.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <p>{t.terms_page.section6_text2}</p>
          <p>{t.terms_page.section6_text3}</p>
        </Section>

        {/* 7. Responsabilité */}
        <Section icon={AlertTriangle} title={t.terms_page.section7_title}>
          <p>{t.terms_page.section7_text1.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <ul className="space-y-1 mt-1">
            {(t.terms_page.section7_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
          </ul>
          <p className="mt-2">{t.terms_page.section7_text2.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <p>{t.terms_page.section7_text3}</p>
        </Section>

        {/* 8. Liens externes */}
        <Section icon={FileText} title={t.terms_page.section8_title}>
          <p>{t.terms_page.section8_text1}</p>
          <p>{t.terms_page.section8_text2.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
        </Section>

        {/* 9. Droit applicable */}
        <Section icon={Scale} title={t.terms_page.section9_title}>
          <p>{t.terms_page.section9_text1}</p>
          <p>{t.terms_page.section9_text2}</p>
          <p>{t.terms_page.section9_text3} <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">{CONTACT_EMAIL}</a></p>
        </Section>

        {/* 10. Modifications */}
        <Section icon={RefreshCw} title={t.terms_page.section10_title}>
          <p>{t.terms_page.section10_text1.replace('{COMPANY_NAME}', COMPANY_NAME)}</p>
          <p>{t.terms_page.section10_text2}</p>
          <p>{t.terms_page.section10_text3.replace('{SITE_URL}', SITE_URL)}</p>
        </Section>

        {/* 11. Contact */}
        <Section icon={Mail} title={t.terms_page.section11_title}>
          <p>{t.terms_page.section11_text}</p>
          <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-2">
            <p className="font-bold text-slate-700 dark:text-slate-300">{COMPANY_NAME}</p>
            <p>Bangui, République Centrafricaine</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 text-[var(--accent)] hover:underline font-medium">
              <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
            </a>
          </div>
        </Section>

      </div>

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          {t.terms_page.footer_text}{' '}
          <strong>{SITE_URL}</strong>{' '}
          {t.terms_page.footer_suffix}{' '}{LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
