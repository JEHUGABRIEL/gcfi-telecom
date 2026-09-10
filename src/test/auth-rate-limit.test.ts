import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callerIp, emailKey, ipKey } from '@/shared/lib/auth-rate-limit';

const req = (headers: Record<string, string>) =>
  ({ headers: { get: (h: string) => headers[h.toLowerCase()] ?? null } }) as never;

describe('callerIp', () => {
  it('retient la première adresse de x-forwarded-for', () => {
    // Les suivantes sont les proxys traversés, pas l'appelant.
    expect(callerIp(req({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })))
      .toBe('203.0.113.7');
  });

  it('tolère les espaces', () => {
    expect(callerIp(req({ 'x-forwarded-for': '  203.0.113.7  ' }))).toBe('203.0.113.7');
  });

  it('retombe sur x-real-ip', () => {
    expect(callerIp(req({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
  });

  it('renvoie une clé commune plutôt que rien quand aucune adresse n\'est lisible', () => {
    // Limiter globalement vaut mieux que ne pas limiter.
    expect(callerIp(req({}))).toBe('unknown');
  });

  it('ignore un x-forwarded-for vide', () => {
    expect(callerIp(req({ 'x-forwarded-for': '', 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
  });
});

describe('emailKey', () => {
  it('ne laisse jamais apparaître l\'adresse en clair', () => {
    const key = emailKey('forgot', 'victime@example.com');
    expect(key).not.toContain('victime');
    expect(key).not.toContain('example.com');
    expect(key.startsWith('forgot:email:')).toBe(true);
  });

  it('normalise casse et espaces vers la même clé', () => {
    expect(emailKey('forgot', '  Victime@Example.COM ')).toBe(emailKey('forgot', 'victime@example.com'));
  });

  it('sépare deux adresses distinctes', () => {
    expect(emailKey('forgot', 'a@example.com')).not.toBe(emailKey('forgot', 'b@example.com'));
  });

  it('sépare deux préfixes pour une même adresse', () => {
    expect(emailKey('forgot', 'a@example.com')).not.toBe(emailKey('signup', 'a@example.com'));
  });
});

describe('ipKey', () => {
  it('compose préfixe et adresse', () => {
    expect(ipKey('forgot', '203.0.113.7')).toBe('forgot:ip:203.0.113.7');
  });
});

// ---------------------------------------------------------------------------
// consumeRateLimit — comportement face à la base
// ---------------------------------------------------------------------------

const rpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc }),
}));

const { consumeRateLimit } = await import('@/shared/lib/auth-rate-limit');

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
});

describe('consumeRateLimit', () => {
  it('transmet clé, limite et fenêtre à la fonction SQL', async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, retry_after_seconds: 0 }], error: null });
    await consumeRateLimit('forgot:ip:1.2.3.4', 5, 900);
    expect(rpc).toHaveBeenCalledWith('consume_rate_limit', {
      p_key: 'forgot:ip:1.2.3.4', p_limit: 5, p_window_seconds: 900,
    });
  });

  it('refuse et remonte le délai d\'attente', async () => {
    rpc.mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 420 }], error: null });
    await expect(consumeRateLimit('k', 5, 900)).resolves.toEqual({
      allowed: false, retryAfterSeconds: 420,
    });
  });

  it('accepte une ligne unique hors tableau', async () => {
    rpc.mockResolvedValue({ data: { allowed: false, retry_after_seconds: 60 }, error: null });
    await expect(consumeRateLimit('k', 1, 300)).resolves.toEqual({
      allowed: false, retryAfterSeconds: 60,
    });
  });

  it('laisse passer si la base est en erreur', async () => {
    // Un limiteur cassé ne doit pas bloquer toutes les réinitialisations.
    rpc.mockResolvedValue({ data: null, error: { message: 'connection refused' } });
    await expect(consumeRateLimit('k', 5, 900)).resolves.toMatchObject({ allowed: true });
  });

  it('laisse passer si la RPC lève', async () => {
    rpc.mockRejectedValue(new Error('boom'));
    await expect(consumeRateLimit('k', 5, 900)).resolves.toMatchObject({ allowed: true });
  });

  it('laisse passer, en le signalant, si la clé service est absente', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(consumeRateLimit('k', 5, 900)).resolves.toMatchObject({ allowed: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
