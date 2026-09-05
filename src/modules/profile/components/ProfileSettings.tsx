'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Save, User, Bell, Lock, CheckCircle2, XCircle, Camera, Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import { useLang } from '@/shared/context/LanguageContext';
import Input from './ui/Input';
import { supabase } from '@/shared/lib/supabase';
import { cn } from '@/shared/lib/utils';
import { useNotifications } from '@/shared/context/NotificationContext';
import { useAuth } from '@/shared/context/AuthContext';
import { uploadToCloudinary } from '@/shared/lib/cloudinary';
import { checkRateLimit, recordUpload } from '@/shared/lib/rate-limiter';

const settingsSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  displayName: z.string().min(2, "Le nom d'affichage est requis"),
  bio: z.string().max(200, "La bio ne peut pas dépasser 200 caractères").optional(),
  phone: z.string().regex(/^\+(?:[0-9] ?){6,14}[0-9]$/, "Format international requis (ex: +236 72 00 00 00)").optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface ProfileSettingsProps {
  user: import('@supabase/supabase-js').User;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const { t } = useLang();
  const { refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatar, setAvatar] = React.useState(user.user_metadata?.avatar_url || '');
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: user.user_metadata?.full_name || '',
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
      bio: '', 
      phone: user.phone || '',
    },
  });

  const handleAvatarFile = async (file: File) => {
    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError(t.image_upload.file_not_supported);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`${t.image_upload.file_too_large} 5 Mo.`);
      return;
    }
    const uid = localStorage.getItem('userId') || 'anonymous';
    const { allowed, reason } = await checkRateLimit(uid);
    if (!allowed) {
      setAvatarError(reason || t.image_upload.too_many_uploads);
      return;
    }
    setAvatarUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'gcfi/avatars');
      setAvatar(result.secure_url);
      await recordUpload(uid);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t.image_upload.upload_failed);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // 1. Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: data.fullName,
          display_name: data.displayName,
          avatar_url: avatar || null
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          bio: data.bio,
          avatar_url: avatar || null,
          // phone is not in our schema yet, but we could add it
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // 3. Rafraîchit le profil (photo affichée dans le header / l'admin)
      await refreshProfile();
      
      setMessage({ type: 'success', text: t.profile_settings.saved });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t.common.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { requestPermission, addNotification } = useNotifications();
  const [pushStatus, setPushStatus] = React.useState<'success' | 'denied' | null>(null);

  const handlePushActivation = async () => {
    const granted = await requestPermission();
    setPushStatus(granted ? 'success' : 'denied');
    setTimeout(() => setPushStatus(null), 4000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center mb-8">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl mr-4 text-[#C1272D]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Informations Personnelles</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.profile_settings.section_account}</p>
          </div>
        </div>

        {/* Photo de profil */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-28 h-28">
            {avatar ? (
              <NextImage src={avatar} alt={t.profile_settings.avatar_change} fill className="object-cover rounded-full ring-4 ring-red-50 dark:ring-red-900/20" sizes="112px" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center ring-4 ring-red-50 dark:ring-red-900/20">
                <User className="w-10 h-10 text-slate-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              title={t.profile_settings.avatar_change}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#C1272D] text-white flex items-center justify-center shadow-lg hover:bg-[#a81f25] transition-colors disabled:opacity-60"
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
          <p className="text-xs text-slate-400 mt-3">{t.profile_settings.avatar_hint}</p>
          {avatarError && <p className="text-xs text-red-500 font-medium mt-2">{avatarError}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Nom complet"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Nom d'affichage"
              error={errors.displayName?.message}
              {...register('displayName')}
            />
          </div>
          <Input
            label="Numéro de téléphone"
            placeholder="+236 ..."
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Bio (Optionnel)"
            isTextArea
            placeholder="Parlez-nous un peu de vous..."
            error={errors.bio?.message}
            {...register('bio')}
          />

          {message && (
            <div className={cn(
              "p-4 rounded-xl text-sm font-medium",
              message.type === 'success' 
                ? "bg-green-50 dark:bg-green-900/20 text-green-600" 
                : "bg-red-50 dark:bg-red-900/20 text-red-600"
            )}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C1272D] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1E4D8C] transition-all disabled:opacity-50 flex items-center group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              )}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mr-4 text-blue-500">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.profile_settings.section_notifications}</p>
          <button
            onClick={handlePushActivation}
            className="text-sm font-bold text-[#C1272D] hover:underline"
          >
            Activer les notifications push
          </button>
          {pushStatus === 'success' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> {t.profile_settings.notif_enabled}
            </div>
          )}
          {pushStatus === 'denied' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-500 font-medium">
              <XCircle className="w-4 h-4" /> {t.profile_settings.notif_denied}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mr-4 text-orange-500">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.profile_settings.security_title}</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.profile_settings.section_security}</p>
          <button className="text-sm font-bold text-[#C1272D] hover:underline">{t.profile_settings.security_manage}</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1272D]/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.profile_settings.demo_title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{t.profile_settings.demo_desc}</p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => addNotification({
                title: t.profile_settings.demo_shop,
                message: t.profile_settings.demo_shop_msg,
                type: 'offer'
              })}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
            >
              Simuler Offre
            </button>
            <button 
              onClick={() => addNotification({
                title: t.profile_settings.demo_order,
                message: t.profile_settings.demo_order_msg,
                type: 'order'
              })}
              className="bg-[#C1272D] hover:bg-[#1E4D8C] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
            >
              Simuler Statut Commande
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
