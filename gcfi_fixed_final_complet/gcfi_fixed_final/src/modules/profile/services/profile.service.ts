import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Order, Profile } from '@/shared/types';

export const ProfileService = {
  async getOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      logError('ProfileService/getOrders', err);
      return [];
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      logError('ProfileService/updateProfile', err);
      return false;
    }
  }
};
