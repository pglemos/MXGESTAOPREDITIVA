import { describe, expect, test } from 'bun:test'
import { isOfficialLancamento } from './useRanking'

// MX-22.5 (AC-2; Spec §10.2 "regularização... rascunho não entra como oficial"
// aplicado por analogia ao rascunho — FEV-DATA-11): o Ranking de rede
// (useGlobalRanking/useStorePerformance) somava lançamentos com
// submission_status='draft' antes do fechamento ser finalizado, tanto no
// caminho RPC (get_lancamentos_rede_periodo/get_lancamentos_referencia_dia)
// quanto no SELECT direto legado. isOfficialLancamento é o filtro único
// aplicado a ambos os caminhos.
describe('isOfficialLancamento (MX-22.5)', () => {
  test('exclui rascunho (submission_status=draft)', () => {
    expect(isOfficialLancamento({ submission_status: 'draft' })).toBe(false)
  })

  test('inclui finalizado no prazo (on_time)', () => {
    expect(isOfficialLancamento({ submission_status: 'on_time' })).toBe(true)
  })

  test('inclui finalizado com atraso (late) — contabiliza, penalização é separada (Disciplina)', () => {
    expect(isOfficialLancamento({ submission_status: 'late' })).toBe(true)
  })

  test('trata submission_status ausente/null como oficial (registros anteriores ao campo)', () => {
    expect(isOfficialLancamento({ submission_status: null })).toBe(true)
    expect(isOfficialLancamento({})).toBe(true)
  })
})
