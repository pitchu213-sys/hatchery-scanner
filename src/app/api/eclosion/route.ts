import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lotsData, eclosionDate } = body

    if (!lotsData || !Array.isArray(lotsData)) {
      return NextResponse.json({ error: 'Données lots requises' }, { status: 400 })
    }

    const insertedRows = []

    for (const lot of lotsData) {
      if (lot.lotId && !lot.lotId.startsWith('demo-')) {
        const payload = {
          lot_id: lot.lotId,
          eclosion_date: eclosionDate || new Date().toISOString().split('T')[0],
          chicks_hatched: Number(lot.poussins1erChoix) || 0,
          dead_in_shell: Number(lot.mortsEnCoquille) || 0,
          pipped: Number(lot.bechesNonEclos) || 0,
          contaminated: Number(lot.poussins2emeChoix) || 0,
          entered_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          created_at: new Date().toISOString(),
        }

        const { data, error } = await supabaseAdmin
          .from('eclosions')
          .insert(payload)
          .select()

        if (error) {
          console.warn('Failed to insert eclosion for lot', lot.lotId, error.message)
        } else if (data) {
          insertedRows.push(data[0])
        }
      }
    }

    return NextResponse.json({ success: true, count: insertedRows.length })
  } catch (err: any) {
    console.error('API /api/eclosion error:', err)
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'enregistrement de l'éclosion" },
      { status: 500 }
    )
  }
}
