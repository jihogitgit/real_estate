'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveApartment(apartmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('saved_apartments')
    .insert({ user_id: user.id, apartment_id: apartmentId })

  if (error && error.code !== '23505') return { error: error.message }
  revalidatePath('/my/saved')
  return { success: true }
}

export async function unsaveApartment(apartmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('saved_apartments')
    .delete()
    .eq('user_id', user.id)
    .eq('apartment_id', apartmentId)

  if (error) return { error: error.message }
  revalidatePath('/my/saved')
  return { success: true }
}

export async function setAlert(apartmentId: string, daysBefore: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('alerts')
    .upsert(
      { user_id: user.id, apartment_id: apartmentId, alert_days_before: daysBefore, is_active: true },
      { onConflict: 'user_id,apartment_id,alert_days_before' }
    )

  if (error) return { error: error.message }
  revalidatePath('/my/alerts')
  return { success: true }
}

export async function removeAlert(alertId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/my/alerts')
  return { success: true }
}
