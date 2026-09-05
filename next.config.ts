import type { NextConfig } from 'next';

const csp = [
  "default-src 'self'",
  // Empêche l'injection de plugins (<object>, <embed>, <applet>)
  "object-src 'none'",
  // Empêche les attaques via balise <base>
  "base-uri 'self'",
  // Scripts : Next.js, inline (theme/consent), Google Analytics
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
  // Styles : Tailwind injecte des styles en ligne
  "style-src 'self' 'unsafe-inline'",
  // Images : CDN et fournisseurs utilisés
  // Images : CDN et fournisseurs utilisés (inclut domaine Supabase personnalisé)
  "img-src 'self' data: blob: https://*.supabase.co https://auth.gcfi-rca.com https://res.cloudinary.com https://images.unsplash.com https://i.pravatar.cc https://upload.wikimedia.org https://picsum.photos https://ui-avatars.com https://lh3.googleusercontent.com https://www.google.com",
  // Polices : Google Fonts (Inter)
  "font-src 'self' https://fonts.gstatic.com data:",
  // Connexions API : Supabase (dont domaine personnalisé), Analytics, Cloudinary
  // NB : api.cloudinary.com = endpoint d'upload (POST XHR) ; res.cloudinary.com = CDN de lecture.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://auth.gcfi-rca.com wss://auth.gcfi-rca.com https://www.googletagmanager.com https://www.google-analytics.com https://res.cloudinary.com https://api.cloudinary.com",
  // Cadres : Google OAuth
  "frame-src 'self' https://accounts.google.com",
  // Soumissions de formulaires
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
  images: {
    // Custom loader: Cloudinary images use native CDN transformations,
    // avoiding Next.js server-side proxy and its timeout issues.
    loader: 'custom',
    loaderFile: './src/shared/lib/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'auth.gcfi-rca.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
};

export default nextConfig;
