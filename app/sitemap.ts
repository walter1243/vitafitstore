import { MetadataRoute } from 'next';
import { getAllProductIds } from '@/lib/get-product';
import { slugifyCategory } from '@/lib/store-product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProductIds();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://www.vitafitstore.es/producto/${p.id}-${slugifyCategory(p.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    ...productEntries,
    {
      url: 'https://www.vitafitstore.es',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.vitafitstore.es/#productos',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.vitafitstore.es/#cat-pre-treino',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.vitafitstore.es/#nosotros',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
