import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Testimonial } from '@/shared/types';

export const HomeService = {
  async getTestimonials(): Promise<Testimonial[]> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Testimonial[];
    } catch (err) {
      logError('HomeService/getTestimonials', err);
      return [];
    }
  }
};
