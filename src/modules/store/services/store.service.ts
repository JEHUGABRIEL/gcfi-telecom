import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Product, Order, CartItem } from '@/shared/types';

export const StoreService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('popularity', { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    } catch (err) {
      logError('StoreService/getProducts', err);
      return [];
    }
  },

  async createOrder(
    userId: string,
    userEmail: string,
    cart: CartItem[],
    total: number
  ): Promise<void> {
    const { error } = await supabase.from('orders').insert([{
      customer_id: userId,
      customer_email: userEmail,
      total,
      items: cart,
      status: 'En préparation'
    }]);
    if (error) logError('StoreService/createOrder', error);
  }
};
