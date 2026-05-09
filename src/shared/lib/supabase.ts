import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes. Créer .env.local avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
}

// ✅ Mutex maison — remplace navigator.locks qui cause NavigatorLockAcquireTimeoutError
// en React 18 StrictMode (double-mount → deux listeners auth concurrents → deadlock)
const mutexMap: Record<string, Promise<void>> = {};

async function customLock<T>(name: string, _timeout: number, fn: () => Promise<T>): Promise<T> {
  const prev = mutexMap[name] ?? Promise.resolve();
  let release!: () => void;
  mutexMap[name] = new Promise(r => { release = r; });
  try {
    await prev;
    return await fn();
  } finally {
    release();
    delete mutexMap[name];
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'gcfi-auth',
    lock: customLock,   // ✅ remplace navigator.locks
  }
});

export type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
