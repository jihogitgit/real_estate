import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8 text-sm text-gray-500">
        <div className="flex flex-wrap gap-4 mb-4">
          <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
        </div>
        <p>청약마당 | 이메일: contact@example.com</p>
        <p className="mt-1">
          본 사이트는 공공데이터포털 API를 활용합니다. 청약 정보는 반드시 청약홈(apply.lh.or.kr)에서 확인하세요.
        </p>
      </div>
    </footer>
  )
}
