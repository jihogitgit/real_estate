'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveApartment, unsaveApartment } from '@/lib/user-actions'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  apartmentId: string
  initialSaved?: boolean
}

export default function SaveButton({ apartmentId, initialSaved = false }: Props) {
  const { user, signInWithKakao } = useAuth()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!user) {
      await signInWithKakao()
      return
    }

    setLoading(true)
    if (saved) {
      await unsaveApartment(apartmentId)
      setSaved(false)
    } else {
      await saveApartment(apartmentId)
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <Button
      variant={saved ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {saved ? '★ 저장됨' : '☆ 관심 단지'}
    </Button>
  )
}
