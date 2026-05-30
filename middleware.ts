import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const MFA_COOKIE_NAME = 'mfa_verified';

// Vérifie le cookie MFA signé HMAC-SHA256 (compatible Edge runtime via Web Crypto).
async function verifyMFACookie(cookieValue: string, userId: string): Promise<boolean> {
  const secret = process.env.MFA_COOKIE_SECRET;
  if (!secret) return false;

  const parts = cookieValue.split('|');
  if (parts.length !== 3) return false;
  const [cookieUserId, expiresAt, sig] = parts;

  if (cookieUserId !== userId) return false;
  if (Date.now() > Number(expiresAt)) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    // Décode base64url → ArrayBuffer
    const b64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${cookieUserId}|${expiresAt}`));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // getUser() validates the JWT with the Supabase server.
  // Wrapped in try/catch: if Supabase is unreachable or the token
  // is malformed, we treat the user as unauthenticated rather than
  // crashing the middleware and returning 500.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — treat as unauthenticated
  }

  // /profil requires authentication
  if (pathname.startsWith('/profil') && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // /admin routes (except /admin-login) require authentication + admin role.
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!user) return NextResponse.redirect(new URL('/admin-login', request.url));

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    // Vérifie que le MFA a été complété côté serveur si l'utilisateur a le MFA activé.
    const { data: mfaSettings } = await supabase
      .from('user_mfa_settings')
      .select('enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (mfaSettings?.enabled) {
      const mfaCookie = request.cookies.get(MFA_COOKIE_NAME)?.value;
      const mfaValid = mfaCookie ? await verifyMFACookie(mfaCookie, user.id) : false;
      if (!mfaValid) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
