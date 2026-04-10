import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * MX Performance Supabase Client (Singleton Pattern)
 * Este padrão garante que apenas uma instância do cliente exista no ciclo de vida da aplicação,
 * prevenindo vazamentos de memória e comportamentos instáveis no GoTrue (Auth).
 */

const supabaseUrl = 
    import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_PUBLIC_SUPABASE_URL || 
    ''

const supabaseAnonKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 
    ''

/**
 * Verifica se as credenciais do Supabase estão presentes.
 * @param url URL do projeto Supabase
 * @param anonKey Chave anônima do Supabase
 * @returns boolean indicando se as credenciais são válidas
 */
export function checkSupabaseCredentials(url?: string, anonKey?: string): boolean {
    if (!url || !anonKey) {
        console.warn('Supabase credentials missing. Check your .env file.')
        return false
    }
    return true
}

// Bloqueio inicial para evitar falhas silenciosas difíceis de diagnosticar
if (!supabaseUrl || !supabaseAnonKey) {
    checkSupabaseCredentials(supabaseUrl, supabaseAnonKey)
    if (import.meta.env.PROD) {
        throw new Error('Supabase credentials missing. Check your .env file.')
    }
}

// Variável privada para o Singleton
let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        // createClient lançará erro caso url ou key estejam vazios
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
