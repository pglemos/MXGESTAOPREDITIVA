/**
 * Dados estáticos da "Rotina MX" (agenda de alta performance) exibida no
 * VendedorHome. Extraídos do componente original para isolá-los da UI.
 *
 * Story 3.4 reconciliada — decomposição de `src/pages/VendedorHome.tsx`
 * (UX-001) seguindo ADR-0050.
 */
export interface DailyRoutineSlot {
  time: string
  task: string
  desc: string
}

export const DAILY_ROUTINE_SLOTS: DailyRoutineSlot[] = [
  { time: '1', task: 'Energia', desc: 'Foco e preparação da abordagem.' },
  { time: '2', task: 'Organização', desc: 'Fechamento Diário e estratégia.' },
  { time: '3', task: 'Leads', desc: 'Boas-vindas e classificação.' },
  { time: '4', task: 'Prospecção', desc: 'Carteira e redes sociais.' },
  { time: '5', task: 'Atendimento', desc: 'Execução de agendados.' },
  { time: '6', task: 'Recuperação', desc: 'Objeções e lista quente.' },
  { time: '7', task: 'Fechamento', desc: 'Preparação D+1.' },
]
