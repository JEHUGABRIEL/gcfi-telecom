'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const CONSENT_KEY = 'gcfi-consent';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

function trackPage(pathname: string) {
  if (!GA_ID) return;

  const search = window.location.search;
  const fullPath = pathname + (search || '');

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent !== 'granted') return;

  window.gtag?.('config', GA_ID, {
    page_path: fullPath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const prevPath = useRef('');

  // Tracker au changement de route
  useEffect(() => {
    if (!GA_ID) return;

    const search = window.location.search;
    const fullPath = pathname + (search || '');
    if (fullPath === prevPath.current) return;
    prevPath.current = fullPath;

    trackPage(pathname);
  }, [pathname]);

  // Tracker la page courante quand le consentement est donné après coup
  useEffect(() => {
    const handler = () => {
      prevPath.current = ''; // Réinitialise pour forcer le tracking
      trackPage(pathname);
    };
    window.addEventListener('consent-granted', handler);
    return () => window.removeEventListener('consent-granted', handler);
  }, [pathname]);

  return null;
}
