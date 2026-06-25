'use client'
import { useState, useEffect } from 'react'
import { useStore, DB, RTMS, Auction } from '../store'
import { T, won, Icon, Tag, Bars, Button } from '../ds'

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

function rateColor(rate: number) {
  return rate < 55 ? T.up : rate < 75 ? T.land : T.sil
}

function AucCard({ auc, onNav }: { auc: Auction; onNav: () => void }) {
  return (
    <div onClick={onNav} style={{ background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}`,
      padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag bg={T.aucSoft} color={T.auc}>경매</Tag>
          <Tag>{auc.type}</Tag>
        </div>
        <Tag bg={auc.dday <= 2 ? T.hotSoft : T.lineSoft} color={auc.dday <= 2 ? T.hot : T.ink3}>{auc.when}</Tag>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{auc.name}</div>
      <div style={{ fontSize: 13, color: T.ink3 }}>{auc.court} · {auc.caseNo}</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, color: T.ink3, marginBottom: 2 }}>감정가</div>
          <div style={{ fontSize: 14, color: T.ink2, fontWeight: 600 }}>{won(auc.appr)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.ink3, marginBottom: 2 }}>최저입찰가</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: T.ink }}>{won(auc.low)}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 11, color: T.ink3, marginBottom: 2 }}>낙찰가율</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: rateColor(auc.rate) }}>{auc.rate}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: T.ink3 }}>
          유찰 {auc.tries - 1}회 · {typeof auc.ex === 'number' ? `${auc.ex}㎡` : auc.ex} · {auc.floor}층
        </div>
        <Icon name="chevR" size={18} color={T.ink3} />
      </div>
    </div>
  )
}

function AucDetailView({ auc }: { auc: Auction }) {
  const { back } = useStore()
  const barsData = [100, Math.round(auc.rate * 1.2), Math.round(auc.rate * 1.05), auc.rate]
  const barsLabels = ['감정가', '1차', '2차', '최저']

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px' }}>
        <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginLeft: -6, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevL" size={24} color={T.ink} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: T.ink, flex: 1 }}>{auc.name}</span>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <DCard>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <Tag bg={T.aucSoft} color={T.auc}>경매</Tag>
            <Tag>{auc.type}</Tag>
            <Tag bg={auc.dday <= 2 ? T.hotSoft : T.lineSoft} color={auc.dday <= 2 ? T.hot : T.ink3}>{auc.when}</Tag>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 4 }}>{auc.name}</div>
          <div style={{ fontSize: 14, color: T.ink3, marginBottom: 20 }}>{auc.court} · {auc.caseNo}</div>
          <div style={{ display: 'flex', gap: 28, paddingBottom: 20, borderBottom: `1px solid ${T.line}` }}>
            <div>
              <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>최저입찰가</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: T.ink }}>{won(auc.low)}</div>
              <div style={{ fontSize: 13, color: T.ink3 }}>감정가 {won(auc.appr)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.ink3, marginBottom: 2 }}>낙찰가율</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: rateColor(auc.rate) }}>{auc.rate}%</div>
            </div>
          </div>
        </DCard>

        <DCard>
          <DHead>입찰가 현황</DHead>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <Bars data={barsData} w={280} h={130} color={T.auc} labels={barsLabels} />
          </div>
        </DCard>

        <DCard>
          <DHead>경매 정보</DHead>
          <KV k="법원" v={auc.court} />
          <KV k="사건번호" v={auc.caseNo} />
          <KV k="물건 유형" v={auc.type} />
          <KV k="감정가" v={won(auc.appr)} />
          <KV k="최저입찰가" v={won(auc.low)} />
          <KV k="낙찰가율" v={`${auc.rate}%`} />
          <KV k="유찰 횟수" v={`${auc.tries - 1}회`} />
          <KV k="면적" v={typeof auc.ex === 'number' ? `${auc.ex}㎡` : String(auc.ex)} />
          <KV k="층" v={auc.floor} />
          <KV k="준공연도" v={typeof auc.built === 'number' ? `${auc.built}년` : String(auc.built)} last />
        </DCard>

        <Button kind="primary" size="lg" full icon="gavel">입찰 참여 안내</Button>
      </div>
    </div>
  )
}

export function AucPage() {
  const { state, nav } = useStore()
  const [auctions, setAuctions] = useState<Auction[]>([])

  useEffect(() => {
    RTMS.getAuctions().then(setAuctions)
  }, [])

  if (state.route.screen === 'aucDetail') {
    const id = state.route.params?.id
    const auc = DB.auction.find((a) => a.id === id) || DB.auction[0]
    return <AucDetailView auc={auc} />
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 4 }}>경매</div>
        <div style={{ fontSize: 14, color: T.ink3 }}>법원 경매 물건 정보</div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {auctions.length === 0
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{ height: 160, background: T.card, borderRadius: T.rCard, border: `1px solid ${T.line}` }} />
            ))
          : auctions.map((auc) => (
              <AucCard key={auc.id} auc={auc} onNav={() => nav('aucDetail', { id: auc.id })} />
            ))}
      </div>
    </div>
  )
}
