/**
 * Mapeamento entre o vocabulário de escopo usado na UI (português) e os valores
 * reais do enum `score_scope_type` no banco (store/department/individual/process).
 *
 * O frontend da Central MX foi escrito com 'loja'/'departamento'/'vendedor', mas a
 * coluna `scope_type` (planos_acao, alerts, score) é o enum em inglês. Sem esta
 * conversão, toda query/insert de Plano de Ação e Alertas retorna 400
 * (invalid input value for enum score_scope_type).
 */
export type ScopeUi = 'loja' | 'departamento' | 'vendedor' | 'consultor'
export type ScopeDb = 'store' | 'department' | 'individual' | 'process'

const UI_TO_DB: Record<ScopeUi, ScopeDb> = {
  loja: 'store',
  departamento: 'department',
  vendedor: 'individual',
  consultor: 'process',
}

const DB_TO_UI: Record<ScopeDb, ScopeUi> = {
  store: 'loja',
  department: 'departamento',
  individual: 'vendedor',
  process: 'consultor',
}

/** Converte o escopo da UI (pt) para o valor do enum do banco. */
export function scopeToDb(scope: ScopeUi): ScopeDb {
  return UI_TO_DB[scope] ?? 'store'
}

/** Converte o valor do enum do banco para o escopo da UI (pt). */
export function scopeFromDb(scope: string | null | undefined): ScopeUi {
  return DB_TO_UI[(scope as ScopeDb)] ?? 'loja'
}
