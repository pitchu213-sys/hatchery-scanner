import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnnbswqpobvqxmozznra.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubmJzd3Fwb2J2cXhtb3p6bnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjExNjQsImV4cCI6MjEwNzAzNzE2NH0.y7T5IZ5ePn5krjreic7a1LBQ0A6UwkjMrXhD_4pPaAo'

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubmJzd3Fwb2J2cXhtb3p6bnJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ2MTE2NCwiZXhwIjoyMTA3MDM3MTY0fQ.TnCbrqijItACq19wXbcRKNhLnJ8YxJM7euQmr7-zCws'

// Client-side Supabase client (anon)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Server-side / Admin client (bypasses RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
