import { MetadataRoute } from 'next';
import { getAllPostSlugs } from '../lib/posts';

export const dynamic = 'force-static';

const BASE_URL = 'https://infotoday.co.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllPostSlugs();

  const blogUrls: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...blogUrls,
  ];
}
