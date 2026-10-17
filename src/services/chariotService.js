import { supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config/supabase'

export const getChariotDetails = async (rawCode) => {
  if (!rawCode) return null

  // Normalize code: remove spaces, trim
  const cleanCode = rawCode.trim()

  try {
    // 1. Search for this chariot in incubation_lignes
    const { data: lines, error: lineError } = await supabase
      .from('incubation_lignes')
      .select(`
        id,
        n_chariot,
        oac_pris,
        incubation_doc_id,
        triages (
          id,
          triage_date,
          lots (
            id,
            code_rotation,
            batiment,
            strain,
            date_entree,
            reception_date
          )
        ),
        incubation_docs (
          id,
          doc_number,
          date_incubation,
          date_mirage,
          date_transfert,
          date_eclosion
        )
      `)
      .eq('n_chariot', cleanCode)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lineError) {
      console.error('Error fetching chariot:', lineError)
      throw lineError
    }

    if (lines && lines.length > 0) {
      const line = lines[0]
      const doc = line.incubation_docs
      const triage = line.triages
      const lot = triage?.lots

      // Check if mirage data exists for this chariot
      const { data: mirageLines } = await supabase
        .from('mirage_lignes')
        .select('*')
        .eq('n_chariot', cleanCode)
        .eq('mirage_doc_id', doc?.id)

      let totalClairs = 0
      let mirageDone = false
      if (mirageLines && mirageLines.length > 0) {
        mirageDone = true
        const sum = mirageLines.reduce((s, p) => s + (p.nbre_clairs || 0), 0)
        totalClairs = Math.round(sum * (16 / 3))
      }

      // Determine current stage
      const todayStr = new Date().toISOString().split('T')[0]
      const transferDate = doc?.date_transfert || doc?.date_mirage
      let status = 'en_incubation'
      let statusLabel = 'En Incubation'
      let statusColor = '#3b82f6' // Blue

      if (mirageDone) {
        status = 'mire'
        statusLabel = 'Miré & Transféré'
        statusColor = '#10b981' // Green
      } else if (transferDate && todayStr >= transferDate) {
        status = 'a_mirer'
        statusLabel = 'À Mirer / Transférer'
        statusColor = '#ef4444' // Red
      } else {
        status = 'en_incubation'
        statusLabel = 'En Incubation'
        statusColor = '#f59e0b' // Amber/Orange
      }

      return {
        found: true,
        n_chariot: cleanCode,
        oac_total: line.oac_pris || 4800,
        doc_id: doc?.id,
        doc_number: doc?.doc_number || (doc?.id ? doc.id.slice(0, 4) : '-'),
        date_incubation: doc?.date_incubation,
        date_transfert: transferDate,
        date_eclosion: doc?.date_eclosion,
        lot_code: lot?.code_rotation || 'A4',
        batiment: lot?.batiment || 'avia 4',
        strain: lot?.strain || 'Arbor Acres',
        date_mep: lot?.date_entree || '2024-11-19',
        mirage_done: mirageDone,
        total_clairs: totalClairs,
        status,
        statusLabel,
        statusColor,
      }
    }

    // 2. Chariot exists in physical hatchery, but not currently assigned to active incubation
    return {
      found: false,
      n_chariot: cleanCode,
      status: 'libre',
      statusLabel: 'Chariot Libre / Non Assigné',
      statusColor: '#6b7280', // Gray
    }
  } catch (e) {
    console.error('getChariotDetails exception:', e)
    // Fallback: return offline mock or raw code
    return {
      found: false,
      n_chariot: cleanCode,
      status: 'offline',
      statusLabel: 'Code Barres Détecté',
      statusColor: '#6366f1',
    }
  }
}
