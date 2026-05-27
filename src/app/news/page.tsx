import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const revalidate = 1800

export const metadata: Metadata = {
  title: '부동산 뉴스 — 최신 분양 시장 트렌드',
  description: '분양 시장 최신 뉴스와 부동산 트렌드를 확인하세요.',
}

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, published_at')
    .eq('category', 'news')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">부동산 뉴스</h1>
      {(articles ?? []).length === 0 ? (
        <p className="text-gray-400 text-center py-16">등록된 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {(articles ?? []).map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">뉴스</Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(article.published_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mt-1">{article.title}</h2>
                </CardHeader>
                {article.summary && (
                  <CardContent className="text-sm text-gray-500 line-clamp-2">
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
