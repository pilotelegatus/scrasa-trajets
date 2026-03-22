// lib/ors.ts — OpenRouteService + fallback OSRM
import { Etape, Transport, RouteResult } from './types'

export async function calculateRoute(
  etapes: Pick<Etape, 'lat' | 'lng'>[],
  transport: Transport
): Promise<RouteResult> {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY

  if (apiKey) {
    return calculateORS(etapes, transport, apiKey)
  }
  return calculateOSRM(etapes)
}

async function calculateORS(
  etapes: Pick<Etape, 'lat' | 'lng'>[],
  transport: Transport,
  apiKey: string
): Promise<RouteResult> {
  const coordinates = etapes.map(e => [e.lng, e.lat])
  const res = await fetch(
    `https://api.openrouteservice.org/v2/directions/${transport}/geojson`,
    {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates, instructions: false, geometry: true })
    }
  )
  if (!res.ok) throw new Error(`ORS ${res.status}`)
  const data = await res.json()
  const summary = data.features[0].properties.summary
  const geometry: [number, number][] = data.features[0].geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]]
  )
  return {
    distanceKm: summary.distance / 1000,
    durationMin: summary.duration / 60,
    geometry
  }
}

async function calculateOSRM(
  etapes: Pick<Etape, 'lat' | 'lng'>[]
): Promise<RouteResult> {
  const coordStr = etapes.map(e => `${e.lng},${e.lat}`).join(';')
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`
  )
  if (!res.ok) throw new Error('OSRM error')
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error('Route introuvable')
  const route = data.routes[0]
  const geometry: [number, number][] = route.geometry.coordinates.map(
    (c: number[]) => [c[1], c[0]]
  )
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry
  }
}

export async function geocodeAddress(query: string, apiKey?: string) {
  if (apiKey) {
    const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${apiKey}&text=${encodeURIComponent(query)}&boundary.country=CH,FR,DE,IT&lang=fr&size=5`
    const res = await fetch(url)
    const data = await res.json()
    return (data.features || []).map((f: any) => ({
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    }))
  }
  // Fallback Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ch&accept-language=fr`
  const res = await fetch(url)
  const data = await res.json()
  return data.map((d: any) => ({
    label: d.display_name.split(',').slice(0, 3).join(', '),
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon)
  }))
}
