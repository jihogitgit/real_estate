'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { setAlert } from '@/lib/user-actions'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  apartmentId: string
}

export default function AlertButton({ apartmentId }: Props) {
  const { user, signInWithKakao } = useAuth()
  const [set, setSet] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!user) {
      await signInWithKakao()
      return
    }

    setLoading(true)
    await setAlert(apartmentId, 1)
    setSet(true)
    setLoading(false)
  }

  if (set) {
    return <p className="text-sm text-green-600">D-1 알림이 설정되었습니다.</p>
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      🔔 알림 받기
    </Button>
  )
}
