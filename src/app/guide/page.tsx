import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '청약 가이드 — 청약 처음이라면',
  description: '청약 가점 계산, 무주택자 기준, 생애최초 특별공급 등 청약 완전 가이드.',
}

export default async function GuidePage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, published_at')
    .eq('category', 'guide')
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">청약 가이드</h1>
        <p className="text-gray-500 mt-1">청약 처음이라면 여기서 시작하세요</p>
      </div>
      {(articles ?? []).length === 0 ? (
        <p className="text-gray-400 text-center py-16">등록된 가이드가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(articles ?? []).map((article) => (
            <Link key={article.id} href={`/guide/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-1">
                  <Badge variant="secondary" className="w-fit">가이드</Badge>
                  <h2 className="text-base font-semibold mt-1">{article.title}</h2>
                </CardHeader>
                {article.summary && (
                  <CardContent className="text-sm text-gray-500 line-clamp-3">
                    {article.summary}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
