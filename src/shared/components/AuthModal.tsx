'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, Shield, Mail, Lock, User, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/shared/context/AuthContext';
import { useLang } from '@/shared/context/LanguageContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthModal() {
  const { t } = useLang();
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
          setError(t.auth.error_pwd_mismatch);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        // Si Supabase renvoie déjà une session, l'email n'a pas besoin d'être confirmé
        // avant l'accès (auto-confirmation) — l'utilisateur est déjà connecté, inutile
        // de lui afficher un message qui prétend le contraire.
        if (data.session) {
          close();
        } else {
          setSuccess(t.auth.success_signup);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        close();
      }
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  /* ── Mot de passe oublié ──────────────────────────────────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      // Vérification du rôle et envoi du lien gérés côté serveur —
      // la protection admin ne peut pas être contournée depuis le navigateur.
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.common.error);
      setSuccess(t.auth.success_forgot);
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : String(err)));
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
                  {mode === 'login'  && t.auth.login_title}
                  {mode === 'signup' && t.auth.signup_title}
                  {mode === 'forgot' && t.auth.forgot_title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {mode === 'login'  && t.auth.login_sub}
                  {mode === 'signup' && t.auth.signup_sub}
                  {mode === 'forgot' && t.auth.forgot_sub}
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
                    <input type="email" placeholder={t.auth.forgot_email_placeholder} value={email}
                      onChange={e => setEmail(e.target.value)} required className={inputCls} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg disabled:opacity-50">
                    {loading ? t.auth.sending_text : t.auth.forgot_btn}
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
                        <input type="text" placeholder={t.auth.name_placeholder} value={fullName}
                          onChange={e => setFullName(e.target.value)} required className={inputCls} />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="email" placeholder={t.auth.email_placeholder} value={email}
                        onChange={e => setEmail(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type={showPwd ? 'text' : 'password'} placeholder={t.auth.password_placeholder} value={password}
                        onChange={e => setPassword(e.target.value)} required className={`${inputCls} pr-12`} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {mode === 'signup' && (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type={showPwd ? 'text' : 'password'} placeholder={t.auth.confirm_placeholder}
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
                          {t.auth.forgot_link}
                        </button>
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[color-mix(in_srgb,var(--accent)_15%,transparent)] disabled:opacity-50 mt-2">
                      {loading ? t.auth.loading_text : mode === 'login' ? t.auth.login_btn : t.auth.signup_btn}
                    </button>
                  </form>

                  {/* Séparateur */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-slate-800 px-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        {t.auth.or_continue}
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
                    {t.auth.google_btn}
                  </button>

                  {/* Switch mode */}
                  <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'login' ? t.auth.no_account : t.auth.has_account}
                    <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                      className="ml-1.5 font-bold text-[var(--accent)] hover:underline">
                      {mode === 'login' ? t.auth.switch_signup : t.auth.switch_login}
                    </button>
                  </p>
                </>
              )}

              {/* Retour après succès */}
              {success && (
                <button onClick={() => switchMode('login')}
                  className="w-full mt-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  {t.auth.back_to_login}
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