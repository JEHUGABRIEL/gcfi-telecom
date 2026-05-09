import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const mounted = React.useRef(true);
  const isFetchingProfile = React.useRef(false); // ✅ guard anti-concurrence StrictMode

  useEffect(() => {
    mounted.current = true;

    const timeout = setTimeout(() => {
      if (mounted.current) {
        setLoading(prev => { if (prev) logError('Auth', 'Safety timeout'); return false; });
      }
    }, 15000);

    // ✅ onAuthStateChange seul — supprime le NavigatorLockAcquireTimeoutError
    // getSession() supprimé : il concurrençait onAuthStateChange sur le lock IndexedDB
    // onAuthStateChange fire avec INITIAL_SESSION au mount → session courante disponible immédiatement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted.current) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
        setPendingAction(prev => { if (prev) { prev(); setShowAuthModal(false); } return null; });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => { mounted.current = false; subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  async function fetchProfile(uid: string, currentUser?: SupabaseUser) {
    // ✅ Empêche deux fetchProfile simultanés (React 18 StrictMode double-mount)
    if (isFetchingProfile.current) return;
    isFetchingProfile.current = true;
    try {
      // ✅ Colonnes explicites (évite 400 sur colonnes inexistantes)
      // ✅ maybeSingle() → retourne null au lieu de 406 si aucune ligne
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        logError('fetchProfile/select', error);
        return;
      }

      if (!data) {
        // Pas de ligne en DB → profil temporaire depuis les métadonnées auth
        // (évite le 403 RLS — l'INSERT est géré par le trigger SQL côté Supabase)
        const fallback: Profile = {
          id: uid,
          email: currentUser?.email ?? '',
          full_name: currentUser?.user_metadata?.full_name
                  ?? currentUser?.user_metadata?.name
                  ?? 'Utilisateur',
          role: 'client',
          avatar_url: currentUser?.user_metadata?.avatar_url ?? null,
        };
        setProfile(fallback);
        setIsAdmin(false);
      } else {
        setProfile(data as Profile);
        setIsAdmin(data.role === 'admin' || data.role === 'superadmin');
      }
    } catch (err) {
      logError('fetchProfile', err);
    } finally {
      isFetchingProfile.current = false; // ✅ libérer le guard
      if (mounted.current) setLoading(false);
    }
  }

  // ✅ signOut robuste — fonctionne même si Supabase est lent
  const signOut = async () => {
    try {
      // Vider l'état local immédiatement sans attendre Supabase
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setShowSignOutModal(false);

      // Nettoyer le localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('gcfi-auth')) {
          localStorage.removeItem(key);
        }
      });

      // Appeler Supabase en arrière-plan (ne pas attendre)
      supabase.auth.signOut().catch(err => logError('signOut', err));

      // Rediriger immédiatement
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
