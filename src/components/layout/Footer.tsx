import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8 text-sm text-gray-500">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          <Link href="/faq" className="hover:text-gray-800">자주 묻는 질문</Link>
          <Link href="/about" className="hover:text-gray-800">서비스 소개</Link>
          <Link href="/contact" className="hover:text-gray-800">문의하기</Link>
          <Link href="/privacy" className="hover:text-gray-800">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
        </div>
        <p>청약마당 | 이메일: contact@example.com</p>
        <p className="mt-1">
          본 사이트는 공공데이터포털 API를 활용합니다. 청약 정보는 반드시 청약홈(applyhome.co.kr)에서 확인하세요.
        </p>
      </div>
    </footer>
  )
}
