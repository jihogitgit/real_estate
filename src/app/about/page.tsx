import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '청약마당은 한국부동산원 청약홈 공공데이터를 활용한 분양 청약 정보 서비스입니다.',
  openGraph: {
    title: '서비스 소개 | 청약마당',
    description: '청약마당은 한국부동산원 청약홈 공공데이터를 활용한 분양 청약 정보 서비스입니다.',
  },
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">서비스 소개</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">청약마당이란?</h2>
          <p>
            청약마당은 전국 아파트 분양 청약 정보를 한눈에 볼 수 있는 개인 운영 정보 서비스입니다.
            공식 기관이 아닌 비공식 정보 서비스로, 청약홈의 공공데이터를 가공하여 제공합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">데이터 출처</h2>
          <p>
            모든 분양 청약 데이터는{' '}
            <a
              href="https://www.applyhome.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              한국부동산원 청약홈
            </a>
            의 공공데이터 API를 통해 수집됩니다. 데이터는 매일 자동으로 동기화되며,
            공공데이터포털(data.go.kr)의 이용 약관을 준수합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제공 기능</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>전국 분양 청약 일정 및 정보 조회</li>
            <li>지역별 청약 현황 확인</li>
            <li>청약 캘린더 — 월별 청약 일정 시각화</li>
            <li>청약 가점 계산기 — 내 가점 직접 계산</li>
            <li>청약 가이드 — 입문부터 전략까지</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">면책 고지</h2>
          <p>
            본 서비스의 정보는 참고용이며, 실제 청약 신청 및 자격 확인은 반드시{' '}
            <a
              href="https://www.applyhome.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              청약홈(www.applyhome.co.kr)
            </a>
            의 공식 공고문을 기준으로 하세요. 청약 조건은 단지별·지역별로 다르며,
            공공 API 데이터 오류로 인한 손해에 대해 운영자는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">문의</h2>
          <p>
            오류 신고나 문의사항은{' '}
            <a href="/contact" className="text-blue-600 underline">
              문의하기
            </a>
            페이지를 이용해 주세요.
          </p>
        </section>
      </div>
    </div>
  )
}
