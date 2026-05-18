/**
 * Feature flags client-side helper
 *
 * Story 1.2 (DB-016 Fase B) — Lê flag `db016_rpc_enabled` (alias: `lancamentos_via_rpc`)
 * para chavear entre SELECT direto em `lancamentos_diarios` (legacy) e RPCs
 * SECURITY DEFINER (`get_lancamentos_*`) publicadas pela Story 1.1.
 *
 * **DEFAULT = FALSE**. Em produção o caminho permanece o SELECT direto até
 * Story 1.3 (REVOKE canary 1%) ligar a flag explicitamente em staging/prod.
 *
 * Fontes possíveis (avaliadas em ordem):
 *   1. `localStorage['mx_flag_lancamentos_via_rpc']` — override por sessão (debug/QA)
 *   2. `import.meta.env.VITE_FLAG_LANCAMENTOS_VIA_RPC` — build-time flag
 *   3. fallback → `false`
 *
 * Aceita: 'true' | '1' | 'on' (case-insensitive).
 */

const FLAG_LANCAMENTOS_VIA_RPC = 'mx_flag_lancamentos_via_rpc'

function parseFlag(value: string | undefined | null): boolean {
    if (!value) return false
    const normalized = String(value).trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'on'
}

export function isLancamentosViaRpcEnabled(): boolean {
    // 1. localStorage override (apenas no browser)
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        try {
            const local = window.localStorage.getItem(FLAG_LANCAMENTOS_VIA_RPC)
            if (local !== null) return parseFlag(local)
        } catch {
            // localStorage indisponível (private mode etc.) — segue fluxo
        }
    }

    // 2. Build-time env (Vite)
    try {
        const envValue = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_FLAG_LANCAMENTOS_VIA_RPC
        if (typeof envValue !== 'undefined') return parseFlag(envValue)
    } catch {
        // import.meta indisponível em SSR/Node — segue fluxo
    }

    // 3. Default seguro
    return false
}

/**
 * Helper para forçar flag em runtime (smoke tests / kill-switch reverso).
 * Não use em produção; usado por scripts QA e devtools.
 */
export function setLancamentosViaRpcOverride(value: boolean | null): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
    try {
        if (value === null) window.localStorage.removeItem(FLAG_LANCAMENTOS_VIA_RPC)
        else window.localStorage.setItem(FLAG_LANCAMENTOS_VIA_RPC, value ? 'true' : 'false')
    } catch {
        // ignore
    }
}

export const FEATURE_FLAGS = {
    LANCAMENTOS_VIA_RPC: FLAG_LANCAMENTOS_VIA_RPC,
} as const
