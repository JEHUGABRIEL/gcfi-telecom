import type { Metadata } from 'next';
import BlogPage from '@/modules/blog/BlogPage';
import { buildPageMetadata } from '@/shared/lib/seo-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog — Actualités télécom et numérique en Centrafrique',
  description:
    "Conseils techniques, actualités réseau et retours d'expérience de l'équipe GCFI Telecom sur le numérique en République Centrafricaine.",
  path: '/blog',
  keywords: ['blog informatique RCA', 'actualité télécom Centrafrique', 'conseils réseau Bangui'],
});

export default function BlogRoute() {
  return <BlogPage />;
}
