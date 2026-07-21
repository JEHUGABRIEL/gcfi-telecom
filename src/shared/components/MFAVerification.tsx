'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Lock, ArrowRight } from 'lucide-react';
import { useLang } from '@/shared/context/LanguageContext';

interface MFAVerificationProps {
  userId: string;
  phone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFAVerification({ userId, phone, onSuccess, onCancel }: MFAVerificationProps) {
  const { t } = useLang();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t.mfa_verification.invalid_code);
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Vérification côté serveur — le secret TOTP ne transite jamais dans le navigateur.
      const res = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: code }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.mfa_verification.incorrect_code);
        setCode('');
      }
    } catch {
      setError(t.mfa_verification.error_verify);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
      >
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
          {t.mfa_verification.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          {t.mfa_verification.instruction} <span className="font-bold">Google Authenticator</span> ou <span className="font-bold">Authy</span>
        </p>

        <div className="space-y-4 mb-6">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
            {t.mfa_verification.code_label}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            placeholder={t.mfa_verification.code_placeholder}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={verifying}
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            {t.mfa_verification.cancel}
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifying ? t.mfa_verification.verifying : <>{t.mfa_verification.verify} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          {t.mfa_verification.renew}
        </p>
      </motion.div>
    </div>
  );
}