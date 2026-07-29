'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X } from 'lucide-react';
import Link from 'next/link';

/* Déclaration du type pour gtag (Google Consent Mode) */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const CONSENT_KEY = 'gcfi-consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored !== 'granted' && stored !== 'denied') {
      // Petit délai pour éviter un flash immédiat
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    // Mettre à jour le consentement Google
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
    });
    // Prévenir AnalyticsTracker pour tracker la page courante immédiatement
    window.dispatchEvent(new Event('consent-granted'));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    setVisible(false);
  };

  const handleDismiss = () => {
    // Simple fermeture sans enregistrer — la bannière réapparaîtra à la prochaine visite
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          {/* Fond de la bannière */}
          <div className="relative mx-auto max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
            {/* Barre rouge décorative en haut */}
            <div className="h-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]" />

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Icône */}
                <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] dark:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] items-center justify-center">
                  <Shield className="w-6 h-6 text-[var(--accent)]" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
                    Cookies & Vie privée
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    GCFI utilise des cookies pour analyser la navigation et améliorer votre expérience.
                    En cliquant sur «&nbsp;Accepter&nbsp;», vous consentez à l&rsquo;utilisation de Google Analytics.
                    Vous pouvez à tout moment retirer votre consentement depuis la page{' '}
                    <Link
                      href="/confidentialite"
                      className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 font-medium transition-colors"
                    >
                      Politique de confidentialité
                    </Link>
                    .
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <button
                      onClick={handleAccept}
                      className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-red-900/20 hover:shadow-lg hover:shadow-red-900/30 active:scale-[0.97]"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={handleDecline}
                      className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-transparent transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.97]"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Personnaliser plus tard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
