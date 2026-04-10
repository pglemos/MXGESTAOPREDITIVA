import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * MX Performance Supabase Client (Singleton Pattern)
 * Este padrão garante que apenas uma instância do cliente exista no ciclo de vida da aplicação,
 * prevenindo vazamentos de memória e comportamentos instáveis no GoTrue (Auth).
 */

const supabaseUrl = 
    import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_PUBLIC_SUPABASE_URL || 
    'https://fbhcmzzgwjdgkctlfvbo.supabase.co'

const supabaseAnonKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'

// Variável privada para o Singleton
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        })
    }
    return supabaseInstance
}

// Export canonical instance for direct use (backwards compatibility)
export const supabase = getSupabaseClient()

export function checkSupabaseCredentials(url?: string, anonKey?: string) {
    if (!url || !anonKey) {
        console.warn('Supabase credentials missing. Using fallback or check environment.')
        return !!(url && anonKey)
    }
    return true
}
