import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';

type Step = 'loading' | 'form' | 'success' | 'invalid';

export default function ResetPassword() {
  const navigate  = useNavigate();
  const [step, setStep]         = useState<Step>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    // Supabase émet PASSWORD_RECOVERY quand l'utilisateur arrive
    // depuis le lien de réinitialisation
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('form');
      } else if (event === 'SIGNED_IN' && step === 'loading') {
        // Déjà connecté mais pas depuis un lien de reset
        setStep('invalid');
      }
    });

    // Timeout de sécurité : si aucun événement au bout de 4s → lien invalide
    const timer = setTimeout(() => {
      setStep(prev => prev === 'loading' ? 'invalid' : prev);
    }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep('success');
      // Rediriger vers l'accueil après 3 secondes
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
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
              <p className="text-sm text-slate-500 font-medium">Vérification du lien…</p>
            </div>
          )}

          {/* ── Lien invalide ──────────────────────────────── */}
          {step === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Lien invalide</h2>
              <p className="text-sm text-slate-500 mb-6">Ce lien de réinitialisation est expiré ou invalide. Faites une nouvelle demande.</p>
              <button onClick={() => navigate('/')}
                className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-2xl font-bold text-sm transition-colors">
                Retour à l'accueil
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
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Nouveau mot de passe</h2>
                <p className="text-xs text-slate-500 mt-1.5">Choisissez un mot de passe sécurisé (min. 6 caractères).</p>
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
                  <input type={showPwd ? 'text' : 'password'} placeholder="Nouveau mot de passe"
                    value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type={showPwd ? 'text' : 'password'} placeholder="Confirmer le mot de passe"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required className={inputCls} />
                </div>

                {/* Indicateur de force */}
                {password.length > 0 && (
                  <PasswordStrength password={password} />
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
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
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Mot de passe mis à jour !</h2>
              <p className="text-sm text-slate-500">Vous allez être redirigé vers l'accueil…</p>
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

  const labels = ['Très faible', 'Faible', 'Correct', 'Fort', 'Très fort'];
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