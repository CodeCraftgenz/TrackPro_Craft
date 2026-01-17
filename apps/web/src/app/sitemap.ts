import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trackpro.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/blog',
    '/privacy',
    '/terms',
  ];

  const routes = staticPages.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
