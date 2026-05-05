import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Superadmin ────────────────────────────────────────────
// Credentials stockés côté client (static hosting sans backend)
// Changer le mot de passe ici pour modifier l'accès admin
const ADMIN_EMAIL    = 'jehubin@gmail.com';
const ADMIN_PASSWORD = 'Sol!Admin2026';
const AUTH_KEY       = 'sol_admin_session';

interface AuthContextType {
  isAdmin:     boolean;
  isLoading:   boolean;
  login:       (email: string, password: string) => Promise<boolean>;
  logout:      () => void;
  adminEmail:  string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restaure la session au chargement
  useEffect(() => {
    try {
      const session = localStorage.getItem(AUTH_KEY);
      if (session) {
        const { email, expiry } = JSON.parse(session);
        if (email === ADMIN_EMAIL && Date.now() < expiry) {
          setIsAdmin(true);
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simule un délai réseau réaliste
    await new Promise(r => setTimeout(r, 600));

    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Session valide 8 heures
      const session = { email: ADMIN_EMAIL, expiry: Date.now() + 8 * 60 * 60 * 1000 };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, login, logout, adminEmail: ADMIN_EMAIL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
