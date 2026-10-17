import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rotationsRes, transporteursRes, responsablesRes] = await Promise.all([
      supabaseAdmin.from('rotations').select('*').order('code'),
      supabaseAdmin.from('transporteurs').select('*').order('code'),
      supabaseAdmin.from('responsables').select('*').order('nom'),
    ])

    return NextResponse.json({
      rotations: rotationsRes.data || [],
      transporteurs: transporteursRes.data || [],
      responsables: responsablesRes.data || [],
    })
  } catch (err: any) {
    console.error('Error fetching references:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors du chargement des références' },
      { status: 500 }
    )
  }
}
