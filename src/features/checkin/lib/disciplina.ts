// Fórmula de Disciplina do Fechamento Diário (Especificação Funcional — Tela
// Fechamento Diário, §16-§18). Extraída de useCheckinPage.ts (EV-1.5) para ser
// testável isoladamente e compartilhada entre preview client e payload de envio.
//
// pontuacaoDisciplinaBase = 70 + 30 * (creditosValidos / totalAgendamentosD1)
// (30 cheio quando totalAgendamentosD1 = 0 — nada para detalhar)
// pontuacaoDisciplinaFinal = pontuacaoDisciplinaBase - 10 se finalizadoAposPrazo, clamped [0,100]
//
// O valor "final" persistido em produção é recalculado no servidor
// (supabase/migrations/20260626120000_ev1_5_disciplina_persistida.sql) a partir
// da base enviada + do próprio relógio do servidor — esta função é usada para o
// preview imediato na UI, e deve continuar batendo com o cálculo do servidor.

export interface DisciplinaInput {
  totalAgendamentosD1: number
  creditosValidos: number
  finalizadoAposPrazo: boolean
}

export interface DisciplinaResult {
  pontosExtras: number
  pontuacaoDisciplinaBase: number
  pontuacaoDisciplinaFinal: number
}

export function calcularDisciplina({
  totalAgendamentosD1,
  creditosValidos,
  finalizadoAposPrazo,
}: DisciplinaInput): DisciplinaResult {
  const percentualDetalhamento = totalAgendamentosD1 === 0 ? 1.0 : creditosValidos / totalAgendamentosD1
  const pontosExtras = percentualDetalhamento * 30
  const pontuacaoDisciplinaBase = Math.round(70 + pontosExtras)

  let pontuacaoDisciplinaFinal = pontuacaoDisciplinaBase
  if (finalizadoAposPrazo) {
    pontuacaoDisciplinaFinal = Math.max(0, pontuacaoDisciplinaFinal - 10)
  }
  pontuacaoDisciplinaFinal = Math.min(100, pontuacaoDisciplinaFinal)

  return { pontosExtras, pontuacaoDisciplinaBase, pontuacaoDisciplinaFinal }
}
