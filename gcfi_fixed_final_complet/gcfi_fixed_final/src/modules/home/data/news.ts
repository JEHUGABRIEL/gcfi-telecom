// ================================================================
// GCFI — Données mock pour le fil d'actualités
// À remplacer par une vraie table Supabase (priorité 3)
// ================================================================

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'telecom' | 'it';
  image: string;
  source: string;
  date: string;
  url: string;
}

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Orange RCA déploie la 4G dans 5 nouvelles villes centrafricaines',
    excerpt: 'Le groupe Orange accélère son déploiement réseau en RCA avec la couverture 4G de Berbérati, Bambari, Bossangoa, Bouar et Kaga-Bandoro.',
    category: 'telecom',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
    source: 'Agence Centrafrique Presse',
    date: '18 Avril 2025',
    url: '#',
  }
  {
    id: '3',
    title: 'Cybersécurité : l\'Afrique centrale face à la montée des cyberattaques',
    excerpt: 'Un rapport de l\'UA révèle une hausse de 47% des incidents cyber en Afrique centrale. La formation de spécialistes locaux devient une priorité nationale.',
    category: 'it',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    source: 'IT News Africa',
    date: '12 Avril 2025',
    url: '#',
  },
];
