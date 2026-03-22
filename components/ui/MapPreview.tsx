'use client'
// components/ui/MapPreview.tsx
import { useEffect, useRef } from 'react'

interface Props {
  etapes: { label: string; lat: number; lng: number }[]
  geometry?: [number, number][]
}

export default function MapPreview({ etapes, geometry }: Props) {
  const mapRef    = useRef<any>(null)
  const mapObjRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    import('leaflet').then(L => {
      if (!mapRef.current) return

      if (!mapObjRef.current) {
        mapObjRef.current = L.map(mapRef.current).setView([46.8, 8.2], 7)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(mapObjRef.current)
      }

      // Nettoyer les layers précédents
      layersRef.current.forEach(l => l.remove())
      layersRef.current = []
      const map = mapObjRef.current

      if (geometry && geometry.length > 0) {
        const line = L.polyline(geometry, { color: '#4aab4e', weight: 4, opacity: 0.85 })
        line.addTo(map)
        layersRef.current.push(line)
      }

      etapes.forEach((e, i) => {
        const isFirst = i === 0
        const isLast  = i === etapes.length - 1
        const color   = isFirst ? '#2e7d32' : isLast ? '#d63b2f' : '#4aab4e'
        const icon    = L.divIcon({
          className: '',
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconAnchor: [7, 7]
        })
        const marker = L.marker([e.lat, e.lng], { icon })
          .bindTooltip(e.label.split(',')[0])
          .addTo(map)
        layersRef.current.push(marker)
      })

      if (etapes.length > 0) {
        const points = [
          ...(geometry || []),
          ...etapes.map(e => [e.lat, e.lng] as [number, number])
        ]
        map.fitBounds(L.latLngBounds(points), { padding: [24, 24] })
      }
    })
  }, [etapes, geometry])

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 400 }}>
      <div ref={mapRef} style={{ height: '100%', minHeight: 400 }} />
      {etapes.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', pointerEvents: 'none'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 8, padding: '12px 20px', fontSize: 13, color: '#888' }}>
            Le trajet s'affichera ici après calcul
          </div>
        </div>
      )}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    </div>
  )
}
