import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // /admin routes (except /admin-login) require authentication.
  // Role-based access is enforced by AdminModule (reads from profiles table).
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!user) return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
