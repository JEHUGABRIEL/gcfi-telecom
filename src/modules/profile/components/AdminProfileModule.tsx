'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Mail, BadgeCheck, KeyRound, Lock, Camera, Loader2, Save,
  CheckCircle2, XCircle, X, RefreshCw, Shield,
} from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { useLang } from '@/shared/context/LanguageContext';
import { useNotifications } from '@/shared/context/NotificationContext';
import { supabase } from '@/shared/lib/supabase';
import {
  isMFAEnabled, setupTOTP, verifyTOTPCode, enableMFAForUser, disableMFAForUser,
} from '@/shared/lib/mfa-service';
import { uploadToCloudinary } from '@/shared/lib/cloudinary';
import { checkRateLimit, recordUpload } from '@/shared/lib/rate-limiter';
import { cn } from '@/shared/lib/utils';

/**
 * Page « Mon Profil » pour les admins / superadmins.
 *
 * Volontairement très différente du profil client : pas de commandes, de
 * wishlist ni de dashboard e-commerce. On y gère uniquement l'identité, la
 * photo et la sécurité (dont le MFA TOTP). Layout « console » mais sensible
 * au thème (clair / sombre).
 */
export default function AdminProfileModule() {
  const { t } = useLang();
  const { user, profile, refreshProfile, setShowSignOutModal } = useAuth();
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [fullName, setFullName] = React.useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = React.useState(false);
  const [nameStatus, setNameStatus] = React.useState<'success' | 'error' | null>(null);

  const [avatar, setAvatar] = React.useState(profile?.avatar_url ?? '');
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarStatus, setAvatarStatus] = React.useState<'success' | 'error' | null>(null);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // ── MFA ──
  const [mfaEnabled, setMfaEnabled] = React.useState<boolean | null>(null);
  const [mfaStep, setMfaStep] = React.useState<'idle' | 'setup' | 'disable'>('idle');
  const [mfaQr, setMfaQr] = React.useState('');
  const [mfaSecret, setMfaSecret] = React.useState('');
  const [mfaCode, setMfaCode] = React.useState('');
  const [mfaBusy, setMfaBusy] = React.useState(false);
  const [mfaError, setMfaError] = React.useState<string | null>(null);

  const ap = t.admin_page;
  const mv = t.mfa_verification;

  // Synchroniser les champs quand le profil (re)charge.
  React.useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setAvatar(profile.avatar_url ?? '');
  }, [profile?.id, profile?.full_name, profile?.avatar_url]);

  // Charger l'état MFA.
  React.useEffect(() => {
    if (!user) return;
    let active = true;
    isMFAEnabled(user.id)
      .then(enabled => { if (active) setMfaEnabled(enabled); })
      .catch(() => { if (active) setMfaEnabled(false); });
    return () => { active = false; };
  }, [user?.id]);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  // ── Photo ──
  const handleAvatarFile = async (file: File) => {
    setAvatarStatus(null);
    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError(t.image_upload.file_not_supported);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`${t.image_upload.file_too_large} 5 Mo.`);
      return;
    }
    const uid = user?.id ?? 'anonymous';
    const { allowed, reason } = await checkRateLimit(uid);
    if (!allowed) {
      setAvatarError(reason || t.image_upload.too_many_uploads);
      return;
    }
    setAvatarUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'gcfi/avatars');
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: result.secure_url })
        .eq('id', uid);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: result.secure_url } });
      await refreshProfile();
      setAvatar(result.secure_url);
      setAvatarStatus('success');
    } catch (err) {
      setAvatarStatus('error');
      setAvatarError(err instanceof Error ? err.message : t.image_upload.upload_failed);
      console.error('[AdminProfileModule] avatar upload failed:', err);
      addNotification({ title: t.image_upload.upload_failed, message: err instanceof Error ? err.message : t.common.error, type: 'info' });
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Identité ──
  const handleSaveName = async () => {
    if (!user || fullName.trim().length < 2) return;
    setSavingName(true);
    setNameStatus(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim().slice(0, 100) })
        .eq('id', user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      await refreshProfile();
      setNameStatus('success');
      addNotification({ title: t.admin_page.users_toast_profile_updated, message: ap.admin_profile_identity, type: 'info' });
    } catch {
      setNameStatus('error');
    } finally {
      setSavingName(false);
    }
  };

  // ── MFA : démarrage de l'activation ──
  const startMFASetup = async () => {
    if (!user) return;
    setMfaBusy(true);
    setMfaError(null);
    setMfaCode('');
    try {
      const { qrCode, secret } = await setupTOTP(user.id, user.email ?? '');
      setMfaQr(qrCode);
      setMfaSecret(secret);
      setMfaStep('setup');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : ap.mfa_error_generic);
    } finally {
      setMfaBusy(false);
    }
  };

  // ── MFA : vérifier le code puis activer ──
  const verifyAndEnable = async () => {
    if (!user || mfaCode.length !== 6) {
      setMfaError(mv.invalid_code);
      return;
    }
    setMfaBusy(true);
    setMfaError(null);
    try {
      const valid = await verifyTOTPCode(user.id, mfaCode);
      if (!valid) {
        setMfaError(mv.incorrect_code);
        setMfaCode('');
        return;
      }
      await enableMFAForUser(user.id);
      setMfaEnabled(true);
      setMfaStep('idle');
      addNotification({ title: t.admin_page.users_toast_profile_updated, message: ap.mfa_setup_toast, type: 'info' });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : ap.mfa_error_generic);
    } finally {
      setMfaBusy(false);
    }
  };

  // ── MFA : désactivation ──
  const confirmDisable = async () => {
    if (!user || mfaCode.length !== 6) {
      setMfaError(mv.invalid_code);
      return;
    }
    setMfaBusy(true);
    setMfaError(null);
    try {
      const valid = await verifyTOTPCode(user.id, mfaCode);
      if (!valid) {
        setMfaError(mv.incorrect_code);
        setMfaCode('');
        return;
      }
      await disableMFAForUser(user.id);
      setMfaEnabled(false);
      setMfaStep('idle');
      addNotification({ title: t.admin_page.users_toast_profile_updated, message: ap.mfa_disabled_toast, type: 'info' });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : ap.mfa_error_generic);
    } finally {
      setMfaBusy(false);
    }
  };

  if (!isAdmin) return null;

  const initials = (profile?.full_name || user?.email || 'A').charAt(0).toUpperCase();
  const roleLabel = profile?.role ?? 'admin';

  // Classes sensibles au thème : base claire, variantes sombres.
  const card = 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-8';
  const sectionTitle = 'text-xs font-black uppercase tracking-[0.2em] text-[#C1272D] dark:text-[#ff6b6b] mb-6 flex items-center gap-2';
  const muted = 'text-slate-500 dark:text-slate-400';
  const subCard = 'rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60';

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24">

        {/* ── Barre d'actions (fermer) ── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t.profile_page.my_profile}
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" /> {ap.admin_profile_close}
          </button>
        </div>

        {/* ── Carte identité ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(card, 'overflow-hidden')}
        >
          <div className="h-1.5 -mx-8 -mt-8 mb-8 bg-linear-to-r from-[#C1272D] via-red-500 to-amber-400" />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              {avatar ? (
                <Image src={avatar} alt={profile?.full_name ?? ''} fill
                  className="object-cover rounded-2xl ring-2 ring-[#C1272D]/60" sizes="96px" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-[#C1272D] flex items-center justify-center ring-2 ring-[#C1272D]/60">
                  <span className="text-3xl font-black text-white">{initials}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title={ap.admin_profile_photo}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center shadow hover:bg-[#C1272D] hover:border-[#C1272D] hover:text-white transition-colors disabled:opacity-60"
              >
                {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = ''; }}
              />
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C1272D]/10 dark:bg-[#C1272D]/15 text-[#C1272D] dark:text-[#ff6b6b] text-[10px] font-black uppercase tracking-widest border border-[#C1272D]/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> {roleLabel}
                </span>
                {mfaEnabled !== null && (
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
                    mfaEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  )}>
                    {mfaEnabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    2FA {mfaEnabled ? ap.admin_profile_mfa_on : ap.admin_profile_mfa_off}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white truncate">{ap.admin_profile_title}</h1>
              <p className={cn('text-sm mt-1', muted)}>{ap.admin_profile_sub}</p>
            </div>
          </div>

          {avatarError && (
            <p className="mt-4 text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-1.5">
              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {avatarError}
            </p>
          )}
          {avatarStatus === 'success' && (
            <p className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.admin_page.users_toast_profile_updated}
            </p>
          )}
        </motion.div>

        {/* ── Identité (nom) ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn('mt-6', card)}
        >
          <h2 className={sectionTitle}>
            <BadgeCheck className="w-4 h-4" /> {ap.admin_profile_identity}
          </h2>

          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            {t.admin_page.users_field_name}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setNameStatus(null); }}
              maxLength={100}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#C1272D] focus:ring-2 focus:ring-[#C1272D]/30 transition-all"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || fullName.trim().length < 2 || fullName === profile?.full_name}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C1272D] text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t.admin_page.btn_save}
            </button>
          </div>
          {nameStatus === 'success' && <p className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {t.admin_page.users_toast_profile_updated}</p>}
          {nameStatus === 'error' && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> {t.common.error}</p>}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{ap.admin_profile_email}</p>
            <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium break-all">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" /> {user?.email}
            </p>
          </div>
        </motion.section>

        {/* ── Sécurité / MFA ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn('mt-6', card)}
        >
          <h2 className={sectionTitle}>
            <KeyRound className="w-4 h-4" /> {ap.admin_profile_security}
          </h2>

          <div className={cn('flex flex-col sm:flex-row items-start justify-between gap-4 p-4', subCard)}>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> {ap.admin_profile_mfa}
              </p>
              <p className={cn('text-xs mt-1', muted)}>{ap.admin_profile_mfa_sub}</p>
            </div>
            <span className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest',
              mfaEnabled === null
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                : mfaEnabled
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            )}>
              {mfaEnabled === null ? '…' : mfaEnabled ? ap.admin_profile_mfa_on : ap.admin_profile_mfa_off}
            </span>
          </div>

          {/* Actions MFA */}
          {mfaEnabled !== null && mfaStep === 'idle' && (
            <div className="mt-4">
              {mfaEnabled ? (
                <button
                  onClick={() => { setMfaCode(''); setMfaError(null); setMfaStep('disable'); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-red-300 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Lock className="w-4 h-4" /> {ap.mfa_disable}
                </button>
              ) : (
                <button
                  onClick={startMFASetup}
                  disabled={mfaBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#C1272D] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" /> {ap.mfa_setup_enable}
                </button>
              )}
            </div>
          )}

          {/* Flux d'activation */}
          <AnimatePresence mode="wait">
            {mfaStep === 'setup' && (
              <motion.div
                key="mfa-setup"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-6"
              >
                <div className={cn('flex flex-col sm:flex-row gap-6 p-5', subCard)}>
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    {mfaQr ? (
                      <div className="w-44 h-44 bg-white rounded-2xl p-2 border border-slate-200 dark:border-slate-700">
                        <Image src={mfaQr} alt="QR code MFA" width={160} height={160} className="w-full h-full object-contain" unoptimized />
                      </div>
                    ) : (
                      <div className="w-44 h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    )}
                    {mfaSecret && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                        {ap.mfa_setup_secret}
                        <span className="block mt-1 font-mono text-xs text-slate-600 dark:text-slate-300 break-all">{mfaSecret}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm mb-4', muted)}>{ap.mfa_setup_scan}</p>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      {mv.code_label}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMfaError(null); }}
                      placeholder={mv.code_placeholder}
                      className="w-40 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold text-slate-900 dark:text-white outline-none focus:border-[#C1272D]"
                    />
                    {mfaError && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0" /> {mfaError}</p>}
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        onClick={verifyAndEnable}
                        disabled={mfaBusy || mfaCode.length !== 6}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#C1272D] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {mfaBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {ap.mfa_and_verify}
                      </button>
                      <button
                        onClick={() => { setMfaStep('idle'); setMfaError(null); setMfaCode(''); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {mv.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Flux de désactivation */}
            {mfaStep === 'disable' && (
              <motion.div
                key="mfa-disable"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-6"
              >
                <div className={cn('p-5', subCard)}>
                  <p className={cn('text-sm mb-4 flex items-start gap-2', muted)}>
                    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-red-400" /> {ap.mfa_disable_confirm}
                  </p>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                    {mv.code_label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMfaError(null); }}
                    placeholder={mv.code_placeholder}
                    className="w-40 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold text-slate-900 dark:text-white outline-none focus:border-[#C1272D]"
                  />
                  {mfaError && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 shrink-0" /> {mfaError}</p>}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <button
                      onClick={confirmDisable}
                      disabled={mfaBusy || mfaCode.length !== 6}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {mfaBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {ap.mfa_disable_btn}
                    </button>
                    <button
                      onClick={() => { setMfaStep('idle'); setMfaError(null); setMfaCode(''); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {mv.cancel}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Actions rapides ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 grid sm:grid-cols-2 gap-4"
        >
          <button
            onClick={() => { setShowSignOutModal(true); }}
            className="flex items-center justify-between p-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all text-left"
          >
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{t.profile_page.logout}</span>
            <KeyRound className="w-4 h-4 text-red-500/70" />
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ap.admin_profile_close}</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
