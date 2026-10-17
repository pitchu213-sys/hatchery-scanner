import { supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../config/supabase'

export const getActiveIncubations = async () => {
  try {
    const { data, error } = await supabase
      .from('incubation_docs')
      .select(`
        id,
        doc_number,
        date_incubation,
        date_transfert,
        date_eclosion,
        total_oac,
        incubation_lignes (
          id,
          n_chariot,
          oac_pris
        )
      `)
      .order('date_incubation', { ascending: false })
      .limit(15)

    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Error fetching active incubations:', e)
    return []
  }
}

export const bindChariotToIncubation = async (docId, nChariot, oac = 4800, triageId = null) => {
  try {
    // 1. Check if line already exists
    const { data: existing } = await supabase
      .from('incubation_lignes')
      .select('id')
      .eq('incubation_doc_id', docId)
      .eq('n_chariot', nChariot)

    if (existing && existing.length > 0) {
      return { success: false, duplicate: true, message: `Chariot ${nChariot} déjà présent dans cette session !` }
    }

    // 2. Insert new line using Service Key via REST API to ensure reliable write
    const res = await fetch(`${SUPABASE_URL}/rest/v1/incubation_lignes`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        incubation_doc_id: docId,
        n_chariot: nChariot,
        oac_pris: oac,
        triage_id: triageId
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }

    const inserted = await res.json()
    return { success: true, data: inserted[0] }
  } catch (e) {
    console.error('bindChariotToIncubation error:', e)
    return { success: false, error: e.message }
  }
}
