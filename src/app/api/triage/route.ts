import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lotId, acceptedQty, rejectedQty, chariots } = body

    if (!lotId) {
      return NextResponse.json({ error: 'Lot ID requis' }, { status: 400 })
    }

    const incubeQty = Number(acceptedQty) || 0
    const ecartQty = Number(rejectedQty) || 0
    const totalSorted = incubeQty + ecartQty

    // 1. Insert into triages table
    const { data: triage, error: triageError } = await supabaseAdmin
      .from('triages')
      .insert({
        lot_id: lotId,
        triage_date: new Date().toISOString().split('T')[0],
        entered_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        eggs_sorted: totalSorted,
        eggs_rejected: ecartQty,
        incube: incubeQty,
        ecart: ecartQty,
        bon_triage: 'TR-' + Date.now().toString().slice(-6),
        created_at: new Date().toISOString(),
      })
      .select()

    if (triageError) {
      console.error('Triage insert error:', triageError)
      return NextResponse.json({ error: triageError.message }, { status: 500 })
    }

    const triageId = triage?.[0]?.id

    // 2. If chariots are provided, prepare incubation lines ready for scanning
    if (chariots && Array.isArray(chariots) && triageId) {
      for (const ch of chariots) {
        const cleanChCode = (ch.chariotNumber || ch.id || '').replace('CH-', '')
        try {
          await supabaseAdmin
            .from('incubation_lignes')
            .insert({
              triage_id: triageId,
              n_chariot: cleanChCode,
              oac_pris: Number(ch.quantity) || 1500,
              type_plateau: 'standard_150',
              created_at: new Date().toISOString(),
            })
        } catch (_) {}
      }
    }

    return NextResponse.json({ success: true, triage: triage?.[0] })
  } catch (err: any) {
    console.error('API /api/triage error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur interne lors du triage' },
      { status: 500 }
    )
  }
}
