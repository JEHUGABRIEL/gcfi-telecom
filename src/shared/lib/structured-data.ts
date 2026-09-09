import type { Product, Course, Achievement } from '@/shared/types';
import type { BlogPost } from '@/modules/blog/services/blog.service';
import { SITE_URL, siteUrl } from '@/shared/lib/site-url';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GCFI Telecom',
  url: SITE_URL,
  logo: siteUrl('/logo.png'),
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

// Le prix appartient à un nœud `offers` : schema.org n'admet pas `price` ni
// `priceCurrency` directement sur Product/Course, et Google rejette
// silencieusement les fiches qui les y placent.
const offer = (price: number, url: string) => ({
  '@type': 'Offer',
  price,
  priceCurrency: 'XAF',
  availability: 'https://schema.org/InStock',
  url,
});

export const productSchema = (product: Product) => {
  const url = siteUrl(`/boutique/${product.id}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    category: product.category,
    url,
    offers: offer(product.price, url),
    ...(product.rating && product.reviews_count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews_count,
          },
        }
      : {}),
  };
};

export const courseSchema = (course: Course) => {
  const url = siteUrl(`/formation/${course.id}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    image: course.image,
    provider: {
      '@type': 'Organization',
      name: 'GCFI Telecom',
      url: SITE_URL,
    },
    url,
    category: course.category,
    offers: offer(course.price, url),
    // Google exige au moins une instance de cours pour la rich card Course.
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      courseWorkload: course.duration,
      location: {
        '@type': 'Place',
        name: 'GCFI Telecom',
        address: { '@type': 'PostalAddress', streetAddress: 'Bangui', addressCountry: 'CF' },
      },
    },
  };
};

export const articleSchema = (post: BlogPost) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: post.image ?? siteUrl('/logo.png'),
  datePublished: post.created_at,
  dateModified: post.created_at,
  author: { '@type': 'Person', name: post.author || 'GCFI Telecom' },
  publisher: {
    '@type': 'Organization',
    name: 'GCFI Telecom',
    logo: { '@type': 'ImageObject', url: siteUrl('/logo.png') },
  },
  mainEntityOfPage: siteUrl(`/blog/${post.id}`),
  ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
});

export const achievementSchema = (achievement: Achievement) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: achievement.title,
  description: achievement.description,
  image: achievement.image,
  dateCreated: achievement.year,
  creator: { '@type': 'Organization', name: 'GCFI Telecom', url: SITE_URL },
  url: siteUrl(`/realisations/${achievement.id}`),
});

/** Fil d'Ariane — aide Google à afficher le chemin plutôt que l'URL brute. */
export const breadcrumbSchema = (trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((step, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: step.name,
    item: siteUrl(step.path),
  })),
});

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'GCFI Telecom',
  image: siteUrl('/logo.png'),
  description: 'Télécommunication et formation IT',
  url: SITE_URL,
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
