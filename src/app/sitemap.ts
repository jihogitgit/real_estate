import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ALL_REGIONS } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.vercel.app'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: apartments } = await supabase
    .from('apartments')
    .select('id, updated_at')
    .limit(1000)

  const apartmentUrls: MetadataRoute.Sitemap = (apartments ?? []).map((apt) => ({
    url: `${BASE_URL}/apply/${apt.id}`,
    lastModified: new Date(apt.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .limit(500)

  const articleUrls: MetadataRoute.Sitemap = (articles ?? []).map((art) => ({
    url: `${BASE_URL}/guide/${art.slug}`,
    lastModified: new Date(art.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/apply`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/calendar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/guide`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  const regionUrls: MetadataRoute.Sitemap = ALL_REGIONS.map((region) => ({
    url: `${BASE_URL}/region/${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticUrls, ...regionUrls, ...apartmentUrls, ...articleUrls]
}
