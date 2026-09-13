import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockSignOut } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { signOut: mockSignOut },
  },
}));

import {
  getUserRole,
  isAdminRole,
  INVALID_LOGIN_MESSAGE,
  verifyPublicLoginRole,
} from '@/shared/lib/auth-role';

function mockRoleResult(data: { role: string } | null, error: unknown = null) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data, error }),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue({ error: null });
});

describe('auth role verification', () => {
  it('recognizes both administrator roles', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('superadmin')).toBe(true);
    expect(isAdminRole('client')).toBe(false);
  });

  it('returns the profile role', async () => {
    mockRoleResult({ role: 'client' });

    await expect(getUserRole('user-1')).resolves.toBe('client');
  });

  it('rejects admins with a generic error and signs out locally', async () => {
    mockRoleResult({ role: 'admin' });

    await expect(verifyPublicLoginRole('admin-1')).rejects.toThrow(INVALID_LOGIN_MESSAGE);
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('allows standard users without signing them out', async () => {
    mockRoleResult({ role: 'client' });

    await expect(verifyPublicLoginRole('user-1')).resolves.toBeUndefined();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('fails closed with the same generic error when the role lookup fails', async () => {
    mockRoleResult(null, new Error('database unavailable'));

    await expect(verifyPublicLoginRole('unknown-1')).rejects.toThrow(INVALID_LOGIN_MESSAGE);
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
