'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Database, Lock, Mail, Eye, Trash2, FileText, Phone } from 'lucide-react';
import { useLang } from '@/shared/context/LanguageContext';

const LAST_UPDATED = '29 mai 2025';
const CONTACT_EMAIL = 'gcfitelecom@gmail.com';
const COMPANY_NAME = 'GCFI Centrafrique';
const COMPANY_ADDRESS = 'Bangui, République Centrafricaine';

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

export default function PrivacyPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  {t.privacy_page.hero_badge}
                </p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  {t.privacy_page.hero_title}
                </h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t.privacy_page.last_update} : <strong className="text-slate-700 dark:text-slate-300">{LAST_UPDATED}</strong>
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.privacy_page.hero_paragraph.replace('{COMPANY_NAME}', COMPANY_NAME)}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">

        {/* 1. Responsable du traitement */}
        <Section icon={FileText} title={t.privacy_page.section1_title}>
          <p>{t.privacy_page.section1_controller}</p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mt-2 space-y-1">
            <p><strong className="text-slate-700 dark:text-slate-300">{COMPANY_NAME}</strong></p>
            <p>{COMPANY_ADDRESS}</p>
            <p>
              Email :{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </Section>

        {/* 2. Données collectées */}
        <Section icon={Database} title={t.privacy_page.section2_title}>
          <p>{t.privacy_page.section2_intro}</p>

          <div className="space-y-4 mt-2">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t.privacy_page.section2_account}</p>
              <ul className="space-y-1">
                {(t.privacy_page.section2_account_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t.privacy_page.section2_order}</p>
              <ul className="space-y-1">
                {(t.privacy_page.section2_order_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t.privacy_page.section2_newsletter}</p>
              <ul className="space-y-1">
                {(t.privacy_page.section2_newsletter_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t.privacy_page.section2_tech}</p>
              <ul className="space-y-1">
                {(t.privacy_page.section2_tech_items as unknown as string[]).map((item, i) => <Li key={i}>{item}</Li>)}
              </ul>
            </div>
          </div>
        </Section>

        {/* 3. Finalités */}
        <Section icon={Eye} title={t.privacy_page.section3_title}>
          <p>{t.privacy_page.section3_intro}</p>
          <ul className="space-y-2 mt-2">
            <Li><strong className="text-slate-700 dark:text-slate-300">Gestion de votre compte :</strong> {t.privacy_page.section3_item1}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Traitement des commandes :</strong> {t.privacy_page.section3_item2}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Communication :</strong> {t.privacy_page.section3_item3}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Newsletter :</strong> {t.privacy_page.section3_item4}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Sécurité :</strong> {t.privacy_page.section3_item5}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Amélioration du service :</strong> {t.privacy_page.section3_item6}</Li>
          </ul>
          <p className="mt-4 text-xs bg-[var(--accent-light)] text-[var(--accent)] rounded-2xl px-4 py-3 font-medium">
            {t.privacy_page.section3_note}
          </p>
        </Section>

        {/* 4. Stockage et sécurité */}
        <Section icon={Lock} title={t.privacy_page.section4_title}>
          <p>{t.privacy_page.section4_intro}</p>
          <ul className="space-y-2 mt-2">
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Supabase</strong>{' (database) — '}
              {t.privacy_page.section4_item1}{' '}
              {t.privacy_page.section4_label_priv}{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">supabase.com/privacy</a>
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Cloudinary</strong>{' (uploaded images) — '}
              {t.privacy_page.section4_item2}{' '}
              {t.privacy_page.section4_label_priv}{' '}
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">cloudinary.com/privacy</a>
            </Li>
            <Li>
              <strong className="text-slate-700 dark:text-slate-300">Vercel</strong>{' (site hosting) — '}
              {t.privacy_page.section4_item3}{' '}
              {t.privacy_page.section4_label_priv}{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">vercel.com/legal/privacy-policy</a>
            </Li>
          </ul>
          <p className="mt-4">{t.privacy_page.section4_passwords}</p>
          <p className="mt-2">{t.privacy_page.section4_retention}</p>
        </Section>

        {/* 5. Cookies */}
        <Section icon={Database} title={t.privacy_page.section5_title}>
          <p>{t.privacy_page.section5_intro}</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left p-3 rounded-tl-xl font-bold text-slate-700 dark:text-slate-300">{t.privacy_page.section5_table_cookie}</th>
                  <th className="text-left p-3 font-bold text-slate-700 dark:text-slate-300">{t.privacy_page.section5_table_purpose}</th>
                  <th className="text-left p-3 rounded-tr-xl font-bold text-slate-700 dark:text-slate-300">{t.privacy_page.section5_table_duration}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(t.privacy_page.section5_table_rows as unknown as {cookie:string;purpose:string;duration:string}[]).map((row, i) => (
                  <tr key={i}>
                    <td className="p-3 font-mono text-[var(--accent)]">{row.cookie}</td>
                    <td className="p-3">{row.purpose}</td>
                    <td className="p-3">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">{t.privacy_page.section5_note}</p>
        </Section>

        {/* 6. Vos droits */}
        <Section icon={Shield} title={t.privacy_page.section6_title}>
          <p>{t.privacy_page.section6_intro}</p>
          <ul className="space-y-3 mt-3">
            <Li><strong className="text-slate-700 dark:text-slate-300">Droit d'accès :</strong> {t.privacy_page.section6_item1}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Droit de rectification :</strong> {t.privacy_page.section6_item2}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Droit à l'effacement :</strong> {t.privacy_page.section6_item3}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Droit à la portabilité :</strong> {t.privacy_page.section6_item4}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Droit d'opposition :</strong> {t.privacy_page.section6_item5}</Li>
            <Li><strong className="text-slate-700 dark:text-slate-300">Désabonnement newsletter :</strong> {t.privacy_page.section6_item6}</Li>
          </ul>
          <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{t.privacy_page.section6_exercise_title}</p>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">{CONTACT_EMAIL}</a>{' '}
              {t.privacy_page.section6_exercise_text}
            </p>
          </div>
        </Section>

        {/* 7. Partage des données */}
        <Section icon={Mail} title={t.privacy_page.section7_title}>
          <p>{t.privacy_page.section7_text1}</p>
          <p>
            {t.privacy_page.section7_text2}
          </p>
          <p>{t.privacy_page.section7_text3}</p>
        </Section>

        {/* 8. Mineurs */}
        <Section icon={Shield} title={t.privacy_page.section8_title}>
          <p>{t.privacy_page.section8_text} <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">{CONTACT_EMAIL}</a>.</p>
        </Section>

        {/* 9. Modifications */}
        <Section icon={FileText} title={t.privacy_page.section9_title}>
          <p>{t.privacy_page.section9_text1}</p>
          <p>{t.privacy_page.section9_text2}</p>
        </Section>

        {/* 10. Contact */}
        <Section icon={Phone} title={t.privacy_page.section10_title}>
          <p>{t.privacy_page.section10_text}</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline font-medium">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{COMPANY_NAME} — {COMPANY_ADDRESS}</span>
            </div>
          </div>
        </Section>

      </div>

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          {t.privacy_page.footer_text}{' '}
          <strong>www.gcfi-rca.com</strong>{' '}
          {t.privacy_page.footer_suffix}{' '}{LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
