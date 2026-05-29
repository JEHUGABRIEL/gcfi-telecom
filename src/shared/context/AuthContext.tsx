'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';
import { supabase, SupabaseUser } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'client' | 'admin' | 'superadmin';
  avatar_url: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  requireAuth: (callback: () => void) => void;
  setShowAuthModal: (show: boolean) => void;
  showAuthModal: boolean;
  showSignOutModal: boolean;
  setShowSignOutModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const mounted = React.useRef(true);

  useEffect(() => {
    mounted.current = true;

    const timeout = setTimeout(() => {
      if (mounted.current) {
        setLoading(prev => { if (prev) logError('Auth', 'Safety timeout'); return false; });
      }
    }, 15000);

    async function initializeAuth() {
      try {
        // getUser() validates the JWT token server-side on every load,
        // unlike getSession() which only reads from local cache.
        // This prevents "zombie sessions" persisting after signOut.
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!mounted.current) return;
        if (error || !user) { setLoading(false); return; }
        // Reject sessions for users who haven't confirmed their email yet
        if (!user.email_confirmed_at) {
          await supabase.auth.signOut({ scope: 'global' });
          setLoading(false);
          return;
        }
        setUser(user);
        await fetchProfile(user.id, user);
      } catch (err) {
        logError('Auth init', err);
        if (mounted.current) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      const currentUser = session?.user ?? null;

      // Block sessions for users who signed up but haven't confirmed their email yet.
      if (currentUser && !currentUser.email_confirmed_at) {
        await supabase.auth.signOut({ scope: 'global' });
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        const isAdminUser = await fetchProfile(currentUser.id, currentUser);

        if (isAdminUser && mounted.current) {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
          // On fresh login: always redirect admin to dashboard.
          // On page load with existing session: redirect only if admin
          // landed on a public page (home, profil, admin-login),
          // not if they're intentionally browsing the catalogue.
          const redirectPaths = ['/', '/profil', '/admin-login'];
          const shouldRedirect =
            event === 'SIGNED_IN' ||
            (event === 'INITIAL_SESSION' && redirectPaths.includes(currentPath));

          if (shouldRedirect) {
            router.push('/admin');
            return;
          }
        }

        setPendingAction(prev => { if (prev) { prev(); setShowAuthModal(false); } return null; });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => { mounted.current = false; subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  // Returns true if the resolved profile has admin/superadmin role.
  async function fetchProfile(uid: string, currentUser?: SupabaseUser): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();

      if (error && error.code === 'PGRST116') {
        const actualUser = currentUser;
        if (actualUser) {
          const { data: newProfile } = await supabase.from('profiles').insert([{
            id: uid,
            email: actualUser.email,
            full_name: actualUser.user_metadata?.full_name || 'Utilisateur',
            role: 'client'
          }]).select().single();
          if (newProfile) { setProfile(newProfile as Profile); setIsAdmin(false); }
        }
        return false;
      } else if (data) {
        // ✅ Vérifier si l'utilisateur est bloqué
        const profileData = data as Profile & { is_blocked?: boolean; blocked_until?: string };
        const isBlockedPerm = profileData.is_blocked === true;
        const isBlockedTemp = !!profileData.blocked_until && new Date(profileData.blocked_until) > new Date();

        if (isBlockedPerm || isBlockedTemp) {
          await supabase.auth.signOut({ scope: 'global' });
          setUser(null); setProfile(null); setIsAdmin(false);
          window.dispatchEvent(new CustomEvent('gcfi:user-blocked', {
            detail: { permanent: isBlockedPerm, until: profileData.blocked_until }
          }));
          return false;
        }

        setProfile(data as Profile);
        const admin = data.role === 'admin' || data.role === 'superadmin';
        setIsAdmin(admin);
        return admin;
      }
    } catch (err) {
      logError('fetchProfile', err);
    } finally {
      if (mounted.current) setLoading(false);
    }
    return false;
  }

  // ✅ Auto-logout admin après 15 minutes d'inactivité
  const ADMIN_TIMEOUT_MS = 15 * 60 * 1000; // 15 min
  const adminTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAdminTimer = React.useCallback(() => {
    if (!mounted.current) return;
    if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
    // On vérifie isAdmin via ref pour éviter les dépendances cycliques
  }, []);

  React.useEffect(() => {
    if (!isAdmin) {
      if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
      return;
    }

    const startTimer = () => {
      if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
      adminTimerRef.current = setTimeout(() => {
        if (mounted.current) {
          signOut();
        }
      }, ADMIN_TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handler = () => startTimer();

    events.forEach(e => document.addEventListener(e, handler, { passive: true }));
    startTimer(); // Démarrer dès la connexion admin

    return () => {
      events.forEach(e => document.removeEventListener(e, handler));
      if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
    };
  }, [isAdmin]);

  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setShowSignOutModal(false);

      // Clear localStorage session keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('gcfi-auth')) {
          localStorage.removeItem(key);
        }
      });

      // scope: 'global' revokes the refresh token server-side, not just
      // locally. Without this, Supabase restores the session on the next
      // page load via getUser() because the server-side token is still valid.
      await supabase.auth.signOut({ scope: 'global' });

      window.location.replace('/');
    } catch (err) {
      logError('signOut', err);
      window.location.replace('/');
    }
  };

  const requireAuth = (callback: () => void) => {
    if (user) callback();
    else { setPendingAction(() => callback); setShowAuthModal(true); }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, isAdmin, loading, signOut, requireAuth,
      showAuthModal, setShowAuthModal,
      showSignOutModal, setShowSignOutModal
    }}>
      {children}
      {/* Modal de confirmation de déconnexion */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSignOutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{    opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Se déconnecter ?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
                Vous devrez vous reconnecter pour accéder à votre compte.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={signOut}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Déconnecter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}