import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match ? match[1].trim() : null
}

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

const articles = [
  {
    slug: 'subscription-account-guide',
    title: '청약통장 200% 활용법',
    summary: '청약통장 납입 금액, 전환 방법, 소득공제 혜택까지 청약통장을 최대한 활용하는 방법을 알아봅니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 납입 전략</h2>
<p>주택청약종합저축은 매월 2만~50만원을 자유롭게 납입할 수 있습니다. 가점 최대화를 위해 꾸준히 납입하는 것이 중요합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">얼마를 넣어야 할까?</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li><strong>국민주택 청약</strong>: 지역별 예치금 기준 충족 필요 (서울 85㎡ 이하 300만원)</li>
<li><strong>민영주택 청약</strong>: 납입 횟수(가점)가 중요, 금액보다 횟수 우선</li>
<li>권장: 월 10만원 이상 꾸준히 납입</li>
</ul>
<h2 class="text-xl font-bold mt-6 mb-3">소득공제 혜택</h2>
<p>무주택 세대주는 연간 납입액의 40%(최대 300만원 한도, 소득공제 최대 120만원)를 소득공제 받을 수 있습니다. 연말정산 시 반드시 챙기세요.</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 유지 주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm">
<li>해지 시 가입 이력 소멸 — 절대 해지 금지</li>
<li>타 은행 이전은 가입 이력 유지되므로 가능</li>
<li>명의 변경 불가 (사망 등 예외 제외)</li>
</ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약통장 예치금 기준은 지역 및 주택 유형에 따라 다르니 청약홈 공고문을 확인하세요.</div>`
  },
  {
    slug: 'homeless-period-calc',
    title: '무주택 기간 계산 방법',
    summary: '청약 가점에서 가장 중요한 무주택 기간 — 언제부터 계산되고, 주택 처분 후 어떻게 달라지는지 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 기산점</h2>
<p>무주택 기간은 다음 중 가장 늦은 날부터 계산됩니다: ①만 30세가 된 날 ②혼인 신고일. 즉, 30세 미만에 결혼했다면 혼인 신고일부터, 30세 이후 결혼이라면 만 30세 생일부터 기산합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">주택 처분 후 재기산</h2>
<p>과거에 주택을 소유한 적이 있다면 처분(등기 이전)한 날부터 다시 기산합니다. 상속받은 주택을 즉시 처분한 경우 처분일 기준으로 계산합니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 점수표</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2">기간</th><th class="border p-2">점수</th></tr></thead><tbody><tr><td class="border p-2">1년 미만</td><td class="border p-2 text-center">2점</td></tr><tr><td class="border p-2">3년</td><td class="border p-2 text-center">8점</td></tr><tr><td class="border p-2">5년</td><td class="border p-2 text-center">10점</td></tr><tr><td class="border p-2">10년</td><td class="border p-2 text-center">22점</td></tr><tr><td class="border p-2">15년 이상</td><td class="border p-2 text-center">32점</td></tr></tbody></table>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">무주택 확인은 청약홈 또는 주택소유확인 시스템에서 가능합니다.</div>`
  },
  {
    slug: 'lottery-vs-score',
    title: '가점제 vs 추첨제 — 언제 어디에 적용되나',
    summary: '청약 가점이 낮아도 당첨될 수 있는 추첨제 물량과 적용 기준을 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">가점제 vs 추첨제 기준</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">면적</th><th class="border p-2">투기과열지구</th><th class="border p-2">조정대상지역</th><th class="border p-2">기타</th></tr></thead><tbody><tr><td class="border p-2">85㎡ 이하</td><td class="border p-2 text-center">가점 100%</td><td class="border p-2 text-center">가점 75%</td><td class="border p-2 text-center">가점 40%</td></tr><tr><td class="border p-2">85~102㎡</td><td class="border p-2 text-center">추첨 50%</td><td class="border p-2 text-center">추첨 70%</td><td class="border p-2 text-center">추첨 70%</td></tr><tr><td class="border p-2">102㎡ 초과</td><td class="border p-2 text-center">추첨 100%</td><td class="border p-2 text-center">추첨 100%</td><td class="border p-2 text-center">추첨 100%</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">추첨제 활용 전략</h2>
<p>가점이 30점 미만이라면 가점제 경쟁에서 불리합니다. 대신 ①85㎡ 초과 대형 평형의 추첨제 물량 ②비규제지역의 추첨제 비중 높은 단지를 노리면 당첨 가능성을 높일 수 있습니다.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">추첨제 비율은 단지 공고마다 상이하므로 입주자모집공고를 확인하세요.</div>`
  },
  {
    slug: 'newlywed-special-supply',
    title: '신혼부부 특별공급 완벽 가이드',
    summary: '혼인 7년 이내라면 반드시 챙겨야 할 신혼부부 특별공급. 자격·소득 기준·신청 방법을 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">신청 자격</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>혼인 신고일로부터 7년 이내 (입주자모집공고일 기준)</li><li>세대원 전원 무주택</li><li>만 19세 이상</li><li>소득 기준 충족</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">소득 기준</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2">구분</th><th class="border p-2">소득 기준</th></tr></thead><tbody><tr><td class="border p-2">외벌이</td><td class="border p-2">도시근로자 월평균소득 130% 이하</td></tr><tr><td class="border p-2">맞벌이</td><td class="border p-2">도시근로자 월평균소득 140% 이하</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">우선순위</h2>
<p>1순위: 자녀(태아 포함)가 있는 신혼부부 → 2순위: 자녀 없는 신혼부부·예비 신혼부부</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">소득 기준은 매년 변경될 수 있으므로 공고문 기준 소득 기준표를 반드시 확인하세요.</div>`
  },
  {
    slug: 'first-home-special',
    title: '생애최초 특별공급 자격과 신청법',
    summary: '태어나서 처음 집을 사는 분을 위한 생애최초 특별공급. 자격 요건과 소득 기준을 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">신청 자격</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>세대원 전원이 생애 처음 주택을 구입하는 경우</li><li>근로자 또는 자영업자 (소득 있어야 함)</li><li>5년 이상 소득세 납부</li><li>소득 기준: 도시근로자 월평균소득 130% 이하 (공공주택 100%)</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>과거 분양권 취득도 주택 소유로 간주될 수 있음</li><li>세대원 중 한 명이라도 과거 주택 소유 이력이 있으면 불가</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">신청 절차</h2>
<ol class="list-decimal pl-6 space-y-1 text-sm"><li>청약홈 로그인 → 생애최초 특별공급 신청</li><li>소득 증빙 서류 제출 (건강보험료 납부확인서 등)</li><li>당첨자 발표 후 자격 서류 제출</li></ol>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">생애최초 자격 판단이 복잡한 경우 청약홈 고객센터(1644-7445)에 문의하세요.</div>`
  },
  {
    slug: 'subscription-calendar-guide',
    title: '청약 일정 보는 법과 캘린더 활용',
    summary: '청약 일정표에서 특별공급일, 1순위일, 당첨 발표일을 읽는 방법과 청약마당 캘린더 활용법.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 일정 구조</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2">일정</th><th class="border p-2 text-left">내용</th></tr></thead><tbody><tr><td class="border p-2 text-center">모집공고일</td><td class="border p-2">공고 게시, 이날부터 공고문 확인 가능</td></tr><tr><td class="border p-2 text-center">특별공급일</td><td class="border p-2">신혼부부·생애최초 등 특별공급 접수</td></tr><tr><td class="border p-2 text-center">1순위 접수일</td><td class="border p-2">해당 지역 1순위 접수 (1~2일)</td></tr><tr><td class="border p-2 text-center">2순위 접수일</td><td class="border p-2">1순위 미달 시 2순위 접수</td></tr><tr><td class="border p-2 text-center">당첨자 발표</td><td class="border p-2">청약홈에서 확인 가능</td></tr><tr><td class="border p-2 text-center">계약일</td><td class="border p-2">지정 장소에서 계약 (2~3일간)</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">청약마당 캘린더 활용법</h2>
<p>청약마당의 <a href="/calendar" class="text-blue-600 underline">청약 캘린더</a>에서 이달의 청약 일정을 한눈에 확인할 수 있습니다.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약 일정은 사업 주체 사정에 따라 변경될 수 있습니다. 청약홈 공고를 최종 기준으로 하세요.</div>`
  },
  {
    slug: 'contract-process',
    title: '청약 당첨 후 계약까지 단계별 가이드',
    summary: '청약 당첨 발표부터 서류 제출, 계약, 중도금, 입주까지 전 과정을 단계별로 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">당첨 후 전체 프로세스</h2>
<ol class="list-decimal pl-6 space-y-3 text-sm"><li><strong>당첨 확인</strong>: 청약홈 로그인 → 청약 결과 조회.</li><li><strong>서류 제출</strong>: 당첨 후 3~5일 내 지정 장소에 자격 서류 제출. 미제출 시 당첨 취소.</li><li><strong>계약 체결</strong>: 계약금(분양가의 10~20%) 납부.</li><li><strong>중도금 납부</strong>: 공정률에 따라 6회 분할 납부 (보통 분양가의 60%).</li><li><strong>잔금 납부 및 입주</strong>: 준공 후 잔금 납부 후 입주.</li></ol>
<h2 class="text-xl font-bold mt-6 mb-3">주의사항</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>계약 포기 시 재당첨 제한 5~10년 적용</li><li>중도금 대출 규제 지역별 LTV 확인 필요</li></ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">계약 일정 및 서류는 단지마다 다르므로 담당 분양사무소에 직접 문의하세요.</div>`
  },
  {
    slug: 'price-cap-system',
    title: '분양가상한제란 무엇인가',
    summary: '분양가상한제의 개념, 적용 지역, 전매제한·실거주 의무와의 관계를 알기 쉽게 설명합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">분양가상한제란?</h2>
<p>정부가 아파트 분양가의 상한선을 정해, 그 이하로만 분양하도록 강제하는 제도입니다. 투기 억제와 실수요자 보호가 목적입니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">적용 지역</h2>
<p>2025년 기준 서울 전 지역과 일부 경기 지역이 분양가상한제 적용 지역입니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">분양가상한제 적용 시 따라오는 규제</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li><strong>전매 제한</strong>: 최대 10년간 거래 불가</li><li><strong>실거주 의무</strong>: 직접 거주 기간 2~5년</li><li><strong>재당첨 제한</strong>: 10년</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">장단점</h2>
<p><strong>장점</strong>: 시세 대비 저렴한 가격에 신축 아파트 취득 가능.<br/><strong>단점</strong>: 전매 제한으로 단기 매도 불가, 실거주 의무 이행 필수.</p>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">분양가상한제 적용 여부는 입주자모집공고에 명시됩니다.</div>`
  },
  {
    slug: 'resale-restriction',
    title: '전매제한 완벽 이해',
    summary: '전매제한이란 무엇인지, 지역별 기간, 위반 시 불이익, 예외 사항까지 정리합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">전매제한이란?</h2>
<p>청약에 당첨된 주택을 일정 기간 동안 타인에게 팔거나 양도할 수 없도록 제한하는 제도입니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">지역별 전매제한 기간</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역</th><th class="border p-2">기간</th></tr></thead><tbody><tr><td class="border p-2">투기과열지구 (서울 등)</td><td class="border p-2 text-center">최대 10년</td></tr><tr><td class="border p-2">조정대상지역</td><td class="border p-2 text-center">최대 6년</td></tr><tr><td class="border p-2">수도권 공공택지</td><td class="border p-2 text-center">3년</td></tr><tr><td class="border p-2">분양가상한제 적용</td><td class="border p-2 text-center">최대 10년</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">위반 시 불이익</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>계약 취소 및 분양가로 환수</li><li>취득세 추징</li><li>1년 이하 징역 또는 1천만원 이하 벌금</li></ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">전매제한 기간은 입주자모집공고에 명시됩니다. 반드시 공고문 기준으로 확인하세요.</div>`
  },
  {
    slug: 'subscription-checklist',
    title: '청약 신청 전 꼭 확인할 체크리스트',
    summary: '청약 실수를 막기 위한 단계별 체크리스트. 공고 확인부터 서류 준비까지.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-4">최종 업데이트: 2025-06-01 · 출처: 청약홈</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 전 필수 확인사항</h2>
<h3 class="font-semibold mt-4 mb-2">1. 자격 확인</h3>
<ul class="list-none space-y-1 text-sm"><li>☐ 청약통장 1순위 요건(가입기간·납입횟수) 충족 여부</li><li>☐ 세대주 여부 (해당 지역 필수인 경우)</li><li>☐ 세대원 전원 무주택 여부</li><li>☐ 5년 이내 당첨 이력 없음</li><li>☐ 특별공급 해당 자격 여부</li></ul>
<h3 class="font-semibold mt-4 mb-2">2. 공고문 확인</h3>
<ul class="list-none space-y-1 text-sm"><li>☐ 공급 면적과 분양가 확인</li><li>☐ 청약 일정 (접수일, 당첨 발표일, 계약일)</li><li>☐ 전매제한 기간 확인</li><li>☐ 실거주 의무 여부</li><li>☐ 중도금 대출 가능 여부 및 조건</li></ul>
<h3 class="font-semibold mt-4 mb-2">3. 서류 준비</h3>
<ul class="list-none space-y-1 text-sm"><li>☐ 주민등록등본 (전 세대원 포함)</li><li>☐ 가족관계증명서</li><li>☐ 건강보험료 납부확인서 (특별공급)</li><li>☐ 청약통장 가입확인서</li></ul>
<h3 class="font-semibold mt-4 mb-2">4. 자금 계획</h3>
<ul class="list-none space-y-1 text-sm"><li>☐ 계약금 (분양가의 10~20%) 준비 여부</li><li>☐ 중도금 대출 사전 심사</li><li>☐ 잔금 마련 계획</li></ul>
<div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약은 한 번의 실수로 수년간 재도전 기회가 막힐 수 있습니다. 신청 전 공고문을 반드시 꼼꼼히 읽으세요.</div>`
  }
]

async function main() {
  console.log('Inserting 10 standard guide articles...')

  for (const article of articles) {
    const { error } = await supabase
      .from('articles')
      .upsert(article, { onConflict: 'slug' })

    if (error) {
      console.error(`Failed to insert ${article.slug}:`, error.message)
      process.exit(1)
    }
    console.log(`✓ ${article.slug}`)
  }

  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('category', 'guide')

  if (!error) console.log(`\n✅ Total guide articles: ${data.length}`)
}

main().catch(console.error)
