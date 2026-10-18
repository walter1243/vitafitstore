import { MetadataRoute } from 'next';
import { getAllProductIds } from '@/lib/get-product';
import { slugifyCategory } from '@/lib/store-product';
import { getSectors } from '@/lib/sectors';
import { enabledCollections } from '@/lib/sectors-shared';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, sectors] = await Promise.all([getAllProductIds(), getSectors()]);
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
    ...sectors.map((s) => ({
      url: `https://www.kitoys3d.com/sector/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...enabledCollections(sectors).map((c) => ({
      url: `https://www.vitafitstore.es/coleccion/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    {
      url: 'https://www.vitafitstore.es/#productos',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.vitafitstore.es/#ayuda-soporte',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
