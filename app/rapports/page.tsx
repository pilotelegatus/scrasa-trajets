// app/rapports/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { MOIS_NOMS } from '@/lib/types'
import { formatChf, formatDuree } from '@/lib/calcul'
import RapportActions from '@/components/ui/RapportActions'

export default async function RapportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Tous les mois avec leurs compensations
  const { data: moisList } = await supabase
    .from('mois')
    .select('*')
    .order('annee', { ascending: false })
    .order('mois', { ascending: false })

  // Compensations pour chaque mois
  const moisAvecData = await Promise.all(
    (moisList || []).map(async (m: any) => {
      const { data: comps } = await supabase
        .from('compensations')
        .select('*, compagnon:compagnons(*)')
        .eq('mois_id', m.id)
      return {
        ...m,
        compensations: comps || [],
        totalChf: (comps || []).reduce((s: number, c: any) => s + c.total_chf, 0),
        totalKm:  (comps || []).reduce((s: number, c: any) => s + c.distance_mois_km, 0),
      }
    })
  )

  return (
    <div className="min-h-screen bg-scrasa-gray-light">
      <Topbar profile={profile} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-4xl text-scrasa-gray">Rapports</h1>
          <p className="text-gray-400 mt-1">Historique des compensations par mois</p>
        </div>

        <div className="space-y-6">
          {moisAvecData.map((m: any) => (
            <div key={m.id} className="card overflow-hidden">
              {/* Header mois */}
              <div className="px-6 py-4 border-b border-scrasa-border flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <h2 className="font-display font-bold text-2xl text-scrasa-gray">
                    {MOIS_NOMS[m.mois]} {m.annee}
                  </h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    m.statut === 'valide'   ? 'bg-scrasa-green-light text-scrasa-green-dark' :
                    m.statut === 'archive'  ? 'bg-gray-100 text-gray-500' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {m.statut === 'valide' ? '✓ Validé' : m.statut === 'archive' ? 'Archivé' : '⏳ En cours'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono">Budget</div>
                    <div className="font-display font-bold text-scrasa-green-dark text-lg">{formatChf(m.totalChf)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono">Compagnons</div>
                    <div className="font-display font-bold text-scrasa-gray">{m.compensations.length}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono">Distance</div>
                    <div className="font-display font-bold text-scrasa-gray">{m.totalKm.toFixed(0)} km</div>
                  </div>
                  <RapportActions mois={m} compensations={m.compensations} isAdmin={profile?.role === 'admin'} />
                </div>
              </div>

              {/* Tableau */}
              {m.compensations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-scrasa-border bg-scrasa-green-light">
                        {['Compagnon','Service','Jours','Distance/mois','Temps/mois','Indem. horaire','Indem. km','Total'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-mono text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {m.compensations.map((c: any) => (
                        <tr key={c.id} className="border-b border-scrasa-border hover:bg-scrasa-green-light/30">
                          <td className="px-4 py-3 font-medium">{c.compagnon?.prenom} {c.compagnon?.nom}</td>
                          <td className="px-4 py-3 text-gray-400">{c.compagnon?.service || '—'}</td>
                          <td className="px-4 py-3 font-mono text-gray-500">{c.jours_travailles}j</td>
                          <td className="px-4 py-3"><span className="badge-green">{c.distance_mois_km.toFixed(0)} km</span></td>
                          <td className="px-4 py-3"><span className="badge-gray">{formatDuree(c.duree_mois_min)}</span></td>
                          <td className="px-4 py-3 font-mono">{formatChf(c.indem_horaire)}</td>
                          <td className="px-4 py-3 font-mono">{formatChf(c.indem_km)}</td>
                          <td className="px-4 py-3 font-display font-bold text-scrasa-green-dark">{formatChf(c.total_chf)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-scrasa-green-light font-display font-bold">
                        <td colSpan={3} className="px-4 py-3 text-scrasa-gray">TOTAL</td>
                        <td className="px-4 py-3">{m.totalKm.toFixed(0)} km</td>
                        <td className="px-4 py-3">{formatDuree(m.compensations.reduce((s: number, c: any) => s + c.duree_mois_min, 0))}</td>
                        <td className="px-4 py-3">{formatChf(m.compensations.reduce((s: number, c: any) => s + c.indem_horaire, 0))}</td>
                        <td className="px-4 py-3">{formatChf(m.compensations.reduce((s: number, c: any) => s + c.indem_km, 0))}</td>
                        <td className="px-4 py-3 text-scrasa-green-dark text-base">{formatChf(m.totalChf)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400 text-sm">Aucune compensation enregistrée pour ce mois.</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
