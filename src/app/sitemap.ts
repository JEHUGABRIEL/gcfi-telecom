import { MetadataRoute } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SITE_URL as BASE_URL } from '@/shared/lib/site-url';

type SupabaseClient = ReturnType<typeof createServerClient>;

interface SitemapRow {
  id: string;
  updated_at?: string | null;
  created_at?: string | null;
}

/**
 * Récupère les identifiants d'une table pour le sitemap.
 *
 * Toutes les tables n'ont pas les mêmes colonnes de date : demander
 * `updated_at` à une table qui ne l'a pas fait échouer la requête entière et
 * la section disparaissait du sitemap sans le moindre signal. On tente donc
 * la version datée, puis on retombe sur les seuls `id` — mieux vaut une URL
 * sans `lastModified` qu'une URL absente de l'index.
 */
async function fetchSitemapRows(
  supabase: SupabaseClient,
  table: string,
  publishedOnly = false
): Promise<SitemapRow[]> {
  const build = (columns: string) => {
    const query = supabase.from(table).select(columns).is('deleted_at', null);
    return publishedOnly ? query.eq('published', true) : query;
  };

  // De la plus précise à la plus sûre : on garde la meilleure date disponible
  // plutôt que de tout perdre dès qu'une colonne manque.
  let lastError = '';
  for (const columns of ['id, updated_at, created_at', 'id, created_at', 'id']) {
    const { data, error } = await build(columns);
    if (!error) return (data ?? []) as unknown as SitemapRow[];
    lastError = error.message;
  }

  console.error(`[sitemap] ${table} illisible :`, lastError);
  return [];
}

/** Date de dernière modification la plus précise disponible pour une ligne. */
const rowDate = (row: SitemapRow): Date => {
  const raw = row.updated_at ?? row.created_at;
  return raw ? new Date(raw) : new Date();
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const [products, trainings, posts, achievements] = await Promise.all([
    fetchSitemapRows(supabase, 'products'),
    fetchSitemapRows(supabase, 'trainings'),
    fetchSitemapRows(supabase, 'blog_posts', true),
    fetchSitemapRows(supabase, 'achievements'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/boutique`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/formation`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/services`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE_URL}/conditions`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${BASE_URL}/boutique/${p.id}`,
    lastModified: rowDate(p),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const trainingRoutes: MetadataRoute.Sitemap = trainings.map(t => ({
    url: `${BASE_URL}/formation/${t.id}`,
    lastModified: rowDate(t),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map(p => ({
    url: `${BASE_URL}/blog/${p.id}`,
    lastModified: rowDate(p),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Les pages de réalisation étaient absentes du sitemap : Google n'avait
  // aucun chemin de découverte vers elles.
  const achievementRoutes: MetadataRoute.Sitemap = achievements.map(a => ({
    url: `${BASE_URL}/realisations/${a.id}`,
    lastModified: rowDate(a),
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...trainingRoutes, ...blogRoutes, ...achievementRoutes];
}
