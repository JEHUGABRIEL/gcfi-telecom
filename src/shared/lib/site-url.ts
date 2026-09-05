/**
 * Canonical site URL (origin only, no trailing slash).
 *
 * Read from NEXT_PUBLIC_SITE_URL so staging/preview deployments don't emit
 * production URLs in the sitemap or canonical/OG metadata. Falls back to the
 * production domain when the env var is unset.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.gcfi-rca.com').replace(/\/+$/, '');

/** Join a path onto the canonical site URL. */
export function siteUrl(path = ''): string {
  return `${SITE_URL}${path.startsWith('/') || path === '' ? path : `/${path}`}`;
}
