'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useLang } from '@/shared/context/LanguageContext';
import { RECOVERY_FLAG } from '@/shared/components/RecoveryRedirect';

type Step = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPassword() {
  const { t } = useLang();
  const c = t.common;
  const router = useRouter();
  const [step, setStep]         = useState<Step>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  // Destination après changement réussi : un admin repart vers sa console,
  // pas vers la vitrine publique.
  const [destination, setDestination] = useState('/');

  useEffect(() => {
    // On arrive d'un lien de réinitialisation si le fragment le dit, ou si
    // RecoveryRedirect l'a signalé avant de nous rediriger ici.
    let flagged = window.location.hash.includes('type=recovery');
    try {
      if (sessionStorage.getItem(RECOVERY_FLAG) === '1') {
        flagged = true;
        sessionStorage.removeItem(RECOVERY_FLAG);
      }
    } catch {
      // Stockage indisponible — on s'en tient au fragment.
    }

    // Supabase émet PASSWORD_RECOVERY quand l'utilisateur arrive
    // depuis le lien de réinitialisation
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('form');
      } else if (event === 'SIGNED_IN' && !flagged) {
        // Déjà connecté mais pas depuis un lien de reset
        setStep(prev => (prev === 'loading' ? 'invalid' : prev));
      }
    });

    // L'événement peut avoir été émis avant notre montage : le client Supabase
    // consomme le fragment dès qu'il est sollicité, y compris sur une autre
    // page. On rattrape ce cas en interrogeant directement la session.
    if (flagged) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setStep(prev => (prev === 'loading' ? 'form' : prev));
      });
    }

    // Timeout de sécurité : si aucun événement au bout de 4s → lien invalide
    const timer = setTimeout(() => {
      setStep(prev => prev === 'loading' ? 'invalid' : prev);
    }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  // La redirection vit dans un effet : l'ancien `setTimeout` était posé dans
  // le gestionnaire de soumission et son `return () => clearTimeout(...)`
  // n'était jamais appelé — React n'attend pas de fonction de nettoyage d'un
  // handler. Le minuteur survivait donc au démontage du composant.
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => router.push(destination), 3000);
    return () => clearTimeout(timer);
  }, [step, destination, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(c.reset_pwd_error_mismatch);
      return;
    }
    if (password.length < 6) {
      setError(c.reset_pwd_error_short);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Le rôle décide de la destination. La lecture ne doit pas pouvoir
      // faire échouer un changement de mot de passe déjà effectué : en cas
      // de problème on retombe simplement sur l'accueil.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          const role = (profile as { role?: string } | null)?.role;
          if (role === 'admin' || role === 'superadmin') setDestination('/admin');
        }
      } catch {
        // Destination inchangée : accueil.
      }

      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]" />
        <div className="p-8">

          {/* ── Chargement ────────────────────────────────── */}
          {step === 'loading' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-500 font-medium">{c.reset_pwd_checking}</p>
            </div>
          )}

          {/* ── Lien invalide ──────────────────────────────── */}
          {step === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">{c.reset_pwd_invalid_title}</h2>
              <p className="text-sm text-slate-500 mb-6">{c.reset_pwd_invalid_text}</p>
              <button onClick={() => router.push('/')}
                className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-2xl font-bold text-sm transition-colors">
                {c.reset_pwd_back_home}
              </button>
            </div>
          )}

          {/* ── Formulaire ─────────────────────────────────── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-[color-mix(in_srgb,var(--accent)_8%,white)] dark:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{c.reset_pwd_form_title}</h2>
                <p className="text-xs text-slate-500 mt-1.5">{c.reset_pwd_form_subtitle}</p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl flex items-center gap-3">
                  <Shield className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type={showPwd ? 'text' : 'password'} placeholder={c.reset_pwd_password_placeholder}
                    value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type={showPwd ? 'text' : 'password'} placeholder={c.reset_pwd_confirm_placeholder}
                    value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputCls} />
                </div>

                {/* Indicateur de force */}
                {password.length > 0 && (
                  <PasswordStrength password={password} />
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg disabled:opacity-50">
                  {loading ? c.reset_pwd_loading : c.reset_pwd_submit}
                </button>
              </form>
            </>
          )}

          {/* ── Succès ─────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-7 h-7 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">{c.reset_pwd_success_title}</h2>
              <p className="text-sm text-slate-500">
                {destination === '/admin' ? c.reset_pwd_success_text_admin : c.reset_pwd_success_text}
              </p>
              <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-[var(--accent)] rounded-full"
                />
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

/* ── Indicateur de force du mot de passe ──────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const { t } = useLang();
  const labels = t.common.reset_pwd_strength_labels as unknown as string[];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500'];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-slate-100'}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-500' : 'text-green-500'}`}>
        {labels[score]}
      </p>
    </div>
  );
}