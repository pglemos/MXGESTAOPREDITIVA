import { motion } from 'motion/react'
import type { RoutineNotice, RoutineProgress } from '../data/types'
import { RotinaProgressCard } from './RotinaProgressCard'
import { RotinaRitualMatinal } from './RotinaRitualMatinal'
import { RotinaSnapshotAside } from './RotinaSnapshotAside'

type Props = {
  routineProgress: RoutineProgress
  reuniaoDone: boolean
  setReuniaoDone: (v: boolean) => void
  agendaValidated: boolean
  setAgendaDone: (v: boolean) => void
  totalAgendamentosHoje: number
  canTriggerMatinal: boolean
  executing: boolean
  matinalAudit: RoutineNotice | null
  onTriggerMatinal: () => void
  pendingSellersCount: number
  activeRoutineStoreId: string
  onSendDailyReminders: () => void
  routineLog: unknown
  routineNotes: string
  setRoutineNotes: (v: string) => void
  savingRoutine: boolean
  onRegisterRoutine: () => void
}

/**
 * Aba "Diário" — composição de Progresso + Ritual Matinal + Snapshot/Auditoria.
 */
export function RotinaDiarioTab(props: Props) {
  return (
    <motion.div
      key="diario"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg"
    >
      <section className="lg:col-span-7 flex flex-col gap-mx-lg">
        <RotinaProgressCard routineProgress={props.routineProgress} />
        <RotinaRitualMatinal
          reuniaoDone={props.reuniaoDone}
          setReuniaoDone={props.setReuniaoDone}
          agendaValidated={props.agendaValidated}
          setAgendaDone={props.setAgendaDone}
          totalAgendamentosHoje={props.totalAgendamentosHoje}
          canTriggerMatinal={props.canTriggerMatinal}
          executing={props.executing}
          matinalAudit={props.matinalAudit}
          onTriggerMatinal={props.onTriggerMatinal}
        />
      </section>
      <RotinaSnapshotAside
        totalAgendamentosHoje={props.totalAgendamentosHoje}
        pendingSellersCount={props.pendingSellersCount}
        activeRoutineStoreId={props.activeRoutineStoreId}
        onSendDailyReminders={props.onSendDailyReminders}
        routineLog={props.routineLog}
        routineNotes={props.routineNotes}
        setRoutineNotes={props.setRoutineNotes}
        savingRoutine={props.savingRoutine}
        onRegisterRoutine={props.onRegisterRoutine}
      />
    </motion.div>
  )
}

export default RotinaDiarioTab
