import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config/supabase'

export const saveChariotMirageFromMobile = async (docId, nChariot, plateauxData) => {
  try {
    // 1. Prepare lignes for this chariot
    const lignesToUpsert = plateauxData.map(p => ({
      mirage_doc_id: docId,
      n_chariot: nChariot,
      plateau: p.plateau,
      date_reception: p.date_reception || new Date().toISOString().split('T')[0],
      nbre_clairs: p.nbre_clairs,
      taux_clairs: (p.nbre_clairs / 150) * 100
    }))

    const res = await fetch(`${SUPABASE_URL}/rest/v1/mirage_lignes?on_conflict=mirage_doc_id,n_chariot,plateau`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(lignesToUpsert)
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }

    return { success: true }
  } catch (e) {
    console.error('saveChariotMirageFromMobile error:', e)
    return { success: false, error: e.message }
  }
}
