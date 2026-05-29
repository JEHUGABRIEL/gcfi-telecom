'use client';

import { createBrowserClient } from '@supabase/ssr';

// ---------------------------------------------------------------------------
// Lazy browser client
// ---------------------------------------------------------------------------
// createBrowserClient() validates the URL and throws immediately if env vars
// are missing. During Next.js SSR / static-page generation the module is
// imported on the server, so a module-level call crashes the build.
//
// We defer instantiation until the FIRST property access (e.g. supabase.auth,
// supabase.from). All Supabase calls in this project live inside useEffect()
// or event handlers — neither runs during server-side rendering — so the
// constructor is never reached on the server.
// ---------------------------------------------------------------------------

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getBrowserClient(): ReturnType<typeof createBrowserClient> {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    const client = getBrowserClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export type SupabaseUser = Awaited<
  ReturnType<ReturnType<typeof createBrowserClient>['auth']['getUser']>
>['data']['user'];
