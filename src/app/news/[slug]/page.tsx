import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.vercel.app'

interface Props {
  params: Promise<{ slug: string }>
}

const getArticle = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary, published_at, updated_at, body')
    .eq('slug', slug)
    .eq('category', 'news')
    .single()
  return data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: '뉴스를 찾을 수 없습니다' }
  return {
    title: article.title,
    description: article.summary ?? undefined,
    alternates: { canonical: `${BASE_URL}/news/${slug}` },
  }
}

function ArticleJsonLd({ slug, title, summary, publishedAt, updatedAt }: {
  slug: string
  title: string
  summary: string | null
  publishedAt: string | null
  updatedAt: string | null
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: summary ?? undefined,
    url: `${BASE_URL}/news/${slug}`,
    datePublished: publishedAt ?? undefined,
    dateModified: updatedAt ?? publishedAt ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: '청약마당',
      url: BASE_URL,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  return (
    <>
      <ArticleJsonLd
        slug={slug}
        title={article.title}
        summary={article.summary}
        publishedAt={article.published_at}
        updatedAt={article.updated_at}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <span className="text-xs text-gray-400">
            {new Date(article.published_at).toLocaleDateString('ko-KR')}
          </span>
          <h1 className="text-2xl font-bold mt-2">{article.title}</h1>
          {article.summary && (
            <p className="text-gray-500 mt-2">{article.summary}</p>
          )}
        </div>
        <hr className="mb-6" />
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          {article.body ? (
            <div dangerouslySetInnerHTML={{ __html: article.body }} />
          ) : (
            <p className="text-gray-400">내용이 없습니다.</p>
          )}
        </div>
      </div>
    </>
  )
}
