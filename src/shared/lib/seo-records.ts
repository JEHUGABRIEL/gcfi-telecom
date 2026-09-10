import { createClient } from '@supabase/supabase-js';
import type { Product, Course, Achievement } from '@/shared/types';
import type { BlogPost } from '@/modules/blog/services/blog.service';

// Lectures serveur d'un enregistrement unique, pour `generateMetadata` et le
// rendu initial des pages de détail. Les hooks react-query du client sont
// marqués 'use client' et ne peuvent pas servir ici ; on passe donc par un
// client Supabase dédié, sans session (données publiques, clé anon).
function serverClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function fetchOne<T>(table: string, id: string, publishedOnly = false): Promise<T | null> {
  // Une page de détail ne doit jamais planter à cause du SEO : en cas d'erreur
  // réseau ou de ligne absente, on renvoie null et la page retombe sur son
  // rendu client habituel.
  try {
    let query = serverClient().from(table).select('*').eq('id', id).is('deleted_at', null);
    if (publishedOnly) query = query.eq('published', true);
    const { data, error } = await query.maybeSingle();
    if (error) return null;
    return (data as T) ?? null;
  } catch {
    return null;
  }
}

export const getProductById = (id: string) => fetchOne<Product>('products', id);
export const getCourseById = (id: string) => fetchOne<Course>('trainings', id);
export const getBlogPostById = (id: string) => fetchOne<BlogPost>('blog_posts', id, true);
export const getAchievementById = (id: string) => fetchOne<Achievement>('achievements', id);
