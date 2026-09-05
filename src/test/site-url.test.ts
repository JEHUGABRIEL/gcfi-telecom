import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('site-url', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('retombe sur le domaine de production si NEXT_PUBLIC_SITE_URL est absent', async () => {
    const { SITE_URL, siteUrl } = await import('@/shared/lib/site-url');
    expect(SITE_URL).toBe('https://www.gcfi-rca.com');
    expect(siteUrl('/boutique/p1')).toBe('https://www.gcfi-rca.com/boutique/p1');
  });

  it('utilise NEXT_PUBLIC_SITE_URL quand il est défini', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.gcfi-rca.com/';
    const { SITE_URL, siteUrl } = await import('@/shared/lib/site-url');
    expect(SITE_URL).toBe('https://staging.gcfi-rca.com'); // slash final retiré
    expect(siteUrl('/formation/c1')).toBe('https://staging.gcfi-rca.com/formation/c1');
  });

  it("siteUrl() gère les chemins avec ou sans slash initial", async () => {
    const { siteUrl } = await import('@/shared/lib/site-url');
    expect(siteUrl('profil')).toBe('https://www.gcfi-rca.com/profil');
    expect(siteUrl('/profil')).toBe('https://www.gcfi-rca.com/profil');
    expect(siteUrl()).toBe('https://www.gcfi-rca.com');
  });
});
