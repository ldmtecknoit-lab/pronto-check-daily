import { createClient } from '@supabase/supabase-js'

// Lovable Supabase integration provides these automatically
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
  console.error('Supabase URL non configurata. Vai al dashboard Supabase per ottenere le credenziali.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('Supabase Anon Key non configurata. Vai al dashboard Supabase per ottenere le credenziali.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)