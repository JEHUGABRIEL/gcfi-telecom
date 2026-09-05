import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import { SITE_URL } from '@/shared/lib/site-url';
import CookieConsentBanner from '@/shared/components/CookieConsentBanner';
import AnalyticsTracker from '@/shared/components/AnalyticsTracker';
// @ts-ignore: allow importing global CSS without type declarations
import '../index.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'GCFI Telecom — Formation & Équipements IT en RCA',
    template: '%s | GCFI Telecom',
  },
  description: 'Leader en télécommunication, formation IT et équipements réseau en République Centrafricaine.',
  keywords: ['télécom', 'formation', 'cybersécurité', 'réseau', 'RCA', 'Bangui', 'GCFI'],
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    siteName: 'GCFI Telecom',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? '';
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {/* Thème (clair/sombre) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        {/* Consentement cookies — Google Consent Mode v2 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}var c=function(){try{return localStorage.getItem('gcfi-consent')}catch(e){return null}}();gtag('consent','default',{'analytics_storage':c==='granted'?'granted':'denied','ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied'});`,
          }}
        />
      </head>
      <body className={inter.className}>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Providers>
          {children}
          <AnalyticsTracker />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}