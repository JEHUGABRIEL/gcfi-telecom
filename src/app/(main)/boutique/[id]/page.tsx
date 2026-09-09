import type { Metadata } from 'next';
import ProductDetail from '@/modules/store/components/ProductDetail';
import JsonLd from '@/shared/components/JsonLd';
import { getProductById } from '@/shared/lib/seo-records';
import { productSchema, breadcrumbSchema } from '@/shared/lib/structured-data';
import { buildPageMetadata, toDescription, NOT_FOUND_METADATA } from '@/shared/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NOT_FOUND_METADATA;

  return buildPageMetadata({
    title: `${product.name} — ${product.category}`,
    description: toDescription(
      product.description,
      `${product.name}, disponible chez GCFI Telecom à Bangui. Équipement ${product.category} livré en République Centrafricaine.`
    ),
    path: `/boutique/${product.id}`,
    image: product.image,
    keywords: [product.name, product.category, 'Bangui', 'RCA', 'GCFI Telecom'],
  });
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <>
      {product && (
        <JsonLd
          data={[
            productSchema(product),
            breadcrumbSchema([
              { name: 'Accueil', path: '/' },
              { name: 'Boutique', path: '/boutique' },
              { name: product.name, path: `/boutique/${product.id}` },
            ]),
          ]}
        />
      )}
      <ProductDetail initialProduct={product ?? undefined} />
    </>
  );
}
