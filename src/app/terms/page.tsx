import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">제1조 (목적)</h2>
          <p>
            이 약관은 청약마당(이하 &ldquo;서비스&rdquo;)의 이용 조건 및 절차, 이용자와 운영자의 권리·의무를 규정합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제2조 (서비스 내용)</h2>
          <p>
            청약마당은 공공데이터포털 API를 활용한 분양·청약 정보 제공 서비스입니다.
            정보의 정확성을 위해 노력하나, 실제 청약 신청은 반드시 <strong>청약홈(apply.lh.or.kr)</strong>에서 확인하세요.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제3조 (면책)</h2>
          <p>
            본 서비스에서 제공하는 정보는 참고용이며, 투자·청약 결과에 대한 책임을 지지 않습니다.
            공공 API 데이터 오류로 인한 손해에 대해 운영자는 책임지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제4조 (회원)</h2>
          <p>
            카카오 소셜 로그인으로 가입한 회원은 관심 단지 저장 및 알림 서비스를 이용할 수 있습니다.
            회원은 언제든지 탈퇴를 요청할 수 있으며, 탈퇴 시 모든 데이터는 즉시 삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제5조 (광고)</h2>
          <p>
            본 서비스는 Google AdSense 및 Kakao AdFit 광고를 게재합니다.
            광고 내용은 광고주의 책임이며 서비스와 무관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">제6조 (문의)</h2>
          <p>이메일: yooho7987@gmail.com</p>
        </section>
      </div>
    </div>
  )
}
