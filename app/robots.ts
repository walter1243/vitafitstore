import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/preview', '/admin/'],
    },
    sitemap: 'https://www.kitoys3d.com/sitemap.xml',
    host: 'https://www.kitoys3d.com',
  };
}
