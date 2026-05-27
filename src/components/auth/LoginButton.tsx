'use client'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'

export default function LoginButton() {
  const { user, loading, signInWithKakao, signOut } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <Button variant="outline" size="sm" onClick={signOut}>
        로그아웃
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={signInWithKakao}
      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
    >
      카카오 로그인
    </Button>
  )
}
