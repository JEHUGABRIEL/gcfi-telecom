import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '@/shared/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Supabase gère le token automatiquement depuis le fragment URL.
    // On écoute juste l'événement SIGNED_IN.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        setStatus('error');
        setErrorMsg('La connexion a échoué. Réessayez.');
      }
    });

    // Timeout si rien ne se passe
    const timer = setTimeout(() => {
      setStatus(prev => {
        if (prev === 'loading') {
          setErrorMsg('Délai dépassé. Réessayez.');
          return 'error';
        }
        return prev;
      });
    }, 10000);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {status === 'loading' ? (
          <>
            <div className="w-14 h-14 border-4 border-slate-100 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-5" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Connexion en cours…</p>
            <p className="text-xs text-slate-400 mt-1">Vous allez être redirigé automatiquement.</p>
          </>
        ) : (
          <>
            <p className="text-red-500 font-bold mb-4">{errorMsg}</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold text-sm hover:bg-[var(--accent-hover)] transition-colors">
              Retour à l'accueil
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}