import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
    }

    const cleanCode = code.trim().replace('LOT-', '')

    const { data, error } = await supabaseAdmin
      .from('lots')
      .select('*')
      .or(`code_rotation.eq.${code.trim()},code_rotation.eq.${cleanCode}`)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lot: data?.[0] || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      lotCode,
      receptionDate,
      origin,
      strain,
      ageWeeks,
      quantity,
    } = body

    if (!lotCode || !quantity) {
      return NextResponse.json(
        { error: 'Numéro du lot et quantité reçue requis.' },
        { status: 400 }
      )
    }

    const cleanCode = lotCode.trim()
    const age = Math.max(1, Number(ageWeeks) || 32)
    const qty = Math.max(1, Number(quantity) || 1000)

    // Build payload matching exact PostgreSQL columns
    const payload = {
      hatchery_id: '11111111-1111-1111-1111-111111111111',
      bon_reception_no: cleanCode,
      code_rotation: cleanCode,
      reception_date: receptionDate || new Date().toISOString().split('T')[0],
      accepted_qty: qty,
      flock_age_weeks: age,
      flock_age: age,
      strain: strain || 'Arbor Acres',
      batiment: origin || 'Ferme Élevage',
      source: 'manual',
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('lots')
      .insert(payload)
      .select()

    if (error) {
      console.error('Error inserting lot in Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lot: data?.[0] })
  } catch (err: any) {
    console.error('API /api/lots error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
