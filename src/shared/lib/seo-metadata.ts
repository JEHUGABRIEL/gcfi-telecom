import type { Metadata } from 'next';
import { siteUrl } from '@/shared/lib/site-url';

/** Image de partage par défaut, utilisée quand l'entité n'en a pas. */
export const DEFAULT_OG_IMAGE = siteUrl('/logo.png');

/**
 * Ramène un texte libre (souvent du HTML issu de l'admin) à une méta
 * description propre : balises retirées, espaces normalisés, coupée sur un
 * mot entier autour de 155 caractères — au-delà Google tronque.
 */
export function toDescription(raw: string | null | undefined, fallback: string): string {
  const text = (raw ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  if (text.length <= 155) return text;
  const cut = text.slice(0, 155);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string;
  keywords?: string[];
}

/**
 * Construit un bloc Metadata complet — canonical, Open Graph et Twitter Card.
 * Sans canonical, les mêmes fiches atteignables via plusieurs URLs se font
 * concurrence entre elles dans l'index.
 */
export function buildPageMetadata({
  title, description, path, image, type = 'website', publishedTime, keywords,
}: PageSeoInput): Metadata {
  const url = siteUrl(path);
  const ogImage = image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type,
      images: [{ url: ogImage, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Metadata d'une page de détail dont l'enregistrement est introuvable. */
export const NOT_FOUND_METADATA: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true },
};
