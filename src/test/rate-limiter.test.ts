import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks Supabase avant les imports — chaque fonction retourne le chaînage correct
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    })),
  },
}));

import { checkRateLimit, recordUpload } from '@/shared/lib/rate-limiter';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('autorise si pas de limite atteinte', async () => {
    mockSingle.mockResolvedValueOnce({ data: null });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('bloque si moins de 30s depuis le dernier upload', async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 5000).toString());
    // Pas besoin de mockSingle car la fonction retourne avant le try

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('30 secondes');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('autorise si plus de 30s depuis le dernier upload', async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 35000).toString());
    mockSingle.mockResolvedValueOnce({ data: null });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });

  it('bloque si utilisateur banni', async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 35000).toString());
    mockSingle.mockResolvedValueOnce({
      data: { is_banned: true, upload_count: 60, reset_at: new Date(Date.now() + 3600000).toISOString() },
    });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Compte bloqué.');
  });

  it('réinitialise le compteur si reset_at est passé', async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 35000).toString());
    mockSingle.mockResolvedValueOnce({
      data: { is_banned: false, upload_count: 50, reset_at: new Date(Date.now() - 1000).toISOString() },
    });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('bloque si upload_count dépasse le max et reset_at pas encore passé', async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 35000).toString());
    mockSingle.mockResolvedValueOnce({
      data: { is_banned: false, upload_count: 50, reset_at: new Date(Date.now() + 3600000).toISOString() },
    });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Limite quotidienne');
    expect(mockUpdate).toHaveBeenCalledWith({ is_banned: true });
  });

  it("ne bloque pas si l'utilisateur existe mais n'a pas dépassé la limite", async () => {
    localStorage.setItem('last_upload_user-1', (Date.now() - 35000).toString());
    mockSingle.mockResolvedValueOnce({
      data: { is_banned: false, upload_count: 10, reset_at: new Date(Date.now() + 3600000).toISOString() },
    });

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });
});

describe('recordUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('enregistre le timestamp dans localStorage', async () => {
    mockSingle.mockResolvedValueOnce({ data: null });

    await recordUpload('user-1');

    const stored = localStorage.getItem('last_upload_user-1');
    expect(stored).toBeTruthy();
    expect(Number(stored)).toBeCloseTo(Date.now(), -2); // within ~100ms
  });

  it("incrémente upload_count si l'utilisateur existe déjà", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 1, user_id: 'user-1', upload_count: 5, reset_at: new Date(Date.now() + 3600000).toISOString() },
    });

    await recordUpload('user-1');

    expect(mockUpdate).toHaveBeenCalledWith({ upload_count: 6 });
    expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it("insère un enregistrement si l'utilisateur n'existe pas", async () => {
    mockSingle.mockResolvedValueOnce({ data: null });

    await recordUpload('user-1');

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        upload_count: 1,
      }),
    ]);
  });
});
