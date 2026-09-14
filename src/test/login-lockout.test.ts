import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  FALLBACK_LOCK_MINUTES,
  fillLockoutNotice,
  lockoutMinutesFrom,
  remainingLockMs,
  splitRemaining,
  useLoginLockout,
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

describe('fillLockoutNotice', () => {
  it('remplit le gabarit localisé avec le délai, dans les deux langues', () => {
    expect(fillLockoutNotice('Nouvel essai possible dans {time}.', '14 min 32 s'))
      .toBe('Nouvel essai possible dans 14 min 32 s.');
    expect(fillLockoutNotice('Try again in {time}.', '14 min 32 s'))
      .toBe('Try again in 14 min 32 s.');
  });

  it('laisse le gabarit intact quand il ne contient pas de jeton', () => {
    expect(fillLockoutNotice('Reessayez plus tard.', '1 min 00 s')).toBe('Reessayez plus tard.');
  });
});

// Hook partagé par les formulaires de connexion publique, profil et backoffice.
describe('useLoginLockout', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('arme le décompte sur le message du hook et le libère à la fin', () => {
    const { result } = renderHook(() => useLoginLockout());
    expect(result.current.locked).toBe(false);

    act(() => { expect(result.current.registerError(LOCKED_15)).toBe(true); });
    expect(result.current.locked).toBe(true);
    expect(result.current.label).toBe('15 min 00 s');

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.label).toBe('14 min 59 s');

    act(() => { vi.advanceTimersByTime(15 * 60_000); });
    expect(result.current.locked).toBe(false);
  });

  it('remplit le gabarit reçu avec le délai et la langue courante', () => {
    const { result } = renderHook(() => useLoginLockout());

    act(() => { result.current.registerError(LOCKED_15); });
    expect(result.current.notice('Try again in {time}.')).toBe('Try again in 15 min 00 s.');
  });

  it('reste inactif sur les autres erreurs de connexion', () => {
    const { result } = renderHook(() => useLoginLockout());

    act(() => { expect(result.current.registerError('Invalid login credentials')).toBe(false); });
    expect(result.current.locked).toBe(false);
  });
});
