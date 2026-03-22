'use client'
// components/ui/AdminClient.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Mois, MOIS_NOMS } from '@/lib/types'
import { UserPlus, Save, Loader2, Shield, User } from 'lucide-react'

interface Props { profiles: Profile[]; moisList: Mois[] }

export default function AdminClient({ profiles: initialProfiles, moisList }: Props) {
  const supabase = createClient()
  const [profiles, setProfiles]   = useState(initialProfiles)
  const [newEmail, setNewEmail]   = useState('')
  const [newNom, setNewNom]       = useState('')
  const [newRole, setNewRole]     = useState<'rh' | 'admin'>('rh')
  const [newPwd, setNewPwd]       = useState('')
  const [creating, setCreating]   = useState(false)
  const [createError, setCreateError] = useState('')
  const [createOk, setCreateOk]   = useState('')
  const [baremeSaving, setBaremeSaving] = useState<string | null>(null)
  const [baremeValues, setBaremeValues] = useState<Record<string, { taux_horaire: number; taux_km: number }>>(
    Object.fromEntries(moisList.map(m => [m.id, { taux_horaire: m.taux_horaire, taux_km: m.taux_km }]))
  )

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setCreateError(''); setCreateOk('')
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, nom: newNom, role: newRole, password: newPwd })
    })
    const data = await res.json()
    if (!res.ok) { setCreateError(data.error || 'Erreur'); }
    else {
      setCreateOk(`Compte créé pour ${newEmail}`)
      setNewEmail(''); setNewNom(''); setNewPwd('')
    }
    setCreating(false)
  }

  const handleBaremeSave = async (moisId: string) => {
    setBaremeSaving(moisId)
    const vals = baremeValues[moisId]
    await supabase.from('mois').update({ taux_horaire: vals.taux_horaire, taux_km: vals.taux_km }).eq('id', moisId)
    setBaremeSaving(null)
  }

  const handleToggleActif = async (p: Profile) => {
    await supabase.from('profiles').update({ actif: !p.actif }).eq('id', p.id)
    setProfiles(profiles.map(x => x.id === p.id ? { ...x, actif: !x.actif } : x))
  }

  return (
    <div className="space-y-6">
      {/* Gestion comptes */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-xl text-scrasa-gray mb-4 flex items-center gap-2">
          <User size={18} className="text-scrasa-green" /> Comptes RH
        </h2>

        {/* Liste */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-scrasa-border bg-scrasa-green-light">
                {['Nom','Email','Rôle','Statut'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-mono text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-b border-scrasa-border">
                  <td className="px-4 py-3 font-medium">{p.nom}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.email}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs ${p.role === 'admin' ? 'text-scrasa-green-dark' : 'text-gray-500'}`}>
                      {p.role === 'admin' ? <Shield size={13} /> : <User size={13} />}
                      {p.role === 'admin' ? 'Administrateur' : 'RH'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActif(p)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${p.actif ? 'bg-scrasa-green-light text-scrasa-green-dark hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-scrasa-green-light hover:text-scrasa-green-dark'}`}>
                      {p.actif ? '✓ Actif' : '✗ Inactif'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Créer un compte */}
        <h3 className="font-display font-bold text-base text-scrasa-gray mb-3 flex items-center gap-2">
          <UserPlus size={15} className="text-scrasa-green" /> Créer un compte
        </h3>
        <form onSubmit={handleCreateUser} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Marie Dupont" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="m.dupont@scrasa.ch" required />
          </div>
          <div>
            <label className="label">Mot de passe initial</label>
            <input className="input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="min. 8 caractères" required minLength={8} />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={newRole} onChange={e => setNewRole(e.target.value as any)}>
              <option value="rh">RH standard</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {createError && <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</div>}
          {createOk   && <div className="sm:col-span-2 text-sm text-scrasa-green-dark bg-scrasa-green-light px-3 py-2 rounded-lg">✓ {createOk}</div>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
              {creating ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Créer le compte
            </button>
          </div>
        </form>
      </div>

      {/* Barème par mois */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-xl text-scrasa-gray mb-4">Barème de compensation</h2>
        <div className="space-y-4">
          {moisList.map(m => (
            <div key={m.id} className="flex items-center gap-4 flex-wrap border-b border-scrasa-border pb-4 last:border-0 last:pb-0">
              <div className="font-display font-bold text-scrasa-gray w-32 flex-shrink-0">
                {MOIS_NOMS[m.mois]} {m.annee}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-mono">CHF/h</label>
                <input type="number" step="0.5" min="0" className="input w-24 py-1.5 text-sm"
                  value={baremeValues[m.id]?.taux_horaire ?? m.taux_horaire}
                  onChange={e => setBaremeValues(v => ({ ...v, [m.id]: { ...v[m.id], taux_horaire: parseFloat(e.target.value) } }))}
                  disabled={m.statut !== 'ouvert'} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-mono">CHF/km</label>
                <input type="number" step="0.05" min="0" className="input w-24 py-1.5 text-sm"
                  value={baremeValues[m.id]?.taux_km ?? m.taux_km}
                  onChange={e => setBaremeValues(v => ({ ...v, [m.id]: { ...v[m.id], taux_km: parseFloat(e.target.value) } }))}
                  disabled={m.statut !== 'ouvert'} />
              </div>
              {m.statut === 'ouvert' && (
                <button onClick={() => handleBaremeSave(m.id)} disabled={baremeSaving === m.id}
                  className="btn-primary flex items-center gap-1.5 py-1.5 text-sm">
                  {baremeSaving === m.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Enregistrer
                </button>
              )}
              {m.statut !== 'ouvert' && (
                <span className="text-xs text-gray-400 italic">Mois {m.statut} — non modifiable</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
