import type { Metadata } from 'next';
import TrainingModule from '@/modules/training/components/TrainingModule';
import { buildPageMetadata } from '@/shared/lib/seo-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Formations réseau, cybersécurité et bureautique',
  description:
    "Formations professionnelles certifiantes en administration réseau, cybersécurité et bureautique, dispensées à Bangui par GCFI Telecom.",
  path: '/formation',
  keywords: ['formation réseau Bangui', 'formation cybersécurité RCA', 'certification informatique Centrafrique', 'centre de formation Bangui'],
});

export default function FormationPage() {
  return <TrainingModule />;
}
