import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/preview', '/admin/'],
    },
    sitemap: 'https://www.vitafitstore.es/sitemap.xml',
    host: 'https://www.vitafitstore.es',
  };
}
