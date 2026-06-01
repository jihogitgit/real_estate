import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
}

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString('ko-KR')

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <p className="text-gray-500 text-sm mb-8">시행일: {today}</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">1. 수집하는 개인정보</h2>
          <p>
            청약마당(이하 &ldquo;서비스&rdquo;)은 카카오 소셜 로그인 시 이메일 주소를 수집합니다.
            광고 서비스(Google AdSense, Kakao AdFit) 운영을 위해 쿠키 및 광고 식별자가 수집될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. 수집 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>관심 단지 저장 및 청약 알림 발송</li>
            <li>서비스 이용 통계 분석 (Google Analytics 4)</li>
            <li>맞춤형 광고 제공 (Google AdSense, Kakao AdFit)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. 보유 및 이용기간</h2>
          <p>회원 탈퇴 시 즉시 삭제합니다. 광고 쿠키는 브라우저 설정으로 거부 가능합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. 제3자 제공</h2>
          <p>
            개인정보를 제3자에게 제공하지 않습니다. 단, Google 및 Kakao의 광고 서비스 이용에
            따른 데이터 처리는 각사의 개인정보처리방침을 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. 쿠키 사용</h2>
          <p>
            본 서비스는 로그인 세션 유지 및 광고 최적화를 위해 쿠키를 사용합니다.
            브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. 권리 행사</h2>
          <p>
            개인정보 열람·수정·삭제 요청은 아래 이메일로 연락 주세요.
            <br />
            <strong>이메일: yooho7987@gmail.com</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. 개인정보보호책임자</h2>
          <p>이름: 운영자 / 이메일: yooho7987@gmail.com</p>
        </section>
      </div>
    </div>
  )
}
