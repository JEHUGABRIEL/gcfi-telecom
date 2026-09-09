import { describe, it, expect } from 'vitest';
import {
  organizationSchema,
  productSchema,
  courseSchema,
  articleSchema,
  breadcrumbSchema,
  localBusinessSchema,
} from '@/shared/lib/structured-data';
import { SITE_URL } from '@/shared/lib/site-url';

describe('organizationSchema', () => {
  it('a la structure correcte', () => {
    expect(organizationSchema['@context']).toBe('https://schema.org');
    expect(organizationSchema['@type']).toBe('Organization');
    expect(organizationSchema.name).toBe('GCFI Telecom');
    expect(organizationSchema.url).toBe(SITE_URL);
    expect(organizationSchema.contactPoint).toBeDefined();
    expect(organizationSchema.contactPoint.contactType).toBe('Customer Support');
    expect(organizationSchema.address.addressCountry).toBe('CF');
  });

  it('contient les réseaux sociaux', () => {
    expect(organizationSchema.sameAs).toContain('https://www.facebook.com/gcfitelecom');
    expect(organizationSchema.sameAs).toContain('https://www.linkedin.com/company/gcfi-telecom');
  });
});

describe('productSchema', () => {
  const product = {
    id: 'prod-1',
    name: 'Routeur Mikrotik',
    description: 'Routeur professionnel',
    image: 'https://example.com/router.jpg',
    price: 85000,
    category: 'Réseau',
  };

  it('génère un schema Product valide', () => {
    const schema = productSchema(product);
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('Routeur Mikrotik');
    // Le prix vit dans `offers` : schema.org ne l'admet pas sur Product.
    expect(schema.offers['@type']).toBe('Offer');
    expect(schema.offers.price).toBe(85000);
    expect(schema.offers.priceCurrency).toBe('XAF');
    expect(schema.offers.availability).toBe('https://schema.org/InStock');
  });

  it('génère une URL produit correcte', () => {
    const schema = productSchema(product);
    expect(schema.url).toBe(`${SITE_URL}/boutique/prod-1`);
  });
});

describe('courseSchema', () => {
  const course = {
    id: 'course-1',
    title: 'Cybersécurité Avancée',
    description: 'Formation complète',
    image: 'https://example.com/course.jpg',
    price: 150000,
    category: 'Sécurité',
    duration: '3 mois',
  };

  it('génère un schema Course valide', () => {
    const schema = courseSchema(course);
    expect(schema['@type']).toBe('Course');
    expect(schema.name).toBe('Cybersécurité Avancée');
    expect(schema.description).toBe('Formation complète');
    expect(schema.offers['@type']).toBe('Offer');
    expect(schema.offers.price).toBe(150000);
    expect(schema.offers.priceCurrency).toBe('XAF');
    expect(schema.category).toBe('Sécurité');
  });

  it('inclut le provider GCFI', () => {
    const schema = courseSchema(course);
    expect(schema.provider['@type']).toBe('Organization');
    expect(schema.provider.name).toBe('GCFI Telecom');
  });

  it('génère une URL formation correcte', () => {
    const schema = courseSchema(course);
    expect(schema.url).toBe(`${SITE_URL}/formation/course-1`);
  });
});

describe('localBusinessSchema', () => {
  it('a la structure correcte', () => {
    expect(localBusinessSchema['@type']).toBe('LocalBusiness');
    expect(localBusinessSchema.name).toBe('GCFI Telecom');
    expect(localBusinessSchema.telephone).toBe('+236-72-72-72-08');
    expect(localBusinessSchema.email).toBe('contact@gcfi-rca.com');
  });

  it('définit les horaires d\'ouverture', () => {
    expect(localBusinessSchema.openingHoursSpecification.dayOfWeek).toContain('Monday');
    expect(localBusinessSchema.openingHoursSpecification.dayOfWeek).toContain('Friday');
    expect(localBusinessSchema.openingHoursSpecification.opens).toBe('08:00');
    expect(localBusinessSchema.openingHoursSpecification.closes).toBe('18:00');
  });
});

describe('breadcrumbSchema', () => {
  it('numérote les étapes à partir de 1 et résout les URLs', () => {
    const schema = breadcrumbSchema([
      { name: 'Accueil', path: '/' },
      { name: 'Boutique', path: '/boutique' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].item).toBe(`${SITE_URL}/boutique`);
  });
});

describe('articleSchema', () => {
  const post = {
    id: 'post-1',
    title: 'Sécuriser son réseau',
    excerpt: 'Les bases',
    content: '<p>Contenu</p>',
    image: 'https://example.com/post.jpg',
    category: 'Sécurité',
    tags: ['réseau', 'sécurité'],
    author: 'Jean',
    published: true,
    created_at: '2026-01-15T10:00:00Z',
  };

  it('génère un BlogPosting complet', () => {
    const schema = articleSchema(post);
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Sécuriser son réseau');
    expect(schema.author.name).toBe('Jean');
    expect(schema.datePublished).toBe('2026-01-15T10:00:00Z');
    expect(schema.mainEntityOfPage).toBe(`${SITE_URL}/blog/post-1`);
    expect(schema.keywords).toBe('réseau, sécurité');
  });

  it('retombe sur le logo quand l\'article n\'a pas d\'image', () => {
    const schema = articleSchema({ ...post, image: null });
    expect(schema.image).toBe(`${SITE_URL}/logo.png`);
  });
});
