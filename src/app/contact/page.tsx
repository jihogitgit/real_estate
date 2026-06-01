import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '문의하기',
  description: '청약마당 서비스 문의, 오류 신고, 데이터 이의제기',
  openGraph: {
    title: '문의하기 | 청약마당',
    description: '청약마당 서비스 문의, 오류 신고, 데이터 이의제기',
  },
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">문의하기</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">이메일 문의</h2>
          <p>
            아래 이메일로 문의해 주세요. 보통 2~3 영업일 내 답변드립니다.
          </p>
          <p className="mt-2">
            <a
              href="mailto:yooho7987@gmail.com"
              className="text-blue-600 underline text-base font-medium"
            >
              yooho7987@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">문의 가능 사항</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>데이터 오류 신고 (잘못된 청약 정보)</li>
            <li>서비스 이용 중 오류 또는 버그 신고</li>
            <li>개인정보 처리 관련 이의제기</li>
            <li>콘텐츠 제휴 또는 광고 문의</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">참고</h2>
          <p>
            청약 자격·조건·일정에 대한 문의는 공식 기관을 이용해 주세요.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                청약홈 (www.applyhome.co.kr)
              </a>
            </li>
            <li>
              <a href="https://www.molit.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                국토교통부 (www.molit.go.kr)
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
