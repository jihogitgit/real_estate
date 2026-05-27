import { createClient } from '@/lib/supabase/server'
import { getOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'
import type { Apartment } from '@/types'

export async function getApartmentsByRegion(region: string): Promise<Apartment[]> {
  return getOrSet(
    CACHE_KEYS.apartmentsList(region),
    CACHE_TTL.apartmentsList,
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('region', region)
        .order('apply_start', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  )
}

export async function getApartmentById(id: string): Promise<Apartment | null> {
  return getOrSet(
    CACHE_KEYS.apartmentsDetail(id),
    CACHE_TTL.apartmentsDetail,
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    }
  )
}

export async function getUpcomingApartments(limit = 6): Promise<Apartment[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .gte('apply_end', today)
    .order('apply_start', { ascending: true })
    .limit(limit)
  if (error) return []
  return data ?? []
}

export async function getApartmentsForCalendar(year: number, month: number): Promise<Apartment[]> {
  const supabase = await createClient()
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .or(`apply_start.gte.${startOfMonth},apply_end.lte.${endOfMonth}`)
    .order('apply_start', { ascending: true })
  if (error) return []
  return data ?? []
}
