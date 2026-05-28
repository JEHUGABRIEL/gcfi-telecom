import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase (vi.hoisted évite le problème de hoisting) ──
const { mockInsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockInsert  = vi.fn().mockResolvedValue({ error: null });
  const mockFrom    = vi.fn(() => ({ insert: mockInsert }));
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } });
  return { mockInsert, mockFrom, mockGetUser };
});

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}));

import { trackPageView, trackEvent, trackAddToCart, trackPurchase } from '@/shared/lib/analytics-service';

describe('analytics-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.userAgent to desktop
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64)',
      configurable: true,
    });
  });

  describe('trackPageView', () => {
    it('insère une vue de page dans analytics_page_views', async () => {
      await trackPageView('/boutique');

      expect(mockFrom).toHaveBeenCalledWith('analytics_page_views');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          page: '/boutique',
          device: 'desktop',
          user_id: 'user-123',
        }),
      ]);
    });

    it('détecte correctement les appareils mobiles', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        configurable: true,
      });

      await trackPageView('/formation');

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({ device: 'mobile' }),
      ]);
    });

    it('utilise null comme user_id si non connecté', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await trackPageView('/');

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: null }),
      ]);
    });

    it("n'échoue pas si Supabase retourne une erreur", async () => {
      mockInsert.mockRejectedValueOnce(new Error('DB error'));
      await expect(trackPageView('/test')).resolves.not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('insère un événement dans analytics_events', async () => {
      await trackEvent({ event_type: 'login', user_id: 'user-abc' });

      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          event_type: 'login',
          user_id: 'user-abc',
        }),
      ]);
    });

    it('récupère le user_id depuis Supabase si non fourni', async () => {
      await trackEvent({ event_type: 'signup' });

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'user-123' }),
      ]);
    });
  });

  describe('trackAddToCart', () => {
    it('envoie les bonnes métadonnées produit', async () => {
      await trackAddToCart('prod-1', 'Routeur Cisco', 150000);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          event_type: 'add_to_cart',
          metadata: { productId: 'prod-1', productName: 'Routeur Cisco', price: 150000 },
        }),
      ]);
    });
  });

  describe('trackPurchase', () => {
    it('envoie les bonnes métadonnées commande', async () => {
      await trackPurchase('order-99', 300000, 3);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          event_type: 'purchase',
          metadata: { orderId: 'order-99', amount: 300000, itemCount: 3 },
        }),
      ]);
    });
  });
});
