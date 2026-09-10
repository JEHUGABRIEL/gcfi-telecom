import { describe, it, expect, vi, beforeEach } from 'vitest';

// Verdicts pilotés par test, indexés par préfixe de clé.
let ipVerdict = { allowed: true, retryAfterSeconds: 0 };
let emailVerdict = { allowed: true, retryAfterSeconds: 0 };
let profileRow: Record<string, unknown> | null = null;

const resetPasswordForEmail = vi.fn();
const consumeRateLimit = vi.fn(async (key: string) =>
  key.includes(':ip:') ? ipVerdict : emailVerdict
);

vi.mock('@/shared/lib/auth-rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/auth-rate-limit')>(
    '@/shared/lib/auth-rate-limit'
  );
  return { ...actual, consumeRateLimit: (key: string) => consumeRateLimit(key) };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, key: string) => {
    if (key === 'service-key') {
      return {
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profileRow }) }) }),
        }),
      };
    }
    return {
      auth: {
        resetPasswordForEmail: async (email: string, opts: { redirectTo: string }) => {
          resetPasswordForEmail(email, opts);
          return { error: null };
        },
      },
    };
  },
}));

const { POST } = await import('@/app/api/auth/forgot-password/route');

const call = (email: unknown, origin = 'https://www.gcfi-rca.com', ip = '203.0.113.7') =>
  POST(new Request(`${origin}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  }) as never);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  ipVerdict = { allowed: true, retryAfterSeconds: 0 };
  emailVerdict = { allowed: true, retryAfterSeconds: 0 };
  profileRow = null;
});

describe('POST /api/auth/forgot-password — limitation par IP', () => {
  it('renvoie 429 avec Retry-After quand l\'IP dépasse son quota', async () => {
    ipVerdict = { allowed: false, retryAfterSeconds: 420 };
    const res = await call('client@example.com');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('420');
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('court-circuite avant toute lecture en base', async () => {
    ipVerdict = { allowed: false, retryAfterSeconds: 60 };
    await call('client@example.com');
    // Un seul appel : celui par IP. Le compteur par email n'est pas consommé.
    expect(consumeRateLimit).toHaveBeenCalledOnce();
    expect(consumeRateLimit.mock.calls[0][0]).toContain(':ip:');
  });
});

describe('POST /api/auth/forgot-password — limitation par email', () => {
  it('répond 200 SUCCESS sans envoyer, jamais 429', async () => {
    // Un 429 ici révélerait qu'un envoi a eu lieu récemment pour cette
    // adresse, donc que le compte existe.
    emailVerdict = { allowed: false, retryAfterSeconds: 200 };
    const res = await call('client@example.com');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('produit une réponse identique à celle d\'un envoi réussi', async () => {
    const sent = await call('client@example.com');
    const sentBody = await sent.json();

    vi.clearAllMocks();
    emailVerdict = { allowed: false, retryAfterSeconds: 200 };
    const throttled = await call('client@example.com');

    expect(throttled.status).toBe(sent.status);
    await expect(throttled.json()).resolves.toEqual(sentBody);
  });
});

describe('POST /api/auth/forgot-password — comportement nominal', () => {
  it('envoie le lien vers l\'origine de confiance', async () => {
    const res = await call('client@example.com');
    expect(res.status).toBe(200);
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'client@example.com',
      { redirectTo: 'https://www.gcfi-rca.com/reset-password' }
    );
  });

  it('ignore une origine non listée et retombe sur le domaine canonique', async () => {
    await call('client@example.com', 'https://attaquant.example');
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'client@example.com',
      { redirectTo: 'https://www.gcfi-rca.com/reset-password' }
    );
  });

  it('accepte localhost:3001', async () => {
    await call('client@example.com', 'http://localhost:3001');
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'client@example.com',
      { redirectTo: 'http://localhost:3001/reset-password' }
    );
  });

  it('n\'envoie rien pour un compte admin, sans le dire', async () => {
    profileRow = { role: 'admin' };
    const res = await call('admin@gcfi-rca.com');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('rejette une adresse malformée avant de consommer le moindre quota', async () => {
    const res = await call('pas-un-email');
    expect(res.status).toBe(400);
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });
});
