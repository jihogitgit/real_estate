// src/components/dungji/NaverPanorama.tsx
'use client'
import { useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)
  const panoRef = useRef<{ destroy?: () => void } | null>(null)

  useEffect(() => {
    let attempts = 0
    const tryInit = () => {
      if (!ref.current) return
      if (!window.naver?.maps?.Panorama) {
        if (++attempts < 20) setTimeout(tryInit, 500)
        return
      }
      try {
        panoRef.current = new window.naver.maps.Panorama(ref.current, {
          position: new window.naver.maps.LatLng(lat, lng),
          pov: { pan: 0, tilt: 0, zoom: 1 },
        })
      } catch {
        // 해당 좌표에 로드뷰 없음 — 배경색만 표시
      }
    }
    tryInit()
    return () => {
      panoRef.current?.destroy?.()
      panoRef.current = null
    }
  }, [lat, lng])

  return (
    <div
      ref={ref}
      style={{ width: '100%', height: h, background: '#d1d9e0' }}
    />
  )
}
