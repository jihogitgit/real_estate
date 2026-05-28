import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { removeAlert } from '@/lib/user-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '청약 알림 설정',
  robots: { index: false, follow: false },
}

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?error=login_required')

  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, alert_days_before, is_active, apartments(name, apply_end)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">청약 알림 설정</h1>

      {(alerts ?? []).length === 0 ? (
        <p className="text-gray-400">설정된 알림이 없습니다. 관심 단지 상세 페이지에서 알림을 추가하세요.</p>
      ) : (
        <div className="space-y-3">
          {(alerts ?? []).map((alert) => {
            const apt = (alert.apartments as unknown as { name: string; apply_end: string | null } | null)
            return (
              <div key={alert.id} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">{apt?.name ?? '알 수 없는 단지'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">D-{alert.alert_days_before} 알림</Badge>
                    {apt?.apply_end && (
                      <span className="text-xs text-gray-400">마감: {apt.apply_end}</span>
                    )}
                  </div>
                </div>
                <form action={async () => {
                    'use server'
                    await removeAlert(alert.id)
                  }}>
                  <Button variant="ghost" size="sm" type="submit">삭제</Button>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
