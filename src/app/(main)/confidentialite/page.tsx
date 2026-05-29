import type { Metadata } from 'next';
import PrivacyPage from '@/modules/legal/PrivacyPage';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Politique de confidentialité et de protection des données personnelles de GCFI Telecom.',
  robots: { index: true, follow: true },
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
