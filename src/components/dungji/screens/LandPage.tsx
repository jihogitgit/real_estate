'use client'
import { useStore, DB, Land } from '../store'
import { T, won, Icon, Tag, LineChart } from '../ds'

function DCard({ children, p = 24, style }: { children: React.ReactNode; p?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}`, padding: p, ...style }}>
      {children}
    </div>
  )
}

function DHead({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: T.ink3 }}>{sub}</div>}
    </div>
  )
}

function KV({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: last ? 0 : 12, marginBottom: last ? 0 : 12,
      borderBottom: last ? 'none' : `1px solid ${T.lineSoft}` }}>
      <span style={{ fontSize: 14, color: T.ink3 }}>{k}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{v}</span>
    </div>
  )
}

function LandCard({ land, onNav }: { land: Land; onNav: () => void }) {
  return (
    <div onClick={onNav} style={{ background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}`,
      padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag bg={T.landSoft} color={T.land}>토지</Tag>
          <Tag>{land.jimok}</Tag>
          <Tag>{land.use}</Tag>
        </div>
        <Icon name="chevR" size={18} color={T.ink3} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{land.name}</div>
      <div style={{ fontSize: 13, color: T.ink3 }}>{land.gu} {land.dong} · {land.area}㎡ ({land.py}평) · 도로 {land.road}</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'baseline', marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 11, color: T.ink3, marginBottom: 2 }}>매매가</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: T.ink }}>{won(land.price)}</div>
          <div style={{ fontSize: 12, color: T.ink3 }}>평당 {Math.round(land.price / land.py).toLocaleString()}만</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.ink3, marginBottom: 2 }}>공시지가</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink2 }}>{won(land.gongsi)}</div>
        </div>
      </div>
    </div>
  )
}

function LandDetailView({ land }: { land: Land }) {
  const { back } = useStore()
  const gongsiMax = Math.max(...land.gongsiSeries)
  const LABELS = ['1월', '4월', '7월', '10월', '현재']

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px' }}>
        <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginLeft: -6, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevL" size={24} color={T.ink} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: T.ink, flex: 1 }}>{land.name}</span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <DCard>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <Tag bg={T.landSoft} color={T.land}>토지매매</Tag>
            <Tag>{land.jimok}</Tag>
            <Tag>{land.use}</Tag>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 4 }}>{land.name}</div>
          <div style={{ fontSize: 14, color: T.ink3, marginBottom: 20 }}>{land.gu} {land.dong}</div>
          <div style={{ display: 'flex', gap: 28, paddingBottom: 20, borderBottom: `1px solid ${T.line}` }}>
            <div>
              <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>매매가</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: T.ink }}>{won(land.price)}</div>
              <div style={{ fontSize: 13, color: T.ink3 }}>평당 {Math.round(land.price / land.py).toLocaleString()}만원</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>공시지가</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: T.ink2 }}>{won(land.gongsi)}</div>
            </div>
          </div>
        </DCard>

        <DCard>
          <DHead sub={`최고 ${won(gongsiMax)}`}>공시지가 추이</DHead>
          <div style={{ overflowX: 'auto' }}>
            <LineChart data={land.gongsiSeries} w={560} h={160} color={T.land}
              areaTone="rgba(232,146,12,.08)" labels={LABELS} />
          </div>
        </DCard>

        <DCard>
          <DHead>토지 정보</DHead>
          <KV k="소재지" v={`${land.gu} ${land.dong}`} />
          <KV k="지목" v={land.jimok} />
          <KV k="면적" v={`${land.area}㎡ (${land.py}평)`} />
          <KV k="용도지역" v={land.use} />
          <KV k="도로 조건" v={land.road} />
          <KV k="형상·지세" v={land.shape} last />
        </DCard>
      </div>
    </div>
  )
}

export function LandPage() {
  const { state, nav } = useStore()

  if (state.route.screen === 'landDetail') {
    const id = state.route.params?.id
    const land = DB.land.find((l) => l.id === id) || DB.land[0]
    return <LandDetailView land={land} />
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 4 }}>토지매매</div>
        <div style={{ fontSize: 14, color: T.ink3 }}>전국 토지 실거래 정보</div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DB.land.map((land) => (
          <LandCard key={land.id} land={land} onNav={() => nav('landDetail', { id: land.id })} />
        ))}
      </div>
    </div>
  )
}
