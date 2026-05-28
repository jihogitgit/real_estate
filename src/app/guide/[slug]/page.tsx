import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdSlot from '@/components/ads/AdSlot'

export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

const getArticle = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary, published_at, updated_at, body')
    .eq('slug', slug)
    .eq('category', 'guide')
    .single()
  return data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: '가이드를 찾을 수 없습니다' }
  return {
    title: article.title,
    description: article.summary ?? undefined,
  }
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && (
          <p className="text-gray-500 mt-2 text-base">{article.summary}</p>
        )}
        <span className="text-xs text-gray-400 block mt-2">
          업데이트: {article.updated_at ? new Date(article.updated_at).toLocaleDateString('ko-KR') : '—'}
        </span>
      </div>
      <hr className="mb-6" />
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {article.body ? (
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        ) : (
          <p className="text-gray-400">내용이 없습니다.</p>
        )}
      </div>

      <AdSlot
        type="adfit"
        adUnit="YOUR_ADFIT_UNIT_ID"
        adWidth={320}
        adHeight={100}
        className="mt-8 flex justify-center"
      />
    </div>
  )
}
