import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ApartmentList from '@/components/apartment/ApartmentList'
import type { Apartment } from '@/types'

export const metadata: Metadata = {
  title: '관심 단지',
  robots: { index: false, follow: false },
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?error=login_required')

  const { data: saved } = await supabase
    .from('saved_apartments')
    .select('apartments(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const apartments = ((saved ?? []) as unknown as { apartments: Apartment | null }[])
    .map((s) => s.apartments)
    .filter((a): a is Apartment => a !== null)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">관심 단지 ({apartments.length})</h1>
      <ApartmentList apartments={apartments} />
    </div>
  )
}
