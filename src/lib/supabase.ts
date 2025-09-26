import { createClient } from '@supabase/supabase-js'

// Configurazione Supabase
const supabaseUrl = 'https://hgfnqxucvtjkinqyvvrx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZm5xeHVjdnRqa2lucXl2dnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE0MzgsImV4cCI6MjA3NDQ1NzQzOH0.UmwcR97iz_srTWurA7J_0awC-IjgTSeQ6xZwg3WndJY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)