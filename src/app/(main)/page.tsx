import type { Metadata } from 'next';
import HomeView from '@/HomeView';
import { buildPageMetadata } from '@/shared/lib/seo-metadata';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'GCFI Telecom — Formation IT & Équipements Réseau à Bangui',
    description:
      "Formations certifiantes en réseau et cybersécurité, vente d'équipements télécom et ingénierie réseau à Bangui, République Centrafricaine.",
    path: '/',
    keywords: ['GCFI Telecom', 'formation informatique Bangui', 'équipement réseau RCA', 'cybersécurité Centrafrique', 'télécommunication Bangui'],
  }),
  // Le template '%s | GCFI Telecom' du layout ne doit pas s'appliquer ici :
  // la home porte déjà le nom de marque dans son titre.
  title: { absolute: 'GCFI Telecom — Formation IT & Équipements Réseau à Bangui' },
};

export default function HomePage() {
  return <HomeView />;
}
