import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { generateMFACode, sendMFAViaWhatsApp, getUserMFASettings } from '@/shared/lib/mfa-service';
import MFAVerification from '@/shared/components/MFAVerification';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // ✅ NOUVEAU : MFA state
  const [mfaPending, setMFAPending] = React.useState(false);
  const [mfaUserId, setMFAUserId] = React.useState<string | null>(null);
  const [mfaPhone, setMFAPhone] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Erreur de connexion');
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Impossible de récupérer les infos utilisateur');
        setLoading(false);
        return;
      }

      // ✅ NOUVEAU : Vérifier si MFA est activé
      const mfaSettings = await getUserMFASettings(data.user.id);
      
      if (mfaSettings?.enabled && mfaSettings?.phone) {
        // Générer et envoyer code MFA
        const code = await generateMFACode(data.user.id);
        await sendMFAViaWhatsApp(mfaSettings.phone, code);
        
        setMFAPending(true);
        setMFAUserId(data.user.id);
        setMFAPhone(mfaSettings.phone);
        setLoading(false);
      } else {
        // Pas de MFA → login direct
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur serveur');
      setLoading(false);
    }
  };

  if (mfaPending && mfaUserId && mfaPhone) {
    return (
      <MFAVerification
        userId={mfaUserId}
        phone={mfaPhone}
        onSuccess={() => navigate('/admin', { replace: true })}
        onCancel={() => {
          setMFAPending(false);
          setMFAUserId(null);
          setMFAPhone(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#C1272D] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Accès Admin</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">GCFI Telecom</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="admin@gcfi-rca.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D] text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#C1272D] text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C1272D] hover:bg-[#1E4D8C] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}