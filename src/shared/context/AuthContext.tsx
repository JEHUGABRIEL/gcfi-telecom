'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted.current) return;
        const currentUser = session?.user ?? null;
        // Reject sessions for users who haven't confirmed their email yet
        if (currentUser && !currentUser.email_confirmed_at) {
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        setUser(currentUser);
        if (currentUser) await fetchProfile(currentUser.id, currentUser);
        else setLoading(false);
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
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        const isAdminUser = await fetchProfile(currentUser.id, currentUser);

        // Redirect admin/superadmin to the dashboard on sign-in.
        // We check the event so we only redirect on an actual login action,
        // not on every page load with an existing session.
        if (event === 'SIGNED_IN' && isAdminUser && mounted.current) {
          router.push('/admin');
          return;
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
          await supabase.auth.signOut();
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

      // MUST await: the session cookie must be cleared before the redirect,
      // otherwise the middleware still sees a valid session and sends the
      // user straight back to their previous page.
      await supabase.auth.signOut();

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
      {/* ✅ Modal de confirmation de déconnexion */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSignOutModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Se déconnecter ?</h3>
            <p className="text-sm text-slate-500 mb-6">Vous devrez vous reconnecter pour accéder à votre compte.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={signOut}
                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}