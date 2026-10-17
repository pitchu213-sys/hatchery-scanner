import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
    }

    const cleanCode = code.trim().replace(/^LOT-/, '')

    const { data, error } = await supabaseAdmin
      .from('lots')
      .select('*')
      .or(`code_rotation.eq.${code.trim()},code_rotation.eq.${cleanCode},bon_reception_no.eq.${code.trim()},bon_reception_no.eq.${cleanCode}`)
      .order('created_at', { ascending: false })
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
      code_rotation,
      bon_reception_no,
      reception_date,
      flock_age_weeks,
      strain,
      batiment,
      farm_name,
      date_entree,
      chauffeur_nom,
      transporteur,
      responsable,
      quantity,
    } = body

    if (!code_rotation || !quantity) {
      return NextResponse.json(
        { error: 'Nom du lot (Rotation) et quantité reçue requis.' },
        { status: 400 }
      )
    }

    const qty = Math.max(1, Number(quantity) || 1000)
    const age = Math.max(1, Number(flock_age_weeks) || 30)
    const bonNo = bon_reception_no?.toString().trim() || `${code_rotation}-${Date.now().toString().slice(-4)}`

    // Build payload matching PostgreSQL schema for Hatchery App
    const payload = {
      hatchery_id: '11111111-1111-1111-1111-111111111111',
      bon_reception_no: bonNo,
      code_rotation: code_rotation,
      reception_date: reception_date || new Date().toISOString().split('T')[0],
      accepted_qty: qty,
      oeufs_entiers: qty,
      flock_age_weeks: age,
      flock_age: age,
      strain: strain || 'Arbor',
      batiment: batiment || null,
      farm_name: farm_name || null,
      date_entree: date_entree || null,
      transporteur: transporteur || null,
      chauffeur_nom: chauffeur_nom || null,
      responsable: responsable || null,
      source: 'manual',
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('lots')
      .insert(payload)
      .select()

    if (error) {
      console.error('Error inserting lot into Supabase:', error)
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
