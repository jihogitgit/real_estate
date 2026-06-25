'use client'
import { StoreProvider, useStore } from './store'
import { AppBar, Sil } from './screens/Nav'
import { Home, SearchResults } from './screens/Home'
import { Detail } from './screens/Detail'
import { LandPage } from './screens/LandPage'
import { AucPage } from './screens/AucPage'
import { T } from './ds'

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 16, color: T.ink3 }}>준비 중입니다</div>
    </div>
  )
}

function Router() {
  const { state, scroller } = useStore()
  const screen = state.route.screen

  let content: React.ReactNode
  switch (screen) {
    case 'home':       content = <Home />; break
    case 'search':     content = <SearchResults />; break
    case 'sil':        content = <Sil />; break
    case 'detail':     content = <Detail />; break
    case 'cheong':     content = <Placeholder title="청약" />; break
    case 'land':
    case 'landDetail': content = <LandPage />; break
    case 'auc':
    case 'aucDetail':  content = <AucPage />; break
    case 'map':        content = <Placeholder title="지도매물" />; break
    case 'mypage':     content = <Placeholder title="마이페이지" />; break
    case 'login':      content = <Placeholder title="로그인" />; break
    default:           content = <Home />
  }

  return (
    <div ref={scroller} style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, overflowY: 'auto' }}>
      <AppBar />
      {content}
    </div>
  )
}

export default function DungjiApp() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  )
}
