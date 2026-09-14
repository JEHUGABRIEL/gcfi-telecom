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

import { useCallback, useEffect, useState } from 'react';

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

/**
 * Remplit le gabarit localisé (`t.auth.error_account_locked`) avec le délai
 * restant : le texte est traduit côté LanguageContext, seul le délai vient d'ici.
 */
export function fillLockoutNotice(template: string, label: string): string {
  return template.replace('{time}', label);
}

export type LoginLockout = {
  /** Un verrou est en cours : les tentatives ne partiront pas. */
  locked: boolean;
  /** Délai restant, prêt à afficher : « 14 min 32 s ». */
  label: string;
  /** Message localisé à afficher, gabarit `{time}` déjà rempli. */
  notice: (template: string) => string;
  /**
   * À appeler avec le message d'erreur d'une tentative de connexion. Arme le
   * décompte si le serveur a verrouillé le compte, et indique alors à
   * l'appelant de ne pas afficher ce message brut.
   */
  registerError: (message: string) => boolean;
};

/**
 * État du verrouillage par compte, partagé par les formulaires de connexion
 * (publique, profil, backoffice) : il fournit le décompte et empêche de rejouer
 * une tentative pendant l'attente.
 */
export function useLoginLockout(): LoginLockout {
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) { setRemainingMs(0); return; }
    const tick = () => {
      const left = remainingLockMs(lockedUntil);
      setRemainingMs(left);
      if (left === 0) setLockedUntil(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const registerError = useCallback((message: string): boolean => {
    const minutes = lockoutMinutesFrom(message);
    if (minutes === null) return false;
    setLockedUntil(Date.now() + minutes * 60_000);
    return true;
  }, []);

  const { minutes, seconds } = splitRemaining(remainingMs);
  const label = minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, '0')} s` : `${seconds} s`;
  const notice = useCallback(
    (template: string) => fillLockoutNotice(template, label),
    [label],
  );

  return { locked: lockedUntil !== null, label, notice, registerError };
}
