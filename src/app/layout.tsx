import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
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
  metadataBase: new URL('https://www.gcfi-rca.com'),
  openGraph: {
    siteName: 'GCFI Telecom',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
