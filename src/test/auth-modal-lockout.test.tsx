import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '@/shared/context/LanguageContext';
import AuthModal from '@/shared/components/AuthModal';

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword } },
}));

vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    showAuthModal: true,
    setShowAuthModal: vi.fn(),
    setPublicLoginInProgress: vi.fn(),
  }),
}));

// Message exact renvoyé par Supabase Auth quand le hook 20260913000100 refuse.
const LOCKED = 'Trop de tentatives de connexion. Réessayez dans 15 minute(s).';

// Supabase renvoie un AuthApiError (donc une vraie Error) : le mock doit faire
// pareil, le composant testant `instanceof Error`.
const authError = (message: string) =>
  Object.assign(new Error(message), { name: 'AuthApiError', status: 400 });

function renderLoginForm() {
  const utils = render(
    <LanguageProvider>
      <AuthModal />
    </LanguageProvider>
  );
  const email = utils.container.querySelector<HTMLInputElement>('input[type="email"]')!;
  const password = utils.container.querySelector<HTMLInputElement>('input[type="password"]')!;
  const form = utils.container.querySelector('form')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const send = async () => {
    fireEvent.change(email, { target: { value: 'client@gcfi.test' } });
    fireEvent.change(password, { target: { value: 'MauvaisMotDePasse1!' } });
    await act(async () => { fireEvent.submit(form); });
    // Laisse React appliquer l'état mis à jour par le gestionnaire asynchrone.
    await act(async () => {});
  };

  return { email, password, form, submit, send };
}

beforeEach(() => {
  localStorage.setItem('gcfi-lang', 'fr');
  signInWithPassword.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuthModal — verrouillage après trop d’échecs', () => {
  it('affiche le délai restant et désactive le bouton quand le serveur verrouille', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { submit, send } = renderLoginForm();

    await send();

    expect(await screen.findByText(/Nouvel essai possible dans 15 min 00 s/)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("n'affiche pas le verrou pour un simple mot de passe erroné", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: authError('Invalid login credentials'),
    });
    const { submit, send } = renderLoginForm();

    await send();

    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeInTheDocument();
    expect(screen.queryByText(/Nouvel essai possible/)).not.toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });

  it('ne rappelle pas Supabase tant que le verrou court', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { send } = renderLoginForm();

    await send();
    await screen.findByText(/Nouvel essai possible/);
    expect(signInWithPassword).toHaveBeenCalledTimes(1);

    await send();
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it('décompte le délai restant puis libère le formulaire', async () => {
    vi.useFakeTimers();
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { submit, send } = renderLoginForm();

    await send();
    expect(screen.getByText(/15 min 00 s/)).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/14 min 59 s/)).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(15 * 60_000); });
    expect(screen.queryByText(/Nouvel essai possible/)).not.toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });
});
