import type { MetadataRoute } from 'next'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/imoveis`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/financiamento`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/sobre`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/contato`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/politica-de-privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/corretores`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  if (!isServerSupabaseConfigured()) return staticRoutes

  const supabase = await createServerSupabaseClient()
  const [{ data: imoveis }, { data: posts }] = await Promise.all([
    supabase
      .from('imoveis')
      .select('slug, updated_at, created_at')
      .eq('status', 'disponivel')
      .not('slug', 'is', null),
    supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('publicado', true)
      .not('slug', 'is', null),
  ])

  const propertyRoutes: MetadataRoute.Sitemap = (imoveis ?? []).map((imovel) => ({
    url: `${base}/imoveis/${imovel.slug}`,
    lastModified: new Date(imovel.updated_at ?? imovel.created_at ?? now),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.created_at ?? now),
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...propertyRoutes, ...blogRoutes]
}
