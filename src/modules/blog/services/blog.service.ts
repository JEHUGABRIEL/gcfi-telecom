'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export interface BlogPost {
  id: string; title: string; excerpt: string; content: string;
  image: string | null; category: string; tags: string[];
  author: string; published: boolean; created_at: string; read_time?: number;
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts').select('*').eq('published', true).is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
    staleTime: 1000 * 60 * 5,
  });
}