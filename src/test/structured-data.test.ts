import { describe, it, expect } from 'vitest';
import {
  organizationSchema,
  productSchema,
  courseSchema,
  localBusinessSchema,
} from '@/shared/lib/structured-data';

describe('organizationSchema', () => {
  it('a la structure correcte', () => {
    expect(organizationSchema['@context']).toBe('https://schema.org');
    expect(organizationSchema['@type']).toBe('Organization');
    expect(organizationSchema.name).toBe('GCFI Telecom');
    expect(organizationSchema.url).toBe('https://www.gcfi-rca.com');
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
    expect(schema.price).toBe(85000);
    expect(schema.priceCurrency).toBe('XAF');
    expect(schema.availability).toBe('https://schema.org/InStock');
  });

  it('génère une URL produit correcte', () => {
    const schema = productSchema(product);
    expect(schema.url).toContain('/boutique/prod-1');
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
    expect(schema.price).toBe(150000);
    expect(schema.priceCurrency).toBe('XAF');
    expect(schema.category).toBe('Sécurité');
  });

  it('inclut le provider GCFI', () => {
    const schema = courseSchema(course);
    expect(schema.provider['@type']).toBe('Organization');
    expect(schema.provider.name).toBe('GCFI Telecom');
  });

  it('génère une URL formation correcte', () => {
    const schema = courseSchema(course);
    expect(schema.url).toContain('/formation/course-1');
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
