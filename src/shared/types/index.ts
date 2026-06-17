// ═══════════════════════════════════════════
// Types globaux partagés entre tous les modules
// ═══════════════════════════════════════════

export type AppModule = 'home' | 'training' | 'store' | 'profile' | 'admin';

export interface Product {
  id: string; name: string; price: number; category: string;
  image: string; description: string; rating?: number;
  reviewsCount?: number; reviews_count?: number; popularity?: number; stock?: number;
  discount?: number;
  is_promo?: boolean;
}

export interface CartItem extends Product { quantity: number; }

export interface Course {
  id: string; title: string; category: string; duration: string;
  price: number; description: string; image: string; tags?: string[];
  discount?: number;
  is_promo?: boolean;
}

export interface Profile {
  id: string; email: string; full_name: string | null;
  role: 'client' | 'admin' | 'superadmin'; avatar_url: string | null; created_at?: string;
}

export interface Order {
  id: string; customer_id: string; customer_email: string; total: number;
  status: 'En préparation' | 'Expédiée' | 'Livrée' | 'Annulée';
  items: CartItem[]; created_at: string;
}

// ── Entités priorité 3 ──────────────────────────────────────

export interface Testimonial {
  id: string; name: string; role: string; content: string;
  avatar_url: string | null;
  avatar?: string; // alias rétrocompat
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface Achievement {
  id: string; title: string; description: string;
  year: string; image: string; gallery?: string[]; created_at?: string;
}

export interface Partner {
  id: string; name: string; logo: string;
  website?: string; order_index?: number; created_at?: string;
}

export interface NewsItem {
  id: string; title: string; excerpt: string; content?: string;
  category: 'telecom' | 'it';
  image: string; source: string; url: string;
  published_at: string; created_at?: string;
}

export type QuoteServiceType =
  | 'Réseau LAN/WAN' | 'Fibre Optique' | 'Vidéosurveillance'
  | 'WiFi / Hotspot' | 'Starlink' | 'Cybersécurité'
  | 'Développement App' | 'Formation' | 'Autre';

export interface Quote {
  id: string; full_name: string; email: string;
  phone?: string; company?: string;
  service_type: QuoteServiceType; message: string; budget?: string;
  status: 'nouveau' | 'en_cours' | 'traité' | 'annulé';
  created_at: string;
}

