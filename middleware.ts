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

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const role = user?.app_metadata?.role as string | undefined;
  const isAdmin = role === 'admin' || role === 'superadmin';

  // /profil requires authentication
  if (pathname.startsWith('/profil') && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // /admin requires admin role
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!user) return NextResponse.redirect(new URL('/admin-login', request.url));
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect already-authenticated admin away from admin-login
  if (pathname === '/admin-login' && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Redirect admin users away from public client pages
  const publicPaths = ['/', '/boutique', '/formation', '/services', '/blog', '/profil'];
  const isPublicPath = publicPaths.some(p => pathname === p)
    || pathname.startsWith('/boutique/')
    || pathname.startsWith('/formation/');
  if (isPublicPath && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)',
  ],
};
