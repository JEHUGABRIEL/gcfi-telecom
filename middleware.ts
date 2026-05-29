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

  // Refresh session if expired — required by @supabase/ssr
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // /profil requires authentication
  if (pathname.startsWith('/profil') && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // /admin routes (except /admin-login) require authentication only.
  // Role-based access (admin vs superadmin vs client) is enforced by
  // the AdminModule component itself, which reads the role from the
  // profiles table — the only reliable source for this project.
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
