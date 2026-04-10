import { createClient } from '@supabase/supabase-js'

// Orion Resilience Patch: Suporta múltiplas nomenclaturas de variáveis de ambiente
const supabaseUrl = 
    import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_PUBLIC_SUPABASE_URL || 
    'https://fbhcmzzgwjdgkctlfvbo.supabase.co'

const supabaseAnonKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'

export function checkSupabaseCredentials(url?: string, anonKey?: string) {
    if (!url || !anonKey) {
        console.warn('Supabase credentials missing. Using fallback or check environment.')
        return !!(url && anonKey)
    }
    return true
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
