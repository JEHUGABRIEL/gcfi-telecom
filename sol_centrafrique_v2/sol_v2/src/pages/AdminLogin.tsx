import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Adresse email invalide.'); return;
    }
    if (password.length < 6) {
      setError('Mot de passe trop court (6 caractères min.).'); return;
    }

    setIsLoading(true);
    const ok = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (ok) {
      navigate('/admin', { replace: true });
    } else {
      setError('Email ou mot de passe incorrect. Accès réservé au superadmin.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-neutral flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/10 p-10 border border-gray-100">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="relative inline-flex">
              <div className="bg-brand-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-brand-primary/30">
                <Sun className="h-10 w-10 text-brand-secondary" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-brand-secondary w-7 h-7 rounded-lg flex items-center justify-center shadow-md">
                <Lock className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-brand-secondary mt-6 tracking-tight">
              Espace Admin
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm font-medium">
              SOL! Centrafrique — Accès réservé
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                Email administrateur
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-brand-neutral border-2 border-transparent pl-11 pr-4 py-4 rounded-xl text-sm font-medium outline-none
                    focus:border-brand-primary focus:bg-white transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-brand-neutral border-2 border-transparent pl-11 pr-12 py-4 rounded-xl text-sm font-medium outline-none
                    focus:border-brand-primary focus:bg-white transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 px-4 py-3.5 rounded-xl text-sm font-bold flex items-center gap-3 border border-red-100"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-secondary text-white font-black py-4 rounded-xl
                hover:scale-[1.02] active:scale-[0.98] transition-all
                shadow-xl shadow-brand-secondary/25
                flex items-center justify-center gap-3
                disabled:opacity-60 disabled:scale-100
                text-sm tracking-wide mt-2"
            >
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification...</>
                : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-8 font-medium">
            Accès exclusivement réservé à l'administrateur de SOL! Centrafrique.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
