// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { MOIS_NOMS } from '@/lib/types'
import { formatChf, formatDuree } from '@/lib/calcul'
import Link from 'next/link'
import { Users, ArrowRight, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Mois courant
  const now = new Date()
  const { data: moisCourant } = await supabase
    .from('mois')
    .select('*')
    .eq('annee', now.getFullYear())
    .eq('mois', now.getMonth() + 1)
    .single()

  // Stats compensations du mois courant
  const { data: comps } = moisCourant ? await supabase
    .from('compensations')
    .select('*, compagnon:compagnons(*)')
    .eq('mois_id', moisCourant.id) : { data: [] }

  // Nombre de compagnons actifs
  const { count: nbCompagnons } = await supabase
    .from('compagnons').select('*', { count: 'exact', head: true }).eq('actif', true)

  const totalChf    = (comps || []).reduce((s: number, c: any) => s + c.total_chf, 0)
  const totalKm     = (comps || []).reduce((s: number, c: any) => s + c.distance_mois_km, 0)
  const totalMin    = (comps || []).reduce((s: number, c: any) => s + c.duree_mois_min, 0)
  const nbCalcules  = (comps || []).length
  const nbRestants  = (nbCompagnons || 0) - nbCalcules

  const stats = [
    { label: 'Compagnons actifs',    value: nbCompagnons || 0,             sub: 'dans la base',         color: 'text-scrasa-green' },
    { label: 'Calculés ce mois',     value: nbCalcules,                    sub: `${nbRestants} restants`, color: 'text-scrasa-gray' },
    { label: 'Distance cumulée',     value: `${totalKm.toFixed(0)} km`,    sub: 'trajets AR/mois',       color: 'text-scrasa-green' },
    { label: 'Budget compensation',  value: formatChf(totalChf),           sub: `${MOIS_NOMS[now.getMonth()+1]} ${now.getFullYear()}`, color: 'text-scrasa-green-dark' },
  ]

  return (
    <div className="min-h-screen bg-scrasa-gray-light">
      <Topbar profile={profile} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-scrasa-gray">
            Bonjour, <span className="text-scrasa-green">{profile?.nom}</span>
          </h1>
          <p className="text-gray-500 mt-1">
            {MOIS_NOMS[now.getMonth()+1]} {now.getFullYear()} —{' '}
            {moisCourant?.statut === 'valide' ? (
              <span className="text-scrasa-green font-medium">✓ Mois validé</span>
            ) : (
              <span className="text-amber-600 font-medium">⏳ En cours de saisie</span>
            )}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card p-5">
              <div className="text-xs text-gray-400 uppercase tracking-wide font-mono mb-2">{s.label}</div>
              <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/compagnons/nouveau" className="card p-6 hover:border-scrasa-green transition-colors group">
            <Users className="text-scrasa-green mb-3" size={24} />
            <h3 className="font-display font-bold text-lg text-scrasa-gray group-hover:text-scrasa-green">
              Ajouter un compagnon
            </h3>
            <p className="text-sm text-gray-400 mt-1">Saisir un nouveau trajet avec calcul automatique</p>
            <ArrowRight size={16} className="text-scrasa-green mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/rapports" className="card p-6 hover:border-scrasa-green transition-colors group">
            <TrendingUp className="text-scrasa-green mb-3" size={24} />
            <h3 className="font-display font-bold text-lg text-scrasa-gray group-hover:text-scrasa-green">
              Rapport mensuel
            </h3>
            <p className="text-sm text-gray-400 mt-1">Exporter le PDF ou CSV pour la fiduciaire</p>
            <ArrowRight size={16} className="text-scrasa-green mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/compagnons" className="card p-6 hover:border-scrasa-green transition-colors group">
            <CheckCircle className="text-scrasa-green mb-3" size={24} />
            <h3 className="font-display font-bold text-lg text-scrasa-gray group-hover:text-scrasa-green">
              Voir tous les trajets
            </h3>
            <p className="text-sm text-gray-400 mt-1">{nbCalcules} trajet(s) calculé(s) ce mois</p>
            <ArrowRight size={16} className="text-scrasa-green mt-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Tableau récapitulatif du mois */}
        {(comps || []).length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-scrasa-border flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-scrasa-gray">
                Aperçu — {MOIS_NOMS[now.getMonth()+1]}
              </h2>
              <Link href="/rapports" className="btn-secondary text-sm py-1.5">
                Rapport complet →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-scrasa-border bg-scrasa-green-light">
                    {['Compagnon','Service','Distance/mois','Temps/mois','Compensation'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-mono text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(comps || []).map((c: any) => (
                    <tr key={c.id} className="border-b border-scrasa-border hover:bg-scrasa-green-light/50">
                      <td className="px-4 py-3 font-medium">{c.compagnon?.prenom} {c.compagnon?.nom}</td>
                      <td className="px-4 py-3 text-gray-400">{c.compagnon?.service || '—'}</td>
                      <td className="px-4 py-3"><span className="badge-green">{c.distance_mois_km.toFixed(0)} km</span></td>
                      <td className="px-4 py-3"><span className="badge-gray">{formatDuree(c.duree_mois_min)}</span></td>
                      <td className="px-4 py-3 font-display font-bold text-scrasa-green-dark">{formatChf(c.total_chf)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-scrasa-green-light font-display font-bold">
                    <td colSpan={2} className="px-4 py-3 text-scrasa-gray">TOTAL</td>
                    <td className="px-4 py-3">{totalKm.toFixed(0)} km</td>
                    <td className="px-4 py-3">{formatDuree(totalMin)}</td>
                    <td className="px-4 py-3 text-scrasa-green-dark text-base">{formatChf(totalChf)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
