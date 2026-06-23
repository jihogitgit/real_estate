# 둥지 부동산 — Naver 로드뷰 + Supabase 실데이터 연동 설계

**날짜:** 2026-06-23  
**범위:** 메뉴 숨김 / Supabase 실데이터 API 라우트 / Geocoding 배치 + 온디맨드 / Naver 로드뷰 파노라마

---

## 1. 메뉴 숨김

`Nav.tsx`의 `NAVS` 배열에서 `cheong`, `land`, `auc` 항목 제거.  
`Home.tsx`에서 카테고리 타일(청약·토지매매·경매), 검색 필터 탭, 청약 섹션 제거.  
`DungjiApp.tsx`의 Router는 변경하지 않는다 — URL 직접 접근 시 기존 페이지가 그대로 뜨는 것은 허용.

---

## 2. Supabase 실데이터 API 라우트

### 2-1. `/api/dungji/complexes/route.ts`

**입력:** `?regions=강남구,서초구` (선택), `?q=래미안` (검색, 선택)

**처리:**
1. `properties` 테이블 조회 (lawd_cd, umd_nm, name, build_year, apt_seq, lat, lng)
2. 각 property_id에 대해 `transactions` 집계:
   - 면적 구간: `<65㎡(18평)`, `65–95㎡(25평)`, `95–120㎡(33평)`, `>120㎡(39평)` — 구간별 최근 매매·전세 평균가 → `areas[]`
   - 최근 12개월 월별 매매 평균가 → `series[]` (마지막 7개 → `spark[]`)
   - 거래량 기준 `rankd` 계산 (상위 10위 이내 양수, 나머지 음수)
3. `hh` (세대수): RTMS에 없으므로 `null` → 프론트에서 `c.hh?.toLocaleString() ?? '-'` 처리
4. `xy`: `[lat, lng]` — `geocoded_at IS NOT NULL && lat IS NOT NULL`인 경우에만 포함, 없으면 `null`
5. `Complex` 타입으로 직렬화 후 반환

**쿼리 전략:** Supabase RPC 또는 서버사이드 집계. 단지 수가 많으면 페이지네이션 추가 (`limit=20`, `offset`).

### 2-2. `/api/dungji/trades/route.ts`

**입력:** `?id=<property_id>`

**처리:**
1. `transactions` 테이블에서 해당 property_id의 최근 거래 20건 조회
2. `Trade[]` 형태로 변환: `{ date, ex, py, floor, price, deal, tag }`
3. `tag`: 동일 단지·동일 면적 구간 거래 중 최근 3개월 내 최고가 거래 1건에 `'신고가'`

---

## 3. DB 마이그레이션

`properties` 테이블에 컬럼 3개 추가:

```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS lat  NUMERIC,
  ADD COLUMN IF NOT EXISTS lng  NUMERIC,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
```

Supabase 대시보드 SQL Editor 또는 마이그레이션 파일로 실행.

---

## 4. Geocoding 배치 스크립트 + GitHub Actions

### 4-1. `scripts/geocode-properties.mjs`

**동작:**
1. `WHERE geocoded_at IS NULL` 인 properties 조회 (미처리 건만)
2. 각 property에 대해 Naver Geocoding API 호출:
   - `GET https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query={name} {umd_nm}`
   - Header: `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`
3. 결과:
   - 좌표 있음 → `lat`, `lng`, `geocoded_at = NOW()` UPDATE
   - 좌표 없음 → `geocoded_at = NOW()` 만 UPDATE (lat/lng는 NULL 유지)
4. 동시성 제한: concurrency pool 5 (Geocoding API rate limit 고려)
5. 완료 후 통계 출력: `geocoded: N, not_found: M, skipped: K`

**재시도 정책:** `geocoded_at IS NULL`만 처리하므로 실패 건은 재시도하지 않음. 수동으로 특정 건 재처리 필요 시 `--reset-id=<id>` 플래그로 geocoded_at을 NULL로 초기화.

### 4-2. `.github/workflows/geocode-properties.yml`

- 수동 트리거(`workflow_dispatch`) 전용
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`

### 4-3. 온디맨드 Geocoding (API 라우트 내)

`/api/dungji/complexes`에서 `geocoded_at IS NULL`인 property 발견 시:
- 비동기로 Geocoding 호출 후 DB 업데이트 (응답을 blocking하지 않음)
- 현재 요청에서는 `xy: null` 반환 → 다음 요청부터 좌표 포함

---

## 5. Naver 로드뷰 파노라마 컴포넌트

### 5-1. SDK 로드

`src/app/layout.tsx`에 Naver Maps JS SDK를 Next.js `<Script>` 컴포넌트로 추가:

```tsx
<Script
  src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=ckd59ofa78&submodules=panorama`}
  strategy="afterInteractive"
/>
```

### 5-2. `NaverPanorama` 컴포넌트

위치: `src/components/dungji/NaverPanorama.tsx`

```
props: { lat: number; lng: number; h?: number }
```

- `useEffect`로 `naver.maps.Panorama` 인스턴스 생성
- `window.naver` 로드 전이면 polling (500ms interval, max 10회)
- 언마운트 시 cleanup
- 로드뷰 없는 위치에서는 Naver Maps 기본 지도 이미지로 폴백 (Panorama의 `errorCallback` 활용)

### 5-3. Detail.tsx 히어로 영역 교체

```tsx
// 기존
<Ph h={200} label={c.name} style={{ borderRadius: 0 }} />

// 변경
{c.xy !== null
  ? <NaverPanorama lat={c.xy[0]} lng={c.xy[1]} h={200} />
  : <Ph h={200} label={c.name} style={{ borderRadius: 0 }} />
}
```

`Complex.xy` 타입: `[number, number] | null`로 변경.

---

## 6. 환경변수 추가

`.env.local`에 추가:
```
NAVER_CLIENT_ID=ckd59ofa78
NAVER_CLIENT_SECRET=<시크릿>   # 서버사이드 전용, 절대 NEXT_PUBLIC_ 금지
```

GitHub Actions Secrets에도 동일하게 등록.

---

## 7. 구현 순서

1. DB 마이그레이션 (lat/lng/geocoded_at 컬럼 추가)
2. Geocoding 스크립트 + GitHub Actions 워크플로우
3. `/api/dungji/complexes/route.ts`
4. `/api/dungji/trades/route.ts`
5. `NaverPanorama` 컴포넌트 + SDK 스크립트 태그
6. `Detail.tsx` 히어로 영역 교체
7. `Nav.tsx`, `Home.tsx` 메뉴 숨김
8. TypeScript 타입 정리 (`Complex.xy`, `Complex.hh` nullable 처리)
