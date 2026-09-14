/**
 * Verrouillage d'un compte après trop d'échecs de connexion.
 *
 * Supabase Auth renvoie le message produit par
 * `public.hook_password_verification_attempt()` (voir
 * `supabase/migrations/20260913000100_password_signin_lockout.sql`) toujours
 * avec `error_code: 'invalid_credentials'` : un verrou ne se distingue donc que
 * par le texte, qui est :
 *
 *   « Trop de tentatives de connexion. Réessayez dans 15 minute(s). »
 *
 * On en extrait le délai pour l'afficher dans le formulaire et bloquer le
 * bouton pendant l'attente, au lieu de laisser l'utilisateur rejouer une
 * tentative que le serveur refusera de toute façon — y compris avec le bon mot
 * de passe.
 */

const LOCKOUT_MARKER = /trop de tentatives de connexion/i;
const LOCKOUT_MINUTES = /(\d+)\s*minute/i;

/** Délai retenu si le message annonce un verrou sans en préciser la durée. */
export const FALLBACK_LOCK_MINUTES = 15;

/**
 * Durée du verrouillage annoncée par Supabase Auth, en minutes, ou `null` si
 * le message ne signale pas un compte verrouillé.
 */
export function lockoutMinutesFrom(message: string): number | null {
  if (!LOCKOUT_MARKER.test(message)) return null;
  const found = LOCKOUT_MINUTES.exec(message);
  const minutes = found ? Number(found[1]) : 0;
  return minutes > 0 ? minutes : FALLBACK_LOCK_MINUTES;
}

/** Millisecondes restantes avant qu'une nouvelle tentative soit acceptée. */
export function remainingLockMs(lockedUntil: number, now: number = Date.now()): number {
  return Math.max(0, lockedUntil - now);
}

/** Découpe une durée restante en minutes et secondes, pour un décompte lisible. */
export function splitRemaining(remainingMs: number): { minutes: number; seconds: number } {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}
