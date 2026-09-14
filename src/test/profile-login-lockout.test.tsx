import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '@/shared/context/LanguageContext';
import ProfileModule from '@/modules/profile/components/ProfileModule';

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword, signOut: vi.fn() } },
}));

// Visiteur non connecté : c'est le formulaire de connexion qui est rendu.
vi.mock('@/shared/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    signOut: vi.fn(),
    setShowSignOutModal: vi.fn(),
    setPublicLoginInProgress: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// Message exact renvoyé par Supabase Auth quand le hook 20260913000100 refuse.
const LOCKED = 'Trop de tentatives de connexion. Réessayez dans 15 minute(s).';

const authError = (message: string) =>
  Object.assign(new Error(message), { name: 'AuthApiError', status: 400 });

function renderProfileLogin() {
  const utils = render(
    <LanguageProvider>
      <ProfileModule />
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
    await act(async () => {});
  };

  return { submit, send };
}

beforeEach(() => {
  localStorage.setItem('gcfi-lang', 'fr');
  signInWithPassword.mockReset();
});

describe('ProfileModule — verrouillage après trop d’échecs', () => {
  it('affiche le délai restant et désactive le bouton quand le serveur verrouille', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { submit, send } = renderProfileLogin();

    await send();

    expect(await screen.findByText(/Nouvel essai possible dans 15 min 00 s/)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('ne rappelle pas Supabase tant que le verrou court', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { send } = renderProfileLogin();

    await send();
    await screen.findByText(/Nouvel essai possible/);
    expect(signInWithPassword).toHaveBeenCalledTimes(1);

    await send();
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
