// lib/calcul.ts
import { Mois, Transport } from './types'

export function calculerCompensation(params: {
  distanceKm: number
  durationMin: number
  joursTravailles: number
  mois: Mois
  transport: Transport
}) {
  const { distanceKm, durationMin, joursTravailles, mois, transport } = params
  const isVoiture = transport === 'driving-car' || transport === 'driving-hgv'

  const distanceMoisKm  = distanceKm * 2 * joursTravailles
  const dureeMoisMin    = durationMin * 2 * joursTravailles
  const indemHoraire    = (dureeMoisMin / 60) * mois.taux_horaire
  const indemKm         = isVoiture ? distanceMoisKm * mois.taux_km : 0
  const totalChf        = indemHoraire + indemKm

  return { distanceMoisKm, dureeMoisMin, indemHoraire, indemKm, totalChf }
}

export function formatDuree(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export function formatChf(n: number): string {
  return `CHF ${n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
