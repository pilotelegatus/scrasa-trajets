// lib/pdf.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Compensation, Mois, MOIS_NOMS, TRANSPORT_LABELS } from './types'
import { formatDuree, formatChf } from './calcul'

export function exportRapportMensuels(mois: Mois, compensations: Compensation[]) {
  const doc = new jsPDF({ orientation: 'landscape' })

  // En-tête
  doc.setFillColor(74, 171, 78)
  doc.rect(0, 0, 297, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('SCRASA — Rapport de compensations trajets', 14, 12)
  doc.setFontSize(10)
  doc.text(`${MOIS_NOMS[mois.mois]} ${mois.annee}`, 250, 12)

  // Sous-titre
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Taux horaire : CHF ${mois.taux_horaire}/h  |  Indemnité km : CHF ${mois.taux_km}/km`,
    14, 26
  )

  // Totaux rapides
  const totalChf = compensations.reduce((s, c) => s + c.total_chf, 0)
  const totalKm  = compensations.reduce((s, c) => s + c.distance_mois_km, 0)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(53, 122, 56)
  doc.text(`Budget total : ${formatChf(totalChf)}`, 14, 34)
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.text(`Distance cumulée : ${totalKm.toFixed(0)} km  |  ${compensations.length} compagnon(s)`, 80, 34)

  // Tableau
  autoTable(doc, {
    startY: 40,
    head: [[
      'Compagnon', 'Service', 'Transport', 'Jours',
      'Distance/mois', 'Temps/mois',
      'Indem. horaire', 'Indem. km', 'Total CHF'
    ]],
    body: compensations.map(c => [
      `${c.compagnon?.prenom} ${c.compagnon?.nom}`,
      c.compagnon?.service || '—',
      TRANSPORT_LABELS[c.compagnon?.transport || 'driving-car'],
      c.jours_travailles,
      `${c.distance_mois_km.toFixed(0)} km`,
      formatDuree(c.duree_mois_min),
      formatChf(c.indem_horaire),
      formatChf(c.indem_km),
      formatChf(c.total_chf)
    ]),
    foot: [[
      'TOTAL', '', '', '',
      `${totalKm.toFixed(0)} km`, '',
      formatChf(compensations.reduce((s,c) => s + c.indem_horaire, 0)),
      formatChf(compensations.reduce((s,c) => s + c.indem_km, 0)),
      formatChf(totalChf)
    ]],
    headStyles: { fillColor: [74, 171, 78], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [237, 243, 237], textColor: [53, 122, 56], fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 252, 247] },
    styles: { cellPadding: 3 }
  })

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-CH')} — SCRASA SA — Confidentiel RH`,
      14, 205
    )
    doc.text(`Page ${i}/${pageCount}`, 270, 205)
  }

  doc.save(`SCRASA_Compensations_${MOIS_NOMS[mois.mois]}_${mois.annee}.pdf`)
}
