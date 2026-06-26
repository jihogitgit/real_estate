'use client'
import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    naver?: {
      maps?: {
        LatLng: new (lat: number, lng: number) => object
        Panorama: new (
          el: HTMLElement,
          opts: { position: object; pov: { pan: number; tilt: number; zoom: number } }
        ) => { destroy?: () => void }
      }
    }
  }
}

interface Props {
  lat: number
  lng: number
  h?: number
}

export default function NaverPanorama({ lat, lng, h = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panoRef = useRef<{ destroy?: () => void } | null>(null)
  const [visible, setVisible] = useState(false)

  // 뷰포트에 들어올 때만 초기화
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    let attempts = 0
    const tryInit = () => {
      if (cancelled || !containerRef.current) return
      if (!window.naver?.maps?.Panorama) {
        if (++attempts < 20) setTimeout(tryInit, 500)
        return
      }
      try {
        panoRef.current = new window.naver.maps.Panorama(containerRef.current, {
          position: new window.naver.maps.LatLng(lat, lng),
          pov: { pan: 0, tilt: 0, zoom: 1 },
        })
      } catch {
        // 해당 좌표에 로드뷰 없음 — 배경색만 표시
      }
    }
    tryInit()
    return () => {
      cancelled = true
      panoRef.current?.destroy?.()
      panoRef.current = null
    }
  }, [visible, lat, lng])

  return (
    <div ref={containerRef} style={{ width: '100%', height: h, background: '#d1d9e0' }} />
  )
}
