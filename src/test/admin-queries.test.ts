import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Les variables mock doivent être créées AVANT vi.mock via vi.hoisted()
const { mockFrom, mockSelect, mockOrder } = vi.hoisted(() => {
  const mOrder = vi.fn();
  const mSelect = vi.fn();
  const mFrom = vi.fn();
  return { mockFrom: mFrom, mockSelect: mSelect, mockOrder: mOrder };
});

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Imports après les mocks (hoisted automatiquement par vitest)
import {
  useAdminProducts,
  useAdminTrainings,
  useAdminOrders,
  useAdminUsers,
} from '@/shared/lib/queries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makeProduct(i: number) {
  return {
    id: `prod-${i}`,
    name: `Produit ${i}`,
    price: 10000 * i,
    category: i % 2 === 0 ? 'Réseau' : 'Sécurité',
    image: `https://example.com/img${i}.jpg`,
    description: `Description du produit ${i}`,
    stock: 10 + i,
    lang: 'fr',
    created_at: `2026-0${(i % 9) + 1}-15`,
  };
}

function makeTraining(i: number) {
  return {
    id: `train-${i}`,
    title: `Formation ${i}`,
    description: `Description formation ${i}`,
    level: i % 3 === 0 ? 'Débutant' : i % 3 === 1 ? 'Intermédiaire' : 'Avancé',
    price: 25000 * i,
    lang: 'fr',
    created_at: `2026-0${(i % 9) + 1}-10`,
  };
}

describe('Admin queries — après déduplication DB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  /* ── useAdminProducts ─────────────────────────────────────── */

  describe('useAdminProducts', () => {
    it('retourne 27 produits (FR uniquement) comme après le nettoyage', async () => {
      const products = Array.from({ length: 27 }, (_, i) => makeProduct(i + 1));

      mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue(Promise.resolve({ data: products, error: null })),
      });

      const { result } = renderHook(() => useAdminProducts(true), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(27);
      // Aucun produit EN ne remonte
      expect(result.current.data!.every((p: any) => p.lang !== 'en')).toBe(true);
    });

    it("n'ajoute PAS de filtre .eq('lang', ...) dans la requête", async () => {
      const products = Array.from({ length: 15 }, (_, i) => makeProduct(i + 1));

      mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue(Promise.resolve({ data: products, error: null })),
      });

      const { result } = renderHook(() => useAdminProducts(true), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Vérifier que la requête cible la bonne table
      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith('*');
      // Pas de filtre lang — tous les produits sont retournés
      expect(result.current.data).toHaveLength(15);
    });
  });

  /* ── useAdminTrainings ────────────────────────────────────── */

  describe('useAdminTrainings', () => {
    it('retourne 10 formations (FR uniquement) comme après le nettoyage', async () => {
      const trainings = Array.from({ length: 10 }, (_, i) => makeTraining(i + 1));

      mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue(Promise.resolve({ data: trainings, error: null })),
      });

      const { result } = renderHook(() => useAdminTrainings(true), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(10);
      expect(result.current.data!.every((t: any) => t.lang !== 'en')).toBe(true);
    });

    it('retourne un tableau vide si pas de formations', async () => {
      mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null })),
      });

      const { result } = renderHook(() => useAdminTrainings(true), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  /* ── Tableaux administratifs sans doublons ────────────────── */

  describe('Admin stats — cohérence après déduplication', () => {
    it('les comptes admin correspondent aux données FR uniquement', async () => {
      const products   = Array.from({ length: 27 }, (_, i) => makeProduct(i + 1));
      const trainings  = Array.from({ length: 10 }, (_, i) => makeTraining(i + 1));
      const users      = Array.from({ length: 8 }, (_, i) => ({ id: `user-${i}`, email: `user${i}@test.com` }));
      const orders     = Array.from({ length: 15 }, (_, i) => ({
        id: `order-${i}`,
        status: i < 5 ? 'completed' : 'En préparation',
        total: 50000,
        created_at: new Date().toISOString(),
      }));

      // Hook 1 : produits
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValueOnce(Promise.resolve({ data: products, error: null })),
      });
      // Hook 2 : formations
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValueOnce(Promise.resolve({ data: trainings, error: null })),
      });
      // Hook 3 : utilisateurs
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValueOnce(Promise.resolve({ data: users, error: null })),
      });
      // Hook 4 : commandes
      mockSelect.mockReturnValueOnce({
        order: mockOrder.mockReturnValueOnce(Promise.resolve({ data: orders, error: null })),
      });

      // Tester les 4 hooks admin avec leur propre QueryClient
      const { result: prodRes } = renderHook(() => useAdminProducts(true), { wrapper: createWrapper() });
      const { result: trainRes } = renderHook(() => useAdminTrainings(true), { wrapper: createWrapper() });
      const { result: usersRes } = renderHook(() => useAdminUsers(true), { wrapper: createWrapper() });
      const { result: ordersRes } = renderHook(() => useAdminOrders(true), { wrapper: createWrapper() });

      await waitFor(() => expect(prodRes.current.isSuccess).toBe(true));
      await waitFor(() => expect(trainRes.current.isSuccess).toBe(true));
      await waitFor(() => expect(usersRes.current.isSuccess).toBe(true));
      await waitFor(() => expect(ordersRes.current.isSuccess).toBe(true));

      // Vérifications : les comptes correspondent aux données FR uniquement
      expect(prodRes.current.data).toHaveLength(27);
      expect(trainRes.current.data).toHaveLength(10);
      expect(usersRes.current.data).toHaveLength(8);
      expect(ordersRes.current.data).toHaveLength(15);

      // Aucun enregistrement avec lang='en' dans les retours admin
      const allData: any[] = [
        ...(prodRes.current.data ?? []),
        ...(trainRes.current.data ?? []),
        ...(usersRes.current.data ?? []),
        ...(ordersRes.current.data ?? []),
      ];
      expect(allData.every((d: any) => d.lang !== 'en')).toBe(true);
    });
  });
});
