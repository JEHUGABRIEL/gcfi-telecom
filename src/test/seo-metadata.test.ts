import { describe, it, expect } from 'vitest';
import { buildPageMetadata, toDescription, DEFAULT_OG_IMAGE } from '@/shared/lib/seo-metadata';
import { SITE_URL } from '@/shared/lib/site-url';

describe('toDescription', () => {
  it('retire les balises HTML issues de l\'éditeur admin', () => {
    expect(toDescription('<p>Un <strong>routeur</strong> pro</p>', 'fallback')).toBe('Un routeur pro');
  });

  it('normalise les espaces et les entités', () => {
    expect(toDescription('Ligne&nbsp;une\n\n  Ligne deux', 'fallback')).toBe('Ligne une Ligne deux');
  });

  it('utilise le fallback quand le texte est vide ou absent', () => {
    expect(toDescription('', 'fallback')).toBe('fallback');
    expect(toDescription(null, 'fallback')).toBe('fallback');
    expect(toDescription('<p>  </p>', 'fallback')).toBe('fallback');
  });

  it('coupe sur un mot entier au-delà de 155 caractères', () => {
    const long = 'mot '.repeat(80);
    const out = toDescription(long, 'fallback');
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toContain('mo…');
  });

  it('laisse un texte court intact', () => {
    expect(toDescription('Court et net', 'fallback')).toBe('Court et net');
  });
});

describe('buildPageMetadata', () => {
  it('pose le canonical et les URLs Open Graph sur le domaine canonique', () => {
    const meta = buildPageMetadata({ title: 'T', description: 'D', path: '/boutique/42' });
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/boutique/42`);
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/boutique/42`);
  });

  it('retombe sur l\'image par défaut quand l\'entité n\'en a pas', () => {
    const meta = buildPageMetadata({ title: 'T', description: 'D', path: '/', image: null });
    expect(meta.twitter?.images).toEqual([DEFAULT_OG_IMAGE]);
  });

  it('conserve l\'image fournie et le type article', () => {
    const meta = buildPageMetadata({
      title: 'T', description: 'D', path: '/blog/1',
      image: 'https://cdn.example.com/a.jpg', type: 'article', publishedTime: '2026-01-01T00:00:00Z',
    });
    expect(meta.twitter?.images).toEqual(['https://cdn.example.com/a.jpg']);
    expect(meta.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-01-01T00:00:00Z' });
  });

  it('omet les keywords quand la liste est vide', () => {
    expect(buildPageMetadata({ title: 'T', description: 'D', path: '/', keywords: [] }).keywords).toBeUndefined();
  });
});
