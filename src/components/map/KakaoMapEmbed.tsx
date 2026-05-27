'use client'
import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
  name: string
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: object) => object
        LatLng: new (lat: number, lng: number) => object
        Marker: new (options: object) => { setMap: (map: object) => void }
        InfoWindow: new (options: object) => { open: (map: object, marker: object) => void }
      }
    }
  }
}

export default function KakaoMapEmbed({ lat, lng, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !window.kakao) return

    window.kakao.maps.load(() => {
      const container = containerRef.current!
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 4,
      })

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
      })
      marker.setMap(map)

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;">${name}</div>`,
      })
      infoWindow.open(map, marker)
    })
  }, [lat, lng, name])

  return (
    <div
      ref={containerRef}
      className="w-full h-64 rounded-lg bg-gray-100"
      aria-label={`${name} 위치 지도`}
    />
  )
}
