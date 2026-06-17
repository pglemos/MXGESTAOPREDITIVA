/**
 * Trilha level helpers — EV-5.3
 *
 * Derives N1-N4 training track recommendation from vendor maturity data.
 * Delegates actual derivation to the canonical `maturidade` lib so there
 * is a single source of truth for the N1-N4 logic.
 */

export type { NivelMaturidadeVendedor as NivelTrilha } from '@/features/crm/lib/maturidade'
export {
  derivarNivelMaturidadeVendedor as derivarNivelTrilha,
  MATURIDADE_VENDEDOR_LABEL as NIVEL_TRILHA_LABEL,
} from '@/features/crm/lib/maturidade'

/**
 * Find the recommended trilha ID for a given N1-N4 level.
 *
 * Matching rules (in priority order):
 * 1. `trilha.codigo` is exactly the nivel (e.g. "N1")
 * 2. `trilha.codigo` starts with `{nivel}-` (e.g. "N1-fundamentos")
 * 3. `trilha.codigo` starts with `{nivel}` (e.g. "N1_xxx")
 *
 * Returns the id of the first match, or null when no trilha matches.
 */
export function trilhaRecomendadaId(
  trilhas: Array<{ id: string; codigo: string }>,
  nivel: string,
): string | null {
  const exact = trilhas.find((t) => t.codigo === nivel)
  if (exact) return exact.id

  const prefixed = trilhas.find((t) => t.codigo.startsWith(`${nivel}-`) || t.codigo.startsWith(`${nivel}_`))
  if (prefixed) return prefixed.id

  return null
}
