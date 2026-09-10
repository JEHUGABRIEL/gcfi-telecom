import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Adresse de l'appelant.
 *
 * Derrière le proxy Vercel, l'adresse réelle est en tête de `x-forwarded-for`
 * (les suivantes sont les proxys traversés). L'en-tête est falsifiable par un
 * client direct, mais Vercel le réécrit : ce qui arrive ici est fiable en
 * production. Sans adresse exploitable on retombe sur une clé commune, ce qui
 * limite globalement plutôt que de ne pas limiter du tout.
 */
export function callerIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Clé de compteur pour une adresse email.
 *
 * L'email est haché : la table ne doit pas devenir une liste d'adresses
 * sollicitées, dont beaucoup n'ont aucun compte chez nous.
 */
export function emailKey(prefix: string, email: string): string {
  const digest = createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 32);
  return `${prefix}:email:${digest}`;
}

export const ipKey = (prefix: string, ip: string) => `${prefix}:ip:${ip}`;

/**
 * Incrémente le compteur `key` et dit si la requête passe.
 *
 * En cas d'indisponibilité de la base, on laisse passer : un limiteur cassé
 * ne doit pas rendre la réinitialisation de mot de passe impossible pour
 * tout le monde.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitVerdict> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[rate-limit] SUPABASE_SERVICE_ROLE_KEY manquant — limitation inactive');
    return { allowed: true, retryAfterSeconds: 0 };
  }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('[rate-limit] RPC en échec :', error.message);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, retryAfterSeconds: 0 };

    return {
      allowed: Boolean(row.allowed),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    };
  } catch (err) {
    console.error('[rate-limit] Erreur inattendue :', err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
