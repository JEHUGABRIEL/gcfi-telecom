import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatAuthError, logError } from '@/shared/lib/supabase-helpers';

describe('formatAuthError', () => {
  it('traduit "Invalid login credentials"', () => {
    expect(formatAuthError(new Error('Invalid login credentials')))
      .toBe('Email ou mot de passe incorrect.');
  });

  it('traduit "Email not confirmed"', () => {
    expect(formatAuthError(new Error('Email not confirmed')))
      .toBe('Veuillez confirmer votre email avant de vous connecter.');
  });

  it('traduit "User already registered"', () => {
    expect(formatAuthError(new Error('User already registered')))
      .toBe('Un compte existe déjà avec cet email.');
  });

  it('traduit "Password should be at least 6 characters"', () => {
    expect(formatAuthError(new Error('Password should be at least 6 characters')))
      .toBe('Le mot de passe doit contenir au moins 6 caractères.');
  });

  it('retourne un message par défaut pour les erreurs inconnues', () => {
    expect(formatAuthError(new Error('Unknown error')))
      .toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  it('gère les erreurs non-Error (string)', () => {
    expect(formatAuthError('Some string error'))
      .toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  it('gère les erreurs non-Error (number)', () => {
    expect(formatAuthError(500))
      .toBe('Une erreur est survenue. Veuillez réessayer.');
  });
});

describe('logError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('log dans la console en développement', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('TestModule', new Error('test error'));

    expect(spy).toHaveBeenCalledWith('[TestModule]', expect.any(Error));
  });

  it("ne log pas en production", () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('TestModule', new Error('test error'));

    expect(spy).not.toHaveBeenCalled();
  });

  it('log avec des arguments non-Error', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('TestModule', 'simple string');

    expect(spy).toHaveBeenCalledWith('[TestModule]', 'simple string');
  });
});
