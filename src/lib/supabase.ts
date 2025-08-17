import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

export const getSupabaseConfig = () => ({
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
  isDemoMode: supabaseUrl === 'https://dummy.supabase.co' || supabaseAnonKey === 'dummy_key'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const createServerClient = () => {
  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} 