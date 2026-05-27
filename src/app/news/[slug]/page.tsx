import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

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
    .eq('category', 'news')
    .single()

  if (!data) return { title: '뉴스를 찾을 수 없습니다' }
  return {
    title: data.title,
    description: data.summary ?? undefined,
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('category', 'news')
    .single()

  if (!article) notFound()

  return (
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
  )
}
