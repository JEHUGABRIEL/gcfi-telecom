import { supabase } from '@/shared/lib/supabase';

export type UserRole = 'client' | 'admin' | 'superadmin';

export const INVALID_LOGIN_MESSAGE = 'Email ou mot de passe incorrect.';

export function isAdminRole(role: unknown): role is 'admin' | 'superadmin' {
  return role === 'admin' || role === 'superadmin';
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return (data?.role as UserRole | undefined) ?? null;
}

/**
 * Public authentication must fail closed when the profile cannot be read.
 * The same generic error is used for admins and unknown profile lookup errors.
 */
export async function verifyPublicLoginRole(userId: string): Promise<void> {
  let role: UserRole | null;

  try {
    role = await getUserRole(userId);
  } catch {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  if (isAdminRole(role)) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    throw new Error(INVALID_LOGIN_MESSAGE);
  }
}
