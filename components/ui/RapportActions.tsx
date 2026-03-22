'use client'
// components/ui/RapportActions.tsx
import { useState } from 'react'
import { exportRapportMensuels } from '@/lib/pdf'
import { createClient } from '@/lib/supabase/client'
import { FileDown, CheckCircle, Loader2, FileText } from 'lucide-react'

interface Props {
  mois: any
  compensations: any[]
  isAdmin: boolean
}

export default function RapportActions({ mois, compensations, isAdmin }: Props) {
  const [validating, setValidating] = useState(false)
  const supabase = createClient()

  const handleExportPDF = () => {
    exportRapportMensuels(mois, compensations)
  }

  const handleExportCSV = () => {
    const headers = ['Prenom','Nom','Service','Transport','Jours','Distance km','Duree min','Indem horaire CHF','Indem km CHF','Total CHF']
    const rows = compensations.map((c: any) => [
      c.compagnon?.prenom, c.compagnon?.nom, c.compagnon?.service || '',
      c.compagnon?.transport, c.jours_travailles,
      c.distance_mois_km.toFixed(2), c.duree_mois_min.toFixed(0),
      c.indem_horaire.toFixed(2), c.indem_km.toFixed(2), c.total_chf.toFixed(2)
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    a.download = `SCRASA_${mois.annee}_${String(mois.mois).padStart(2,'0')}.csv`
    a.click()
  }

  const handleValider = async () => {
    if (!confirm('Valider ce mois ? Les données seront figées.')) return
    setValidating(true)
    await supabase.from('mois').update({ statut: 'valide', valide_le: new Date().toISOString() }).eq('id', mois.id)
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs">
        <FileText size={13} /> CSV
      </button>
      <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs">
        <FileDown size={13} /> PDF
      </button>
      {isAdmin && mois.statut === 'ouvert' && compensations.length > 0 && (
        <button onClick={handleValider} disabled={validating}
          className="bg-scrasa-green text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-scrasa-green-dark transition-colors disabled:opacity-50">
          {validating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
          Valider le mois
        </button>
      )}
    </div>
  )
}
