/**
 * Rota canônica da Rotina do Dia do gerente.
 * A UI continua Base44-compatible, mas as tarefas automáticas e o histórico
 * oficial passam a vir das entidades canônicas do Supabase.
 */
export { ManagerDayRoutineCanonical as RotinaGerente } from '@/features/manager/day-routine/ManagerDayRoutineCanonical.container'
export { ManagerDayRoutineCanonical as default } from '@/features/manager/day-routine/ManagerDayRoutineCanonical.container'
