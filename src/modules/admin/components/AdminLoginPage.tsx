'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { isMFAEnabled } from '@/shared/lib/mfa-service';
import MFAVerification from '@/shared/components/MFAVerification';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Role is stored in the profiles table, NOT in app_metadata
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('Accès refusé. Compte administrateur requis.');
      }

      // Check MFA while session is still active
      const mfaActive = await isMFAEnabled(data.user.id);
      if (mfaActive) {
        // Sign out locally to block AuthContext from navigating before MFA is verified
        await supabase.auth.signOut({ scope: 'local' });
        setPendingUserId(data.user.id);
        setRequiresMFA(true);
        setLoading(false);
        return;
      }
      // onAuthStateChange('SIGNED_IN') handles router.push('/admin') after
      // fetchProfile completes — isAdmin is guaranteed true before navigation.
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion.');
      setLoading(false);
    }
  };

  const handleMFASuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      setRequiresMFA(false);
      setPendingUserId(null);
      // onAuthStateChange handles navigation to /admin
    } catch (err: any) {
      setError(err.message || 'Erreur de reconnexion.');
      setRequiresMFA(false);
      setPendingUserId(null);
      setLoading(false);
    }
  };

  const handleMFACancel = async () => {
    setRequiresMFA(false);
    setPendingUserId(null);
    setError(null);
  };

  const inputCls = 'w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-900 dark:text-white transition-all shadow-sm text-sm';

  if (requiresMFA && pendingUserId) {
    return (
      <MFAVerification
        userId={pendingUserId}
        phone=""
        onSuccess={handleMFASuccess}
        onCancel={handleMFACancel}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)]" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--accent)_10%,white)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Connexion Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Accès réservé aux administrateurs GCFI</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="email" placeholder="Email administrateur" value={email}
                onChange={e => setEmail(e.target.value)} required className={inputCls} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type={showPwd ? 'text' : 'password'} placeholder="Mot de passe" value={password}
                onChange={e => setPassword(e.target.value)} required className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg disabled:opacity-50">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
