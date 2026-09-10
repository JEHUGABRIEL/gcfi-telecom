import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as OTPAuth from 'otpauth';

// ── Mock Supabase ─────────────────────────────────────────────
const mockSingle   = vi.fn();
const mockSelect   = vi.fn(() => ({ eq: mockEq }));
const mockEq       = vi.fn(() => ({ single: mockSingle }));
const mockUpsert   = vi.fn().mockResolvedValue({ error: null });
const mockUpdate   = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'user_mfa_settings') {
        return { select: mockSelect, upsert: mockUpsert, update: mockUpdate };
      }
      return { select: mockSelect, upsert: mockUpsert, update: mockUpdate };
    }),
  },
}));

import { verifyTOTPCode, setupTOTP, isMFAEnabled } from '@/shared/lib/mfa-service';

describe('mfa-service (TOTP)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('verifyTOTPCode', () => {
    // La vérification est désormais déléguée à /api/auth/verify-mfa (clé
    // service, jamais exposée au client) — le secret ne transite plus
    // jamais côté navigateur. On mock donc fetch plutôt que Supabase.
    const originalFetch = global.fetch;
    afterEach(() => { global.fetch = originalFetch; });

    it('retourne true quand le serveur valide le code', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true }) as unknown as typeof fetch;

      const result = await verifyTOTPCode('user-123', '123456');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-mfa', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', token: '123456' }),
      }));
    });

    it('retourne false quand le serveur rejette le code', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false }) as unknown as typeof fetch;

      const result = await verifyTOTPCode('user-123', '000000');
      expect(result).toBe(false);
    });

    it('retourne false si la requête échoue', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('network error')) as unknown as typeof fetch;

      const result = await verifyTOTPCode('user-123', '123456');
      expect(result).toBe(false);
    });
  });

  describe('isMFAEnabled', () => {
    it('retourne true si MFA activé', async () => {
      mockSingle.mockResolvedValueOnce({ data: { enabled: true, secret: 'abc' } });
      expect(await isMFAEnabled('user-123')).toBe(true);
    });

    it('retourne false si MFA désactivé', async () => {
      mockSingle.mockResolvedValueOnce({ data: { enabled: false, secret: 'abc' } });
      expect(await isMFAEnabled('user-123')).toBe(false);
    });

    it('retourne false si pas de données', async () => {
      mockSingle.mockResolvedValueOnce({ data: null });
      expect(await isMFAEnabled('user-123')).toBe(false);
    });
  });

  describe('setupTOTP', () => {
    it('retourne un secret, une URI et un QR code', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });

      const result = await setupTOTP('user-123', 'test@gcfi-rca.com');

      expect(result.secret).toBeTruthy();
      expect(result.uri).toContain('otpauth://totp/');
      expect(result.uri).toContain('GCFI%20Telecom');
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });
});
