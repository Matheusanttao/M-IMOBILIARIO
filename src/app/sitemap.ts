import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/imoveis`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/sobre`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/contato`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/politica-de-privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/corretores`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
