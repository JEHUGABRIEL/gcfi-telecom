import type { Metadata } from 'next';
import { Providers } from './providers';
import '../index.css';

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
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
