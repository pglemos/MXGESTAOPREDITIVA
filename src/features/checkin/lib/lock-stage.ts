// Janela de atraso em 3 estágios (Especificação Funcional — Tela Fechamento
// Diário, §3.1-§3.3). Extraída de useCheckinPage.ts (EV-1.6) para ser
// testável isoladamente.
//
// 'on_time'  — até 09h30 do dia seguinte à competência: normal, sem bloqueio.
// 'blocked'  — 09h31-12h00: bloqueio destacado + "Avisar gerente no WhatsApp".
// 'discreet' — após 12h01 (ou mais de 1 dia de atraso): a tela para de
//              insistir com o bloqueio destacado; só o aviso discreto resta.

export type LockStage = 'on_time' | 'blocked' | 'discreet'

export interface LockStageInput {
  isPastDeadline: boolean
  selectedDate: string
  yesterdaySP: string
  spHours: number
  spMinutes: number
}

const DEADLINE_MINUTES = 9 * 60 + 30 // 09:30
const DISCREET_THRESHOLD_MINUTES = 12 * 60 // 12:00

export function calcularLockStage({
  isPastDeadline,
  selectedDate,
  yesterdaySP,
  spHours,
  spMinutes,
}: LockStageInput): LockStage {
  if (!isPastDeadline) return 'on_time'
  if (selectedDate !== yesterdaySP) return 'discreet' // mais de 1 dia atrasado: sempre discreto

  const nowMinutes = spHours * 60 + spMinutes
  const minutesLate = nowMinutes - DEADLINE_MINUTES
  return minutesLate <= DISCREET_THRESHOLD_MINUTES - DEADLINE_MINUTES ? 'blocked' : 'discreet'
}
