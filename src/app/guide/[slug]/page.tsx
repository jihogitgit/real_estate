import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', slug)
    .eq('category', 'guide')
    .single()

  if (!data) return { title: '가이드를 찾을 수 없습니다' }
  return {
    title: data.title,
    description: data.summary ?? undefined,
  }
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('category', 'guide')
    .single()

  if (!article) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && (
          <p className="text-gray-500 mt-2 text-base">{article.summary}</p>
        )}
        <span className="text-xs text-gray-400 block mt-2">
          업데이트: {new Date(article.updated_at).toLocaleDateString('ko-KR')}
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
    </div>
  )
}
