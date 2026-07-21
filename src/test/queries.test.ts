import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Les vi.mock sont hoisted automatiquement par vitest avant les imports
const mockEq  = vi.fn().mockReturnThis();
const mockOrder = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

import { useProducts } from '@/shared/lib/queries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useProducts', () => {
  // Sauvegarde du lang localStorage pour le restaurer après les tests
  const savedLang = localStorage.getItem('gcfi-lang');

  afterEach(() => {
    vi.clearAllMocks();
    if (savedLang !== null) {
      localStorage.setItem('gcfi-lang', savedLang);
    } else {
      localStorage.removeItem('gcfi-lang');
    }
  });

  it("n'ajoute PAS de filtre .eq() dans la requête — FR", async () => {
    const products = [
      { id: '1', name: 'Routeur', price: 50000, category: 'Réseau', image: '', description: '', lang: 'fr' },
      { id: '2', name: 'Routeur', price: 50000, category: 'Réseau', image: '', description: '', lang: 'en' },
      { id: '3', name: 'Switch',  price: 30000, category: 'Réseau', image: '', description: '', lang: 'fr' },
    ];

    mockSelect.mockReturnValue({
      order: mockOrder.mockReturnValue(Promise.resolve({ data: products, error: null })),
    });

    localStorage.setItem('gcfi-lang', 'fr');

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Vérification clé : .eq() n'a jamais été appelé
    expect(mockEq).not.toHaveBeenCalled();
    // Tous les produits (FR + EN) sont retournés
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data).toEqual(products);
  });

  it("retourne les produits sans filtre langue, même quand lang='en'", async () => {
    const products = [
      { id: '1', name: 'Routeur', price: 50000, category: 'Réseau', image: '', description: '' },
      { id: '2', name: 'Switch',  price: 30000, category: 'Réseau', image: '', description: '' },
    ];

    mockSelect.mockReturnValue({
      order: mockOrder.mockReturnValue(Promise.resolve({ data: products, error: null })),
    });

    localStorage.setItem('gcfi-lang', 'en');

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockEq).not.toHaveBeenCalled();
    expect(result.current.data).toHaveLength(2);
  });

  it("propage les erreurs Supabase", async () => {
    mockSelect.mockReturnValue({
      order: mockOrder.mockReturnValue(
        Promise.resolve({ data: null, error: { message: 'Erreur réseau', code: 'NETWORK' } })
      ),
    });

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
    expect(mockEq).not.toHaveBeenCalled();
  });
});
