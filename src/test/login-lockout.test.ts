import { describe, it, expect } from 'vitest';
import {
  FALLBACK_LOCK_MINUTES,
  lockoutMinutesFrom,
  remainingLockMs,
  splitRemaining,
} from '@/shared/lib/login-lockout';

// Message exact renvoyé par Supabase Auth, mesuré sur la stack locale avec le
// hook 20260913000100 actif (échec n°5 et tentative avec le bon mot de passe).
const LOCKED_15 = 'Trop de tentatives de connexion. Réessayez dans 15 minute(s).';

describe('lockoutMinutesFrom', () => {
  it('extrait le délai du message du hook', () => {
    expect(lockoutMinutesFrom(LOCKED_15)).toBe(15);
  });

  it('accepte les variantes de casse et de nombre', () => {
    expect(lockoutMinutesFrom(LOCKED_15.toLowerCase())).toBe(15);
    expect(lockoutMinutesFrom('Trop de tentatives de connexion. Réessayez dans 1 minute(s).')).toBe(1);
    expect(lockoutMinutesFrom('Trop de tentatives de connexion. Réessayez dans 42 minutes.')).toBe(42);
  });

  it('retombe sur le délai par défaut si la durée est absente ou nulle', () => {
    expect(lockoutMinutesFrom('Trop de tentatives de connexion.')).toBe(FALLBACK_LOCK_MINUTES);
    expect(lockoutMinutesFrom('Trop de tentatives de connexion. Réessayez dans 0 minute(s).')).toBe(
      FALLBACK_LOCK_MINUTES,
    );
  });

  it('ne détecte aucun verrou sur les autres erreurs d’authentification', () => {
    expect(lockoutMinutesFrom('Invalid login credentials')).toBeNull();
    expect(lockoutMinutesFrom('Email not confirmed')).toBeNull();
    expect(lockoutMinutesFrom('Email ou mot de passe incorrect.')).toBeNull();
    expect(lockoutMinutesFrom('')).toBeNull();
  });
});

describe('remainingLockMs', () => {
  it('compte les millisecondes restantes', () => {
    expect(remainingLockMs(1_000_000, 940_000)).toBe(60_000);
  });

  it('ne descend jamais sous zéro', () => {
    expect(remainingLockMs(1_000_000, 1_500_000)).toBe(0);
    expect(remainingLockMs(1_000_000, 1_000_000)).toBe(0);
  });
});

describe('splitRemaining', () => {
  it('arrondit à la seconde supérieure pour ne pas libérer le bouton trop tôt', () => {
    expect(splitRemaining(15 * 60_000)).toEqual({ minutes: 15, seconds: 0 });
    expect(splitRemaining(62_500)).toEqual({ minutes: 1, seconds: 3 });
    expect(splitRemaining(61_000)).toEqual({ minutes: 1, seconds: 1 });
  });

  it('affiche une durée nulle à la fin du verrou', () => {
    expect(splitRemaining(0)).toEqual({ minutes: 0, seconds: 0 });
    expect(splitRemaining(-5_000)).toEqual({ minutes: 0, seconds: 0 });
  });
});
