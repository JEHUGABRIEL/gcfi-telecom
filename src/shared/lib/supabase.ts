'use client';

import { createBrowserClient } from '@supabase/ssr';

// These are NEXT_PUBLIC_ vars — embedded at build time.
// We use fallback empty strings so the module can be imported without
// crashing during Next.js static page generation on Vercel when the
// env vars haven't been set yet. API calls will fail gracefully at
// runtime if the values are truly missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.');
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);

export type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
