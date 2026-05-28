import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    it('retourne true pour un code TOTP valide', async () => {
      // Générer un secret réel et un code valide
      const secret = new OTPAuth.Secret();
      const totp = new OTPAuth.TOTP({ secret, algorithm: 'SHA1', digits: 6, period: 30 });
      const validCode = totp.generate();

      mockSingle.mockResolvedValueOnce({ data: { secret: secret.base32 } });

      const result = await verifyTOTPCode('user-123', validCode);
      expect(result).toBe(true);
    });

    it('retourne false pour un code incorrect', async () => {
      const secret = new OTPAuth.Secret();
      mockSingle.mockResolvedValueOnce({ data: { secret: secret.base32 } });

      const result = await verifyTOTPCode('user-123', '000000');
      expect(result).toBe(false);
    });

    it('retourne false si aucun secret trouvé', async () => {
      mockSingle.mockResolvedValueOnce({ data: null });

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
