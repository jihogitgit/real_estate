import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read env vars from .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match ? match[1].trim() : null
}

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

// First create articles table if not exists (idempotent)
const articles = [
  {
    slug: 'apt-subscription-intro',
    title: '아파트 청약 완전 입문 가이드',
    summary: '청약 개념부터 통장 종류, 1순위 조건, 신청 절차까지 처음 청약을 준비하는 분을 위한 완전 입문 가이드입니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약이란?</h2>
<p>아파트 청약은 새로 짓는 아파트의 입주자를 모집하는 절차입니다. 건설사나 공공기관이 분양 공고를 내면, 청약 자격을 갖춘 사람이 신청해 가점이나 추첨으로 당첨자를 선발합니다. 당첨되면 시세보다 저렴하게 새 아파트를 살 기회를 얻을 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약통장 종류</h2>
<ul class="list-disc pl-6 space-y-2 text-sm">
<li><strong>주택청약종합저축</strong>: 2009년 5월 이후 신규 가입 가능. 국민주택·민영주택 모두 청약 가능. 현재 신규 가입 가능한 유일한 청약통장.</li>
<li><strong>청약저축</strong>: 국민주택 전용. 2015년 이후 신규 가입 불가.</li>
<li><strong>청약예금/부금</strong>: 민영주택 전용. 2015년 이후 신규 가입 불가.</li>
</ul>
<p class="mt-3">아직 통장이 없다면 지금 바로 은행에서 주택청약종합저축을 개설하세요. 가입일이 1순위 산정 기산점이 됩니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">1순위 자격 요건</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역 구분</th><th class="border p-2">가입기간</th><th class="border p-2">납입횟수</th></tr></thead><tbody><tr><td class="border p-2">투기과열지구</td><td class="border p-2 text-center">24개월</td><td class="border p-2 text-center">24회</td></tr><tr><td class="border p-2">조정대상지역</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td></tr><tr><td class="border p-2">기타 수도권</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td></tr><tr><td class="border p-2">기타 지방</td><td class="border p-2 text-center">6개월</td><td class="border p-2 text-center">6회</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">청약 신청 가능 여부 체크리스트</h2>
<ul class="list-none space-y-2 text-sm"><li>☐ 주택청약종합저축에 가입되어 있다</li><li>☐ 해당 지역 1순위 조건(가입기간·납입횟수)을 충족한다</li><li>☐ 세대주이다 (투기과열지구·조정지역 1순위 필수)</li><li>☐ 세대원 전원이 5년 이내 당첨 이력이 없다</li><li>☐ 무주택 세대주이다 (가점제 적용 시)</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">청약 신청 절차</h2>
<ol class="list-decimal pl-6 space-y-2 text-sm"><li>청약홈(www.applyhome.co.kr) 회원 가입 및 공동인증서 등록</li><li>입주자모집공고 확인 — 공급 위치, 면적, 분양가, 일정 확인</li><li>청약 신청 기간 내 온라인 신청 (특별공급 → 1순위 → 2순위 순서)</li><li>당첨자 발표일 확인 (청약홈 또는 해당 단지 홈페이지)</li><li>당첨 시 서류 제출 및 계약 체결</li></ol>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">본 내용은 참고용이며 실제 청약 신청 전 반드시 <a href="https://www.applyhome.co.kr" class="underline">청약홈 공식 공고문</a>을 확인하세요. 청약 조건은 단지별·지역별로 다를 수 있습니다.</div>`
  },
  {
    slug: 'apt-score-calculation',
    title: '청약 가점 계산법 완벽 정리',
    summary: '무주택 기간 32점, 부양가족 35점, 청약통장 17점. 84점 만점 청약 가점 계산법과 실제 예시를 정리했습니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">청약 가점 구성 (만점 84점)</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">항목</th><th class="border p-2">최대 점수</th><th class="border p-2 text-left">계산 기준</th></tr></thead><tbody><tr><td class="border p-2">무주택 기간</td><td class="border p-2 text-center">32점</td><td class="border p-2">만 30세 이후 무주택 기간 (1년당 2점)</td></tr><tr><td class="border p-2">부양가족 수</td><td class="border p-2 text-center">35점</td><td class="border p-2">0명=5점, 1명=10점, 2명=15점, 3명=20점, 4명=25점, 5명=30점, 6명이상=35점</td></tr><tr><td class="border p-2">청약통장 가입기간</td><td class="border p-2 text-center">17점</td><td class="border p-2">6개월미만=1점, 1년=2점, 2년=3점 … 15년이상=17점</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">무주택 기간 점수 상세</h2>
<p>만 30세가 된 날(또는 혼인 신고일 중 빠른 날)부터 청약 공고일까지 계속 무주택인 기간을 계산합니다. 과거에 집을 소유한 적이 있으면 처분 후 다시 기산합니다.</p>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2">무주택 기간</th><th class="border p-2">점수</th></tr></thead><tbody><tr><td class="border p-2">1년 미만</td><td class="border p-2 text-center">2점</td></tr><tr><td class="border p-2">1~2년</td><td class="border p-2 text-center">4점</td></tr><tr><td class="border p-2">3~4년</td><td class="border p-2 text-center">8점</td></tr><tr><td class="border p-2">7~8년</td><td class="border p-2 text-center">16점</td></tr><tr><td class="border p-2">15년 이상</td><td class="border p-2 text-center">32점</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">실제 계산 예시</h2>
<div class="bg-blue-50 border border-blue-200 rounded p-4 text-sm mt-2"><p class="font-semibold mb-2">📊 케이스: 35세 직장인, 배우자+부모 동거 부양, 청약통장 7년</p><ul class="space-y-1"><li>• 무주택 기간: 만 30세부터 5년 → <strong>10점</strong></li><li>• 부양가족: 배우자 + 부모 2명 = 3명 → <strong>20점</strong></li><li>• 청약통장: 7년 → <strong>8점</strong></li><li class="font-bold mt-2 text-blue-700">총 가점: 38점</li></ul><p class="mt-2 text-gray-500 text-xs">서울 인기 단지 커트라인이 60점대 이상임을 감안하면, 추첨제 비중 높은 단지나 수도권 외곽·지방을 공략하는 전략이 현실적입니다.</p></div>
<h2 class="text-xl font-bold mt-6 mb-3">가점 구간별 전략</h2>
<ul class="list-disc pl-6 space-y-2 text-sm"><li><strong>70점 이상</strong>: 서울 주요 지역 가점제 1순위 당첨 가능권</li><li><strong>50~69점</strong>: 경기·인천 수도권 또는 서울 외곽 단지 도전</li><li><strong>30~49점</strong>: 지방 광역시, 추첨제 비중 높은 85㎡ 초과 평형</li><li><strong>30점 미만</strong>: 특별공급(생애최초·신혼부부) 또는 추첨제 집중 공략</li></ul>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">본 내용은 참고용이며 실제 가점은 청약홈 가점 계산기 또는 공식 공고문을 기준으로 하세요.</div>`
  },
  {
    slug: 'special-supply-types',
    title: '특별공급 종류와 신청 조건 총정리',
    summary: '신혼부부, 생애최초, 다자녀, 노부모부양 등 6가지 특별공급의 자격 요건을 표로 정리했습니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">특별공급이란?</h2>
<p>특별공급은 일반 청약 경쟁에서 불리한 계층(신혼부부, 다자녀가구 등)을 위해 별도 물량을 배정하는 제도입니다. 가점과 관계없이 해당 자격만 갖추면 신청할 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">특별공급 종류별 자격 요건</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">유형</th><th class="border p-2 text-left">주요 자격</th><th class="border p-2 text-left">소득 기준</th></tr></thead><tbody><tr><td class="border p-2 font-medium">신혼부부</td><td class="border p-2">혼인 7년 이내, 전원 무주택</td><td class="border p-2">월평균소득 130%(맞벌이 140%) 이하</td></tr><tr><td class="border p-2 font-medium">생애최초</td><td class="border p-2">생애 최초 주택 구매, 근로·사업소득 있어야 함</td><td class="border p-2">월평균소득 130% 이하</td></tr><tr><td class="border p-2 font-medium">다자녀가구</td><td class="border p-2">미성년 자녀 3명 이상</td><td class="border p-2">일부 단지 소득 기준 있음</td></tr><tr><td class="border p-2 font-medium">노부모부양</td><td class="border p-2">만 65세 이상 직계존속 3년 이상 부양</td><td class="border p-2">없음 (공공주택 제외)</td></tr><tr><td class="border p-2 font-medium">기관추천</td><td class="border p-2">국가유공자, 장애인, 철거민 등</td><td class="border p-2">기관별 상이</td></tr><tr><td class="border p-2 font-medium">이전기관</td><td class="border p-2">혁신도시 이전 공공기관 종사자</td><td class="border p-2">없음</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">신혼부부 특별공급 상세</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>혼인 신고일로부터 7년 이내 (사실혼 포함, 혼인 신고일 기준)</li><li>세대원 전원 무주택 (혼인 전 주택 소유 시 불가)</li><li>자녀 있으면 우선공급 → 일반공급 순서</li><li>소득 기준: 도시근로자 가구원수별 월평균소득 130%(맞벌이 140%) 이하</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">일반공급과 중복 신청</h2>
<p>같은 단지에서 특별공급과 일반공급에 동시 신청하면 <strong>둘 다 무효</strong>입니다. 서로 다른 단지에 각각 신청하는 것은 가능합니다.</p>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">자격 기준은 단지 및 주택 유형(공공·민영)에 따라 다를 수 있으므로 공고문을 반드시 확인하세요.</div>`
  },
  {
    slug: 'priority-one-conditions',
    title: '청약 1순위 조건과 지역별 차이 완전 정리',
    summary: '투기과열지구, 조정대상지역, 비규제지역별 청약 1순위 자격 요건과 세대주 조건을 비교합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">지역별 1순위 요건 비교</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2 text-left">지역 구분</th><th class="border p-2">가입기간</th><th class="border p-2">납입횟수</th><th class="border p-2">세대주</th><th class="border p-2">무주택</th></tr></thead><tbody><tr><td class="border p-2 font-medium">투기과열지구</td><td class="border p-2 text-center">24개월</td><td class="border p-2 text-center">24회</td><td class="border p-2 text-center">필수</td><td class="border p-2 text-center">필수 (85㎡↓)</td></tr><tr><td class="border p-2 font-medium">조정대상지역</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td><td class="border p-2 text-center">필수</td><td class="border p-2 text-center">필수 (85㎡↓)</td></tr><tr><td class="border p-2 font-medium">수도권 기타</td><td class="border p-2 text-center">12개월</td><td class="border p-2 text-center">12회</td><td class="border p-2 text-center">불요</td><td class="border p-2 text-center">불요</td></tr><tr><td class="border p-2 font-medium">지방 기타</td><td class="border p-2 text-center">6개월</td><td class="border p-2 text-center">6회</td><td class="border p-2 text-center">불요</td><td class="border p-2 text-center">불요</td></tr></tbody></table>
<h2 class="text-xl font-bold mt-6 mb-3">투기과열지구란?</h2>
<p>주택 가격 상승 우려가 있는 지역을 국토교통부가 지정합니다. 2025년 기준 서울 전 지역이 투기과열지구에 해당합니다. 이 지역은 청약 요건이 가장 까다롭고, 재당첨 제한 기간도 10년으로 가장 깁니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">재당첨 제한 기간</h2>
<ul class="list-disc pl-6 space-y-1 text-sm"><li>투기과열지구: 당첨일로부터 <strong>10년</strong></li><li>조정대상지역: <strong>7년</strong></li><li>수도권 기타: <strong>5년</strong></li><li>지방 기타: <strong>5년</strong></li><li>분양가상한제 적용 주택: <strong>10년</strong></li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">실전 팁</h2>
<ul class="list-disc pl-6 space-y-2 text-sm"><li>세대주가 아닌 경우 비규제지역 또는 85㎡ 초과 추첨제 물량을 노리세요.</li><li>재당첨 제한 기간 중에도 세대원이 청약하는 것은 가능합니다.</li><li>지역 지정 여부는 국토교통부 홈페이지에서 최신 고시 내용을 확인하세요.</li></ul>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">규제지역 지정·해제는 수시로 변경됩니다. 청약 전 반드시 최신 공고문을 확인하세요.</div>`
  },
  {
    slug: 'seoul-subscription-strategy',
    title: '서울·수도권 청약 전략 가이드',
    summary: '가점 낮아도 서울·수도권에서 청약 당첨되는 현실적인 전략. 추첨제, 특별공급, 틈새 지역을 분석합니다.',
    category: 'guide',
    body: `<p class="text-xs text-gray-400 mb-6">최종 업데이트: 2025-06-01 · 출처: 청약홈, 국토교통부</p>
<h2 class="text-xl font-bold mt-6 mb-3">서울 청약의 현실</h2>
<p>서울 인기 단지 85㎡ 이하 가점제 커트라인은 보통 60~75점입니다. 30~40대 평균 가점이 30~45점 수준임을 감안하면, 가점제로 서울 인기 단지에 당첨되기는 매우 어렵습니다. 그러나 다음 전략으로 기회를 찾을 수 있습니다.</p>
<h2 class="text-xl font-bold mt-6 mb-3">전략 1: 추첨제 비중 높은 면적 공략</h2>
<p>전용면적 85㎡ 초과 중·대형 평형은 추첨제 비중이 50~100%입니다. 가점이 낮아도 추첨으로 당첨 가능합니다.</p>
<ul class="list-disc pl-6 space-y-1 text-sm mt-2"><li>85~102㎡: 추첨제 50%</li><li>102㎡ 초과: 추첨제 100%</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">전략 2: 특별공급 활용</h2>
<ul class="list-disc pl-6 space-y-2 text-sm"><li><strong>신혼부부</strong>: 혼인 7년 이내라면 반드시 검토. 일반공급 경쟁률보다 낮은 경우 많음.</li><li><strong>생애최초</strong>: 소득 기준 맞으면 일반공급 대비 경쟁률 유리.</li><li>특별공급 물량은 전체 공급의 40~50%로, 가점제 경쟁을 피할 수 있음.</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">전략 3: 경기·인천 틈새 공략</h2>
<ul class="list-disc pl-6 space-y-2 text-sm"><li><strong>3기 신도시</strong>(하남교산·남양주왕숙·인천계양 등): 공공분양으로 시세 대비 저렴.</li><li><strong>GTX 연선</strong>: 개통 예정 노선 인근 단지 선제 공략.</li><li><strong>인천 서구·경기 평택</strong>: 상대적으로 경쟁률 낮고 가점 커트라인 낮음.</li></ul>
<h2 class="text-xl font-bold mt-6 mb-3">나에게 맞는 전략 찾기</h2>
<table class="w-full border-collapse text-sm mt-2"><thead><tr class="bg-gray-100"><th class="border p-2">상황</th><th class="border p-2 text-left">추천 전략</th></tr></thead><tbody><tr><td class="border p-2 text-center">가점 30점 미만</td><td class="border p-2">특별공급 + 추첨제 대형 평형 + 경기 외곽</td></tr><tr><td class="border p-2 text-center">가점 30~50점</td><td class="border p-2">경기·인천 가점제 + 추첨제 병행</td></tr><tr><td class="border p-2 text-center">신혼부부</td><td class="border p-2">신혼부부 특공 최우선, 생애최초 병행</td></tr><tr><td class="border p-2 text-center">가점 50점 이상</td><td class="border p-2">서울 외곽·경기 주요 지역 가점제 1순위 도전</td></tr></tbody></table>
<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-600">청약 전략은 개인 상황과 시장 변화에 따라 달라집니다. 실제 신청 전 최신 공고문과 청약홈 안내를 반드시 확인하세요.</div>`
  }
]

async function main() {
  console.log('Inserting 5 core guide articles...')

  for (const article of articles) {
    const { error } = await supabase
      .from('articles')
      .upsert(article, { onConflict: 'slug' })

    if (error) {
      console.error(`Failed to insert ${article.slug}:`, error.message)
      process.exit(1)
    }
    console.log(`✓ Inserted: ${article.slug}`)
  }

  // Verify
  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, length(body)')
    .eq('category', 'guide')
    .in('slug', articles.map(a => a.slug))

  if (error) {
    console.error('Verification failed:', error.message)
    process.exit(1)
  }

  console.log('\n✅ Verification:')
  data.forEach(row => console.log(`  ${row.slug}: inserted`))
  console.log(`\nTotal: ${data.length}/5 articles inserted`)
}

main().catch(console.error)
