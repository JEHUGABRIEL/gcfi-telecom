import { useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/shared/context/AuthContext';
import { logError } from '@/shared/lib/supabase-helpers';

export type ActivityEntity =
  | 'services'
  | 'products'
  | 'trainings'
  | 'blog'
  | 'users'
  | 'orders'
  | 'promos'
  | 'notifications'
  | 'quotes'
  | 'content';

export interface LogActivityParams {
  action: string;       // ex: 'created', 'updated', 'deleted', 'blocked', 'published'
  entity: ActivityEntity;
  entity_id?: string;
  label: string;        // Texte lisible affiché dans la Vue d'ensemble
}

export function useActivityLog() {
  const { profile } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!profile) return;
    try {
      // Insérer la nouvelle activité
      await supabase.from('admin_activity_log').insert([{
        admin_id:   profile.id,
        admin_name: profile.full_name || profile.email,
        action:     `${params.entity}.${params.action}`,
        entity:     params.entity,
        entity_id:  params.entity_id ?? null,
        label:      params.label,
      }]);

      // Nettoyer les activités de plus de 7 jours (auto-archivage)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('admin_activity_log')
        .delete()
        .lt('created_at', weekAgo);
    } catch (err) {
      logError('useActivityLog', err);
    }
  }, [profile]);

  return { logActivity };
}