import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '@/shared/context/LanguageContext';
import AdminLoginPage from '@/modules/admin/components/AdminLoginPage';

const { getSession, signInWithPassword } = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { auth: { getSession, signInWithPassword, signOut: vi.fn() } },
}));

vi.mock('@/shared/lib/mfa-service', () => ({
  isMFAEnabled: vi.fn().mockResolvedValue(false),
}));

// Message exact renvoyé par Supabase Auth quand le hook 20260913000100 refuse.
const LOCKED = 'Trop de tentatives de connexion. Réessayez dans 15 minute(s).';

const authError = (message: string) =>
  Object.assign(new Error(message), { name: 'AuthApiError', status: 400 });

function renderAdminLogin() {
  const utils = render(
    <LanguageProvider>
      <AdminLoginPage />
    </LanguageProvider>
  );
  const email = utils.container.querySelector<HTMLInputElement>('input[type="email"]')!;
  const password = utils.container.querySelector<HTMLInputElement>('input[type="password"]')!;
  const form = utils.container.querySelector('form')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const send = async () => {
    fireEvent.change(email, { target: { value: 'admin@gcfi.test' } });
    fireEvent.change(password, { target: { value: 'MauvaisMotDePasse1!' } });
    await act(async () => { fireEvent.submit(form); });
    await act(async () => {});
  };

  return { email, password, submit, send };
}

beforeEach(() => {
  localStorage.setItem('gcfi-lang', 'fr');
  // La page vérifie la session existante au montage.
  getSession.mockResolvedValue({ data: { session: null } });
  signInWithPassword.mockReset();
});

describe('AdminLoginPage — verrouillage après trop d’échecs', () => {
  it('affiche le délai restant et désactive le bouton quand le serveur verrouille', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { submit, send } = renderAdminLogin();

    await send();

    expect(await screen.findByText(/Nouvel essai possible dans 15 min 00 s/)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('ne rappelle pas Supabase tant que le verrou court', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: authError(LOCKED) });
    const { send } = renderAdminLogin();

    await send();
    await screen.findByText(/Nouvel essai possible/);
    expect(signInWithPassword).toHaveBeenCalledTimes(1);

    await send();
    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas le verrou sur un mot de passe refusé pour une autre raison", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: authError('Invalid login credentials'),
    });
    const { submit, send } = renderAdminLogin();

    await send();

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(screen.queryByText(/Nouvel essai possible/)).not.toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });
});
