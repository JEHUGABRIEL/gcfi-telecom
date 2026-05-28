export function setStructuredData(data: Record<string, any>) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GCFI Telecom',
  url: 'https://www.gcfi-rca.com',
  logo: 'https://www.gcfi-rca.com/logo.png',
  description: 'Leader en télécommunication et formation IT en République Centrafricaine',
  sameAs: [
    'https://www.facebook.com/gcfitelecom',
    'https://www.linkedin.com/company/gcfi-telecom',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    telephone: '+236-72-72-72-08',
    email: 'contact@gcfi-rca.com',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bangui',
    addressCountry: 'CF',
  },
};

export const productSchema = (product: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image,
  price: product.price,
  priceCurrency: 'XAF',
  availability: 'https://schema.org/InStock',
  url: `https://www.gcfi-rca.com/#/boutique/${product.id}`,
});

export const courseSchema = (course: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.title,
  description: course.description,
  image: course.image,
  provider: {
    '@type': 'Organization',
    name: 'GCFI Telecom',
  },
  url: `https://www.gcfi-rca.com/#/formation/${course.id}`,
  price: course.price,
  priceCurrency: 'XAF',
  category: course.category,
});

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'GCFI Telecom',
  image: 'https://www.gcfi-rca.com/logo.png',
  description: 'Télécommunication et formation IT',
  url: 'https://www.gcfi-rca.com',
  telephone: '+236-72-72-72-08',
  email: 'contact@gcfi-rca.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bangui',
    addressCountry: 'CF',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '18:00',
  },
  sameAs: ['https://www.facebook.com/gcfitelecom'],
};