import Link from 'next/link'
import LoginButton from '@/components/auth/LoginButton'

const NAV_LINKS = [
  { href: '/apply', label: '분양정보' },
  { href: '/calendar', label: '청약캘린더' },
  { href: '/calculator', label: '가점계산기' },
  { href: '/guide', label: '청약가이드' },
  { href: '/news', label: '부동산뉴스' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center font-bold text-lg text-blue-600">
          청약마당
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <nav className="flex md:hidden items-center gap-3 text-xs font-medium">
            {NAV_LINKS.slice(0, 2).map(({ href, label }) => (
              <Link key={href} href={href} className="text-gray-700">
                {label}
              </Link>
            ))}
          </nav>
          <LoginButton />
        </div>
      </div>
    </header>
  )
}
