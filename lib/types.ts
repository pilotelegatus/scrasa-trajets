// lib/types.ts

export type Role = 'admin' | 'rh'

export interface Profile {
  id: string
  email: string
  nom: string
  role: Role
  actif: boolean
  created_at: string
}

export type Transport = 'driving-car' | 'cycling-regular' | 'foot-walking' | 'driving-hgv'

export interface Etape {
  id?: string
  compagnon_id?: string
  ordre: number
  label: string
  adresse?: string
  lat: number
  lng: number
}

export interface Compagnon {
  id: string
  nom: string
  prenom: string
  email?: string
  service?: string
  transport: Transport
  jours_par_mois: number
  actif: boolean
  created_at: string
  etapes?: Etape[]
}

export type StatutMois = 'ouvert' | 'valide' | 'archive'

export interface Mois {
  id: string
  annee: number
  mois: number
  statut: StatutMois
  taux_horaire: number
  taux_km: number
  valide_par?: string
  valide_le?: string
  created_at: string
}

export interface Compensation {
  id: string
  mois_id: string
  compagnon_id: string
  jours_travailles: number
  distance_aller_km: number
  duree_aller_min: number
  distance_mois_km: number
  duree_mois_min: number
  indem_horaire: number
  indem_km: number
  total_chf: number
  calcule_le: string
  compagnon?: Compagnon
  mois?: Mois
}

export interface RouteResult {
  distanceKm: number
  durationMin: number
  geometry: [number, number][]
}

export const TRANSPORT_LABELS: Record<Transport, string> = {
  'driving-car':      '🚗 Voiture',
  'cycling-regular':  '🚲 Vélo',
  'foot-walking':     '🚶 À pied',
  'driving-hgv':      '🚌 Transport commun',
}

export const MOIS_NOMS = [
  '', 'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]
