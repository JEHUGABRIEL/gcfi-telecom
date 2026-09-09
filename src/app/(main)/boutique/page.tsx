import type { Metadata } from 'next';
import StoreModule from '@/modules/store/components/StoreModule';
import { buildPageMetadata } from '@/shared/lib/seo-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Boutique — Équipements réseau et télécom',
  description:
    "Routeurs, switchs, antennes et matériel réseau professionnel disponibles à Bangui. Livraison en République Centrafricaine.",
  path: '/boutique',
  keywords: ['boutique informatique Bangui', 'routeur Mikrotik RCA', 'équipement réseau Centrafrique', 'matériel télécom Bangui'],
});

export default function BoutiquePage() {
  return <StoreModule />;
}
