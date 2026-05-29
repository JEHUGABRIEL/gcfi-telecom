import type { Metadata } from 'next';
import TermsPage from '@/modules/legal/TermsPage';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation du site GCFI Telecom.",
  robots: { index: true, follow: true },
};

export default function TermsRoute() {
  return <TermsPage />;
}
