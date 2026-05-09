import { supabase } from '@/shared/lib/supabase';
import { logError } from '@/shared/lib/supabase-helpers';
import type { Course } from '@/shared/types';

export const TrainingService = {
  async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Course[];
    } catch (err) {
      logError('TrainingService/getCourses', err);
      return [];
    }
  }
};
