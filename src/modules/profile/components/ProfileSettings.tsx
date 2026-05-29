'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Save, User, Bell, Lock, CheckCircle2, XCircle } from 'lucide-react';
import Input from './ui/Input';
import { supabase } from '@/shared/lib/supabase';
import { cn } from '@/shared/lib/utils';
import { useNotifications } from '@/shared/context/NotificationContext';

const settingsSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis"),
  displayName: z.string().min(2, "Le nom d'affichage est requis"),
  bio: z.string().max(200, "La bio ne peut pas dépasser 200 caractères").optional(),
  phone: z.string().regex(/^\+(?:[0-9] ?){6,14}[0-9]$/, "Format international requis (ex: +237681371449)").optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface ProfileSettingsProps {
  user: any;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // 1. Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: data.fullName,
          display_name: data.displayName
        }
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          bio: data.bio,
          // phone is not in our schema yet, but we could add it
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      setMessage({ type: 'success', text: 'Paramètres mis à jour avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue.' });
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos informations de compte.</p>
          </div>
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Gérez vos préférences de notifications et activez les alertes push pour vos commandes.</p>
          <button
            onClick={handlePushActivation}
            className="text-sm font-bold text-[#C1272D] hover:underline"
          >
            Activer les notifications push
          </button>
          {pushStatus === 'success' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Notifications activées avec succès.
            </div>
          )}
          {pushStatus === 'denied' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-500 font-medium">
              <XCircle className="w-4 h-4" /> Autorisation refusée ou non supportée.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mr-4 text-orange-500">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sécurité</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Changez votre mot de passe ou gérez votre sécurité.</p>
          <button className="text-sm font-bold text-[#C1272D] hover:underline">Gérer la sécurité</button>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C1272D]/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2">Centre de Test Notifications</h3>
          <p className="text-slate-400 text-sm mb-8">Utilisez ces boutons pour simuler des événements réels et vérifier vos notifications push.</p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => addNotification({
                title: 'Nouveauté Boutique !',
                message: 'Le nouvel iPhone 15 Pro est disponible au showroom de Bangui.',
                type: 'offer'
              })}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
            >
              Simuler Offre
            </button>
            <button 
              onClick={() => addNotification({
                title: 'Mise à jour Commande',
                message: 'Votre commande #GCFI-882 est maintenant expédiée.',
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
