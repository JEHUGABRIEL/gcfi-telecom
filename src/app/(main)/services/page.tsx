import type { Metadata } from 'next';
import ServicesPage from '@/modules/services/ServicesPage';
import { buildPageMetadata } from '@/shared/lib/seo-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Services — Ingénierie réseau et infrastructure télécom',
  description:
    "Installation, audit et maintenance d'infrastructures réseau, fibre optique et systèmes de sécurité pour entreprises et institutions en Centrafrique.",
  path: '/services',
  keywords: ['ingénierie réseau Bangui', 'installation fibre optique RCA', 'maintenance informatique Centrafrique', 'vidéosurveillance Bangui'],
});

export default function ServicesRoute() {
  return <ServicesPage />;
}
