import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, Shield, Mail, Lock, User, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/shared/context/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal } = useAuth();
  const [mode, setMode]           = useState<AuthMode>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [fullName, setFullName]   = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [confirm, setConfirm]     = useState('');

  const reset = () => {
    setError(null); setSuccess(null);
    setEmail(''); setPassword(''); setFullName(''); setConfirm('');
    setShowPwd(false);
  };

  const switchMode = (next: AuthMode) => { reset(); setMode(next); };

  const close = () => { setShowAuthModal(false); setTimeout(() => switchMode('login'), 300); };

  /* ── Google OAuth ─────────────────────────────────────────── */
  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setError(error.message);
  };

  /* ── Email / Mot de passe ─────────────────────────────────── */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (mode === 'signup') {
        if (password !== confirm) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setSuccess('Compte créé ! Vérifiez votre boîte email pour confirmer votre adresse.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        close();
      }
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  /* ── Mot de passe oublié ──────────────────────────────────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      // ✅ Vérifier si le compte est admin — les admins ne peuvent pas réinitialiser eux-mêmes
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .maybeSingle();

      if (profile?.role === 'admin' || profile?.role === 'superadmin') {
        setError('Les comptes administrateurs ne peuvent pas réinitialiser leur mot de passe via ce formulaire. Contactez jehubin@gmail.com.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      if (error) throw error;
      setSuccess('Lien envoyé ! Consultez votre boîte email pour réinitialiser votre mot de passe.');
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm text-sm';

  return (
    <AnimatePresence>
      {showAuthModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Bande bleue en haut */}
            <div className="h-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]" />

            <div className="p-8">
              {/* Bouton fermer */}
              <button onClick={close} className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>

              {/* Bouton retour (forgot) */}
              {mode === 'forgot' && (
                <button onClick={() => switchMode('login')} className="absolute top-6 left-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {/* ── En-tête ──────────────────────────────────── */}
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-[color-mix(in_srgb,var(--accent)_8%,white)] dark:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {mode === 'login'  && <LogIn    className="w-7 h-7 text-[var(--accent)]" />}
                  {mode === 'signup' && <UserPlus className="w-7 h-7 text-[var(--accent)]" />}
                  {mode === 'forgot' && <Mail     className="w-7 h-7 text-[var(--accent)]" />}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {mode === 'login'  && 'Connexion'}
                  {mode === 'signup' && 'Créer un compte'}
                  {mode === 'forgot' && 'Mot de passe oublié'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {mode === 'login'  && 'Accédez à votre espace GCFI.'}
                  {mode === 'signup' && 'Rejoignez la communauté GCFI.'}
                  {mode === 'forgot' && 'Entrez votre email pour recevoir un lien de réinitialisation.'}
                </p>
              </div>

              {/* ── Succès ───────────────────────────────────── */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">{success}</p>
                </div>
              )}

              {/* ── Erreur ───────────────────────────────────── */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3">
                  <Shield className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* ── Formulaire Forgot ─────────────────────────── */}
              {mode === 'forgot' && !success && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input type="email" placeholder="Votre adresse email" value={email}
                      onChange={e => setEmail(e.target.value)} required className={inputCls} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg disabled:opacity-50">
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </form>
              )}

              {/* ── Formulaire Login / Signup ─────────────────── */}
              {(mode === 'login' || mode === 'signup') && !success && (
                <>
                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    {mode === 'signup' && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Nom complet" value={fullName}
                          onChange={e => setFullName(e.target.value)} required className={inputCls} />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="email" placeholder="Email" value={email}
                        onChange={e => setEmail(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type={showPwd ? 'text' : 'password'} placeholder="Mot de passe" value={password}
                        onChange={e => setPassword(e.target.value)} required className={`${inputCls} pr-12`} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {mode === 'signup' && (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type={showPwd ? 'text' : 'password'} placeholder="Confirmer le mot de passe"
                          value={confirm} onChange={e => setConfirm(e.target.value)} required
                          className={`${inputCls} pr-12 ${confirm && confirm !== password ? 'ring-2 ring-red-400' : confirm && confirm === password ? 'ring-2 ring-green-400' : ''}`} />
                        {confirm && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold">
                            {confirm === password ? '✅' : '❌'}
                          </span>
                        )}
                      </div>
                    )}

                    {mode === 'login' && (
                      <div className="text-right">
                        <button type="button" onClick={() => switchMode('forgot')}
                          className="text-xs font-semibold text-[var(--accent)] hover:underline">
                          Mot de passe oublié ?
                        </button>
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[color-mix(in_srgb,var(--accent)_15%,transparent)] disabled:opacity-50 mt-2">
                      {loading ? 'Traitement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                    </button>
                  </form>

                  {/* Séparateur */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-slate-800 px-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Ou continuer avec
                      </span>
                    </div>
                  </div>

                  {/* Google */}
                  <button onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[var(--accent)]/40 hover:shadow-md transition-all text-sm font-semibold text-slate-700 dark:text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuer avec Google
                  </button>

                  {/* Switch mode */}
                  <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'login' ? "Pas encore de compte ?" : "Déjà inscrit ?"}
                    <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                      className="ml-1.5 font-bold text-[var(--accent)] hover:underline">
                      {mode === 'login' ? "S'inscrire" : "Se connecter"}
                    </button>
                  </p>
                </>
              )}

              {/* Retour après succès */}
              {success && (
                <button onClick={() => switchMode('login')}
                  className="w-full mt-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Retour à la connexion
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Traduction des erreurs Supabase ──────────────────────────── */
function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))         return 'Confirmez votre email avant de vous connecter.';
  if (msg.includes('User already registered'))     return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('rate limit'))                  return 'Trop de tentatives. Réessayez dans quelques minutes.';
  return msg;
}