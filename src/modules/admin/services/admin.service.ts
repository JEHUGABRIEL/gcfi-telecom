import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';

export const AdminService = {
  async fetchAllData() {
    try {
      const [
        { data: profiles },
        { data: orders },
        { data: trainings },
        { data: products },
        { data: comments },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: false }),
        supabase.from('global_notifications').select('*').order('created_at', { ascending: false })
      ]);
      return { profiles, orders, trainings, products, comments, notifications };
    } catch (err) {
      logError('AdminService/fetchAllData', err);
      return { profiles: [], orders: [], trainings: [], products: [], comments: [], notifications: [] };
    }
  },

  async deleteItem(table: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      logError(`AdminService/delete/${table}`, err);
      return false;
    }
  },

  async saveItem(table: string, item: Record<string, unknown>, isEdit: boolean): Promise<boolean> {
    try {
      const { error } = isEdit
        ? await supabase.from(table).update(item).eq('id', item.id as string)
        : await supabase.from(table).insert([item]);
      if (error) throw error;
      return true;
    } catch (err) {
      logError(`AdminService/save/${table}`, err);
      return false;
    }
  },

  async sendGlobalNotification(title: string, message: string, type: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('global_notifications')
        .insert([{ title, message, type }]);
      if (error) throw error;
      return true;
    } catch (err) {
      logError('AdminService/sendNotification', err);
      return false;
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      return true;
    } catch (err) {
      logError('AdminService/updateOrderStatus', err);
      return false;
    }
  },

  async moderateComment(commentId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', commentId);
      if (error) throw error;
      return true;
    } catch (err) {
      logError('AdminService/moderateComment', err);
      return false;
    }
  }
};
