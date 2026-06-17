import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import GcfiLogo from './GcfiLogo';

export default function Footer() {
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
              "Un groupe proche de votre entreprise !!!"
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-8">
              GAVEAUX - CHRISTIAN - FIRME - INFORMATIQUE. Votre partenaire pour le développement technologique.
            </p>
            <div className="flex space-x-4">
              {/* Liens sociaux — remplacer # par les vraies URLs */}
              {[
                { href: 'https://facebook.com', label: 'Facebook', svg: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                { href: 'https://twitter.com',  label: 'Twitter', svg: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                { href: 'https://linkedin.com', label: 'LinkedIn', svg: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                { href: 'https://instagram.com',label: 'Instagram', svg: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
              ].map(({ href, label, svg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={svg} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Nos Services</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><Link href="/formation" className="hover:text-[var(--accent)] transition-colors">Formations Télécom</Link></li>
              <li><Link href="/boutique" className="hover:text-[var(--accent)] transition-colors">Boutique Équipements</Link></li>
              <li><a href="mailto:gcfitelecom@gmail.com" className="hover:text-[var(--accent)] transition-colors">Expertise & Devis</a></li>
              <li><Link href="/" className="hover:text-[var(--accent)] transition-colors">Réseaux LAN/WAN</Link></li>
            </ul>
          </div>

          {/* Liens utiles — ✅ Link react-router au lieu de a href="#" */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Liens Utiles</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><Link href="/" className="hover:text-[var(--accent)] transition-colors">À propos de nous</Link></li>
              <li><Link href="/" className="hover:text-[var(--accent)] transition-colors">Actualités</Link></li>
              <li><Link href="/boutique" className="hover:text-[var(--accent)] transition-colors">Boutique</Link></li>
              <li><Link href="/formation" className="hover:text-[var(--accent)] transition-colors">Nos Formations</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Contact</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-[var(--accent)] shrink-0" />
                <span>Rue du Marché Lakouanga (RCA)</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-[var(--accent)] shrink-0" />
                <div>
                  <p>+236 72 72 72 08</p>
                  <p>+236 75 50 03 24</p>
                </div>
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
          <p>© {new Date().getFullYear()} GCFI Centrafrique. Tous droits réservés.</p>
          <div className="flex space-x-6">
            <Link href="/confidentialite" className="hover:text-slate-900 dark:hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/confidentialite#5-cookies-et-technologies-similaires" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</Link>
            <Link href="/conditions" className="hover:text-slate-900 dark:hover:text-white transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
