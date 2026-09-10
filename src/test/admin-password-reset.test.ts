import { describe, it, expect, vi, beforeEach } from 'vitest';

// Session courante, pilotée par chaque test.
let sessionUser: { id: string; email: string } | null = null;
// Ligne `profiles` renvoyée par la clé service.
let profileRow: Record<string, unknown> | null = null;
// Erreur simulée côté envoi d'email.
let sendError: { message: string } | null = null;

const resetPasswordForEmail = vi.fn();
const profileUpdate = vi.fn();

vi.mock('@/shared/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: sessionUser } }) },
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    // La clé service lit/écrit `profiles` ; la clé anon envoie l'email.
    if (key === 'service-key') {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: profileRow }) }),
          }),
          update: (values: Record<string, unknown>) => {
            profileUpdate(values);
            return { eq: async () => ({ error: null }) };
          },
        }),
      };
    }
    return {
      auth: {
        resetPasswordForEmail: async (email: string, opts: { redirectTo: string }) => {
          resetPasswordForEmail(email, opts);
          return { error: sendError };
        },
      },
    };
  },
}));

const { POST } = await import('@/app/api/auth/admin-password-reset/route');

const call = () =>
  POST(new Request('https://www.gcfi-rca.com/api/auth/admin-password-reset', { method: 'POST' }) as never);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  sessionUser = { id: 'user-1', email: 'admin@gcfi-rca.com' };
  profileRow = { role: 'admin', password_reset_requested_at: null };
  sendError = null;
});

describe('POST /api/auth/admin-password-reset', () => {
  it('refuse une requête sans session', async () => {
    sessionUser = null;
    const res = await call();
    expect(res.status).toBe(401);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('refuse un compte non admin', async () => {
    profileRow = { role: 'client', password_reset_requested_at: null };
    const res = await call();
    expect(res.status).toBe(403);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('accepte un superadmin', async () => {
    profileRow = { role: 'superadmin', password_reset_requested_at: null };
    expect((await call()).status).toBe(200);
  });

  it('envoie le lien à l\'adresse de la session, jamais à une adresse fournie', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true, email: 'admin@gcfi-rca.com' });
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'admin@gcfi-rca.com',
      { redirectTo: 'https://www.gcfi-rca.com/reset-password' }
    );
  });

  it('bloque une seconde demande pendant le délai anti-répétition', async () => {
    profileRow = { role: 'admin', password_reset_requested_at: new Date().toISOString() };
    const res = await call();
    expect(res.status).toBe(429);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('autorise une nouvelle demande une fois le délai écoulé', async () => {
    profileRow = {
      role: 'admin',
      password_reset_requested_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    };
    expect((await call()).status).toBe(200);
    expect(resetPasswordForEmail).toHaveBeenCalledOnce();
  });

  it('horodate la demande seulement après un envoi réussi', async () => {
    await call();
    expect(profileUpdate).toHaveBeenCalledOnce();

    vi.clearAllMocks();
    sendError = { message: 'SMTP down' };
    const res = await call();
    expect(res.status).toBe(502);
    // Sinon un échec d'envoi verrouillerait l'admin pendant tout le délai.
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it('échoue proprement si la clé service est absente', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await call();
    expect(res.status).toBe(500);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
