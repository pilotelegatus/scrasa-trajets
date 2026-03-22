// app/compagnons/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { TRANSPORT_LABELS, MOIS_NOMS } from '@/lib/types'
import { formatChf, formatDuree } from '@/lib/calcul'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

export default async function CompagnonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const now = new Date()
  const { data: moisCourant } = await supabase
    .from('mois').select('*')
    .eq('annee', now.getFullYear()).eq('mois', now.getMonth() + 1).single()

  const { data: compagnons } = await supabase
    .from('compagnons').select('*, etapes(*)').eq('actif', true).order('nom')

  const { data: comps } = moisCourant ? await supabase
    .from('compensations').select('*').eq('mois_id', moisCourant.id) : { data: [] }

  const compMap = new Map((comps || []).map((c: any) => [c.compagnon_id, c]))

  return (
    <div className="min-h-screen bg-scrasa-gray-light">
      <Topbar profile={profile} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-4xl text-scrasa-gray">Compagnons</h1>
            <p className="text-gray-400 mt-1">
              {compagnons?.length || 0} compagnon(s) actif(s) ·{' '}
              {MOIS_NOMS[now.getMonth()+1]} {now.getFullYear()}
            </p>
          </div>
          <Link href="/compagnons/nouveau" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau compagnon
          </Link>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-scrasa-border bg-scrasa-green-light">
                {['Compagnon','Service','Transport','Trajet','Ce mois','Compensation','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(compagnons || []).map((c: any) => {
                const comp = compMap.get(c.id)
                return (
                  <tr key={c.id} className="border-b border-scrasa-border hover:bg-scrasa-green-light/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.prenom} {c.nom}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.service || '—'}</td>
                    <td className="px-4 py-3 text-base">{TRANSPORT_LABELS[c.transport as keyof typeof TRANSPORT_LABELS]}</td>
                    <td className="px-4 py-3">
                      {(c.etapes || []).sort((a: any,b: any) => a.ordre - b.ordre).map((e: any, i: number) => (
                        <span key={e.id}>
                          {i > 0 && <span className="text-gray-300 mx-1">→</span>}
                          <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{e.label.split(',')[0]}</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {comp ? (
                        <span className="badge-green">{comp.distance_mois_km.toFixed(0)} km · {formatDuree(comp.duree_mois_min)}</span>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Non calculé</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-display font-bold">
                      {comp ? (
                        <span className="text-scrasa-green-dark">{formatChf(comp.total_chf)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/compagnons/${c.id}`}
                        className="text-gray-400 hover:text-scrasa-green transition-colors p-1.5 rounded hover:bg-scrasa-green-light inline-flex"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(!compagnons || compagnons.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 opacity-30">👷</div>
              <p className="font-medium">Aucun compagnon enregistré</p>
              <p className="text-sm mt-1">Cliquez sur "Nouveau compagnon" pour commencer</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
