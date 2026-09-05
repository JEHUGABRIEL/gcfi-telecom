'use client';

import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import GcfiLogo from './GcfiLogo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLang } from '@/shared/context/LanguageContext';
import { useContact } from '@/shared/context/ContactContext';
import { trackPhoneClick, trackSocialClick } from '@/shared/lib/ga-events';

/* ── Icônes SVG officielles des réseaux sociaux ──────────────── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.255h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
);

const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: 'https://www.facebook.com/share/1EUN5LxJmK/?mibextid=wwXIfr', label: 'Facebook' },
  { Icon: XIcon,        href: 'https://twitter.com',                                          label: 'X' },
  { Icon: LinkedinIcon, href: 'https://linkedin.com',                                         label: 'LinkedIn' },
  { Icon: TikTokIcon,   href: 'https://www.tiktok.com/@gcfi_telecom',                         label: 'TikTok' },
];

export default function Footer() {
  const { t } = useLang();
  const { openContact } = useContact();
  return (
    <footer className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white pt-20 pb-10 transition-colors border-t border-slate-100 dark:border-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div>
            <div className="flex items-center mb-6">
              <GcfiLogo />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 italic">
              {t.footer.tagline}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-8">
              {t.footer.description}
            </p>
            <div className="flex space-x-4">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  onClick={() => trackSocialClick(label)}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">{t.footer.services_title}</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><Link href="/formation" className="hover:text-[var(--accent)] transition-colors">{t.footer.service_formation}</Link></li>
              <li><Link href="/boutique" className="hover:text-[var(--accent)] transition-colors">{t.footer.service_boutique}</Link></li>
              <li><button onClick={openContact} className="hover:text-[var(--accent)] transition-colors">{t.footer.service_devis}</button></li>
              <li><Link href="/services" className="hover:text-[var(--accent)] transition-colors">{t.footer.service_reseau}</Link></li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">{t.footer.links_title}</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><button onClick={openContact} className="hover:text-[var(--accent)] transition-colors">{t.footer.link_contact}</button></li>
              <li><Link href="/blog" className="hover:text-[var(--accent)] transition-colors">{t.footer.link_blog}</Link></li>
              <li><Link href="/boutique" className="hover:text-[var(--accent)] transition-colors">{t.footer.link_shop}</Link></li>
              <li><Link href="/formation" className="hover:text-[var(--accent)] transition-colors">{t.footer.link_trainings}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">{t.footer.contact_title}</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-[var(--accent)] shrink-0" />
                <span>{t.footer.address}</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-[var(--accent)] shrink-0" />
                <a href="tel:+23672727208" onClick={() => trackPhoneClick('footer')}
                  className="block hover:text-[var(--accent)] transition-colors">+236 72 72 72 08</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-[var(--accent)] shrink-0" />
                <a href="mailto:gcfitelecom@gmail.com" className="hover:text-[var(--accent)] transition-colors">
                  gcfitelecom@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} {t.footer.copyright} {t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link href="/confidentialite" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t.footer.privacy}</Link>
            <Link href="/confidentialite#5-cookies-et-technologies-similaires" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t.footer.cookies}</Link>
            <Link href="/conditions" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}