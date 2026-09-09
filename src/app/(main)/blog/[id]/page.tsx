import type { Metadata } from 'next';
import BlogArticleDetail from '@/modules/blog/components/BlogArticleDetail';
import JsonLd from '@/shared/components/JsonLd';
import { getBlogPostById } from '@/shared/lib/seo-records';
import { articleSchema, breadcrumbSchema } from '@/shared/lib/structured-data';
import { buildPageMetadata, toDescription, NOT_FOUND_METADATA } from '@/shared/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) return NOT_FOUND_METADATA;

  return buildPageMetadata({
    title: post.title,
    description: toDescription(post.excerpt || post.content, `Article du blog GCFI Telecom : ${post.title}.`),
    path: `/blog/${post.id}`,
    image: post.image,
    type: 'article',
    publishedTime: post.created_at,
    keywords: post.tags?.length ? post.tags : undefined,
  });
}

export default async function BlogArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPostById(id);

  return (
    <>
      {post && (
        <JsonLd
          data={[
            articleSchema(post),
            breadcrumbSchema([
              { name: 'Accueil', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: post.title, path: `/blog/${post.id}` },
            ]),
          ]}
        />
      )}
      <BlogArticleDetail initialPost={post ?? undefined} />
    </>
  );
}
