// ================================================================
// GCFI — Hooks TanStack Query centralisés
// Cache intelligent : données servies instantanément après 1er chargement
// ================================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Product, CartItem } from '@/shared/types';

// ── Clés de cache ──────────────────────────────────────────────
export const QUERY_KEYS = {
  products:     ['products'] as const,
  trainings:    ['trainings'] as const,
  news:         ['news'] as const,
  cart:         (userId: string) => ['cart', userId] as const,
  profile:      (userId: string) => ['profile', userId] as const,
  orders:       (userId: string) => ['orders', userId] as const,
  testimonials: ['testimonials'] as const,
  achievements: ['achievements'] as const,
  partners:     ['partners'] as const,
};

// ── Produits ───────────────────────────────────────────────────
export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('popularity', { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Formations ─────────────────────────────────────────────────
export function useTrainings() {
  return useQuery({
    queryKey: QUERY_KEYS.trainings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Actualités ─────────────────────────────────────────────────
export function useNews() {
  return useQuery({
    queryKey: QUERY_KEYS.news,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Panier (utilisateur connecté) ──────────────────────────────
export function useCart(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? QUERY_KEYS.cart(userId) : ['cart-anonymous'],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', userId)
        .single();
      return (data?.items || []) as CartItem[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Mutation panier ────────────────────────────────────────────
export function useSaveCart(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: CartItem[]) => {
      if (!userId) return;
      await supabase.from('carts').upsert(
        { user_id: userId, items, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    },
    onSuccess: (_, items) => {
      if (userId) queryClient.setQueryData(QUERY_KEYS.cart(userId), items);
    },
  });
}

// ── Témoignages ────────────────────────────────────────────────
export function useTestimonials() {
  return useQuery({
    queryKey: QUERY_KEYS.testimonials,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Réalisations ───────────────────────────────────────────────
export function useAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('year', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Partenaires ────────────────────────────────────────────────
export function usePartners() {
  return useQuery({
    queryKey: QUERY_KEYS.partners,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Commandes utilisateur ──────────────────────────────────────
export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? QUERY_KEYS.orders(userId) : ['orders-anonymous'],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
