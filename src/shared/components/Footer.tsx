import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
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
                { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
                { Icon: Twitter,  href: 'https://twitter.com',  label: 'Twitter' },
                { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { Icon: Instagram,href: 'https://instagram.com',label: 'Instagram' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Nos Services</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><Link to="/formation" className="hover:text-[var(--accent)] transition-colors">Formations Télécom</Link></li>
              <li><Link to="/boutique" className="hover:text-[var(--accent)] transition-colors">Boutique Équipements</Link></li>
              <li><a href="mailto:gcfitelecom@gmail.com" className="hover:text-[var(--accent)] transition-colors">Expertise & Devis</a></li>
              <li><Link to="/" className="hover:text-[var(--accent)] transition-colors">Réseaux LAN/WAN</Link></li>
            </ul>
          </div>

          {/* Liens utiles — ✅ Link react-router au lieu de a href="#" */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Liens Utiles</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
              <li><Link to="/" className="hover:text-[var(--accent)] transition-colors">À propos de nous</Link></li>
              <li><Link to="/" className="hover:text-[var(--accent)] transition-colors">Actualités</Link></li>
              <li><Link to="/boutique" className="hover:text-[var(--accent)] transition-colors">Boutique</Link></li>
              <li><Link to="/formation" className="hover:text-[var(--accent)] transition-colors">Nos Formations</Link></li>
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
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</Link>
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
