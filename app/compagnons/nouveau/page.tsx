'use client'
// app/compagnons/nouveau/page.tsx
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateRoute, geocodeAddress } from '@/lib/ors'
import { calculerCompensation, formatChf, formatDuree } from '@/lib/calcul'
import { Transport, TRANSPORT_LABELS, Etape, Mois } from '@/lib/types'
import { Plus, Trash2, ArrowLeft, MapPin, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapPreview = dynamic(() => import('@/components/ui/MapPreview'), { ssr: false })

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface EtapeForm { label: string; lat: number | null; lng: number | null }

export default function NouveauCompagnonPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nom, setNom]           = useState('')
  const [prenom, setPrenom]     = useState('')
  const [email, setEmail]       = useState('')
  const [service, setService]   = useState('')
  const [transport, setTransport] = useState<Transport>('driving-car')
  const [jours, setJours]       = useState(22)
  const [etapes, setEtapes]     = useState<EtapeForm[]>([
    { label: '', lat: null, lng: null },
    { label: '', lat: null, lng: null },
  ])
  const [suggestions, setSuggestions]   = useState<{ idx: number; items: any[] } | null>(null)
  const [routeResult, setRouteResult]   = useState<any>(null)
  const [compensation, setCompensation] = useState<any>(null)
  const [mois, setMois]                 = useState<Mois | null>(null)
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const acTimers = useRef<Record<number, any>>({})

  useEffect(() => {
    const now = new Date()
    supabase
      .from('mois')
      .select('*')
      .eq('annee', now.getFullYear())
      .eq('mois', now.getMonth() + 1)
      .single()
      .then(({ data }) => setMois(data))
  }, [])

  // Autocomplete
  const handleEtapeInput = (idx: number, value: string) => {
    const updated = [...etapes]
    updated[idx] = { label: value, lat: null, lng: null }
    setEtapes(updated)
    clearTimeout(acTimers.current[idx])
    if (value.length < 3) { setSuggestions(null); return }
    acTimers.current[idx] = setTimeout(async () => {
      const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
      const items = await geocodeAddress(value, apiKey)
      setSuggestions({ idx, items })
    }, 350)
  }

  const selectSuggestion = (idx: number, item: any) => {
    const updated = [...etapes]
    updated[idx] = { label: item.label.split(',').slice(0,3).join(', '), lat: item.lat, lng: item.lng }
    setEtapes(updated)
    setSuggestions(null)
  }

  const addEtape = () => setEtapes([...etapes.slice(0, -1), { label: '', lat: null, lng: null }, etapes[etapes.length - 1]])
  const removeEtape = (idx: number) => setEtapes(etapes.filter((_, i) => i !== idx))

  const handleCalculer = async () => {
    setError('')
    const valid = etapes.filter(e => e.lat !== null)
    if (valid.length < 2) { setError('Sélectionnez au moins un départ et une destination.'); return }
    setLoading(true)
    try {
      const result = await calculateRoute(
        valid.map(e => ({ lat: e.lat!, lng: e.lng! })),
        transport
      )
      setRouteResult(result)
      if (mois) {
        const calc = calculerCompensation({
          distanceKm: result.distanceKm,
          durationMin: result.durationMin,
          joursTravailles: jours,
          mois,
          transport
        })
        setCompensation(calc)
      }
    } catch (e: any) {
      setError(`Erreur calcul trajet : ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!routeResult || !compensation || !mois) return
    setSaving(true)
    try {
      // 1. Créer le compagnon
      const { data: compagnon, error: errC } = await supabase
        .from('compagnons')
        .insert({ nom, prenom, email, service, transport, jours_par_mois: jours })
        .select().single()
      if (errC) throw errC

      // 2. Enregistrer les étapes
      const etapesValides = etapes.filter(e => e.lat !== null)
      await supabase.from('etapes').insert(
        etapesValides.map((e, i) => ({
          compagnon_id: compagnon.id,
          ordre: i,
          label: e.label,
          lat: e.lat,
          lng: e.lng
        }))
      )

      // 3. Enregistrer la compensation du mois courant
      await supabase.from('compensations').insert({
        mois_id: mois.id,
        compagnon_id: compagnon.id,
        jours_travailles: jours,
        distance_aller_km: routeResult.distanceKm,
        duree_aller_min: routeResult.durationMin,
        distance_mois_km: compensation.distanceMoisKm,
        duree_mois_min: compensation.dureeMoisMin,
        indem_horaire: compensation.indemHoraire,
        indem_km: compensation.indemKm,
        total_chf: compensation.totalChf
      })

      router.push('/compagnons')
    } catch (e: any) {
      setError(`Erreur sauvegarde : ${e.message}`)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-scrasa-gray-light">
      {/* Topbar chargée côté client via wrapper — simplifiée ici */}
      <header className="bg-scrasa-gray border-b-4 border-scrasa-green h-14 flex items-center px-6 gap-4">
        <div className="bg-scrasa-green text-white font-display font-black text-lg px-3 py-1 rounded">SCRASA</div>
        <span className="text-gray-400 text-sm">Compensations Trajets</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2 py-1.5">
            <ArrowLeft size={15} /> Retour
          </button>
          <h1 className="font-display font-bold text-3xl text-scrasa-gray">Nouveau compagnon</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulaire gauche */}
          <div className="space-y-4">
            {/* Infos personnelles */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-scrasa-gray mb-4">Informations</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom *</label>
                  <input className="input" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Sophie" />
                </div>
                <div>
                  <label className="label">Nom *</label>
                  <input className="input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Müller" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="s.muller@scrasa.ch" />
                </div>
                <div>
                  <label className="label">Service</label>
                  <input className="input" value={service} onChange={e => setService(e.target.value)} placeholder="Génie civil" />
                </div>
              </div>
            </div>

            {/* Trajet */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-scrasa-gray mb-4">Trajet</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">Transport</label>
                  <select className="input" value={transport} onChange={e => setTransport(e.target.value as Transport)}>
                    {Object.entries(TRANSPORT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Jours travaillés / mois</label>
                  <input className="input" type="number" value={jours} min={1} max={31}
                    onChange={e => setJours(parseInt(e.target.value))} />
                </div>
              </div>

              {/* Étapes */}
              <div className="space-y-2 mb-3">
                {etapes.map((etape, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-scrasa-green-light border border-scrasa-border flex items-center justify-center text-xs font-mono text-scrasa-gray flex-shrink-0">
                      {LETTERS[idx]}
                    </div>
                    <div className="relative flex-1">
                      <input
                        className="input"
                        placeholder={idx === 0 ? 'Domicile…' : idx === etapes.length - 1 ? 'Destination…' : 'Étape intermédiaire…'}
                        value={etape.label}
                        onChange={e => handleEtapeInput(idx, e.target.value)}
                        onBlur={() => setTimeout(() => setSuggestions(null), 200)}
                      />
                      {etape.lat && (
                        <MapPin size={14} className="absolute right-3 top-3 text-scrasa-green" />
                      )}
                      {suggestions?.idx === idx && suggestions.items.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-scrasa-green rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.items.map((item, i) => (
                            <div key={i} className="px-3 py-2 text-sm cursor-pointer hover:bg-scrasa-green-light border-b border-scrasa-border last:border-0"
                              onMouseDown={() => selectSuggestion(idx, item)}>
                              <div className="font-medium">{item.label.split(',')[0]}</div>
                              <div className="text-xs text-gray-400">{item.label.split(',').slice(1,3).join(',')}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {etapes.length > 2 && idx > 0 && idx < etapes.length - 1 && (
                      <button onClick={() => removeEtape(idx)} className="text-gray-300 hover:text-red-400 p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addEtape} className="w-full border border-dashed border-scrasa-border rounded-lg py-2 text-sm text-gray-400 hover:border-scrasa-green hover:text-scrasa-green transition-colors flex items-center justify-center gap-2 mb-4">
                <Plus size={14} /> Ajouter une étape intermédiaire
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
              )}

              <button onClick={handleCalculer} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Calcul en cours…</> : '📍 Calculer le trajet'}
              </button>
            </div>

            {/* Résultat */}
            {routeResult && compensation && mois && (
              <div className="card p-6 border-scrasa-green">
                <h2 className="font-display font-bold text-lg text-scrasa-green mb-4">Résultat du calcul</h2>
                <div className="space-y-2 text-sm">
                  {[
                    ['Distance (1 sens)',          `${routeResult.distanceKm.toFixed(1)} km`],
                    ['Durée (1 sens)',              formatDuree(routeResult.durationMin)],
                    ['Distance mensuelle (AR)',     `${compensation.distanceMoisKm.toFixed(0)} km`],
                    ['Temps mensuel (AR)',          formatDuree(compensation.dureeMoisMin)],
                    ['Indemnité horaire',           formatChf(compensation.indemHoraire)],
                    ['Indemnité kilométrique',      formatChf(compensation.indemKm)],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-1.5 border-b border-scrasa-border">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-mono font-medium">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3">
                    <span className="font-display font-bold text-scrasa-gray text-base">Total mensuel</span>
                    <span className="font-display font-bold text-scrasa-green-dark text-2xl">{formatChf(compensation.totalChf)}</span>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving || !nom || !prenom} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : '✓ Enregistrer le compagnon'}
                </button>
              </div>
            )}
          </div>

          {/* Carte droite */}
          <div className="card overflow-hidden" style={{ minHeight: 400 }}>
            <div className="px-5 py-3 border-b border-scrasa-border">
              <h2 className="font-display font-bold text-lg text-scrasa-gray">Carte du trajet</h2>
            </div>
            <MapPreview
              etapes={etapes.filter(e => e.lat !== null) as any}
              geometry={routeResult?.geometry}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
