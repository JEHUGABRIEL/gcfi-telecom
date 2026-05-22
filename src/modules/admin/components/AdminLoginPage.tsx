import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import GcfiLogo from '@/shared/components/GcfiLogo';

const SUPERADMIN_EMAIL = 'jehubin@gmail.com';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Connexion Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // 2. Vérifier le rôle directement depuis user_metadata ou profiles
      //    On interroge profiles avec la session fraîche
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const role = profile?.role;

      // Superadmin identifié par email en fallback si profil non encore créé
      const isSuperAdminEmail = data.user.email === 'jehubin@gmail.com';

      if (role !== 'admin' && role !== 'superadmin' && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        setError('Accès refusé. Ce formulaire est réservé aux administrateurs GCFI.');
        setLoading(false);
        return;
      }

      // 3. Succès → AdminRoute vérifiera isAdmin côté AuthContext
      navigate('/admin', { replace: true });

    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Email non confirmé. Vérifiez votre boîte email.');
      } else {
        setError(msg || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C1272D] text-white placeholder-slate-500 text-sm transition-all';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Fond géométrique subtil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C1272D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#C1272D] rounded-2xl flex items-center justify-center shadow-xl shadow-[#C1272D]/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-lg leading-none">GCFI</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Administration</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Accès réservé aux administrateurs autorisés
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl">
          {/* Barre rouge en haut */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#C1272D] rounded-full" />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-2xl flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="Email administrateur"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                className={inputCls}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C1272D] hover:opacity-90 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#C1272D]/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Vérification...' : 'Accéder au panel'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600">
              Utilisateur régulier ?{' '}
              <a href="/" className="text-slate-400 hover:text-white transition-colors font-bold">
                Retour au site
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          GCFI Centrafrique — Accès sécurisé • {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}