import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Product } from '@/shared/types';

export const StoreService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('popularity', { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    } catch (err) {
      logError('StoreService/getProducts', err);
      return [];
    }
  }
};
