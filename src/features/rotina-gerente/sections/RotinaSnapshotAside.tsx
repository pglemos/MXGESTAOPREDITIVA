import { FileCheck, History, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

type Props = {
  totalAgendamentosHoje: number
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
 * Aside (col-5) da aba Diário: Snapshot Hoje + Auditoria Diária (firma).
 */
export function RotinaSnapshotAside({
  totalAgendamentosHoje,
  pendingSellersCount,
  activeRoutineStoreId,
  onSendDailyReminders,
  routineLog,
  routineNotes,
  setRoutineNotes,
  savingRoutine,
  onRegisterRoutine,
}: Props) {
  return (
    <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
      <Card className="p-mx-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-50"
          aria-hidden="true"
        />
        <div className="relative z-10 space-y-mx-lg">
          <header className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-mx-sm">
              <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-mx-inner">
                <History size={24} />
              </div>
              <Typography
                variant="h3"
                tone="white"
                className="uppercase tracking-tight leading-none"
              >
                Snapshot Hoje
              </Typography>
            </div>
            <Badge
              variant="outline"
              className="text-white border-white/20 px-4 py-1 uppercase font-black text-tiny"
            >
              Real-time
            </Badge>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
            <div>
              <Typography variant="tiny" tone="white" className="mb-2 block uppercase font-black">
                AGENDAMENTOS
              </Typography>
              <Typography
                variant="h1"
                tone="white"
                className="text-5xl tabular-nums leading-none tracking-tighter"
              >
                {totalAgendamentosHoje}
              </Typography>
            </div>
            <div>
              <Typography variant="tiny" tone="white" className="mb-2 block uppercase font-black">
                PENDÊNCIAS
              </Typography>
              <Typography
                variant="h1"
                tone={pendingSellersCount > 0 ? 'brand' : 'white'}
                className="text-5xl tabular-nums leading-none tracking-tighter"
              >
                {pendingSellersCount}
              </Typography>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onSendDailyReminders}
            disabled={pendingSellersCount === 0 || !activeRoutineStoreId}
            className="w-full h-mx-12 rounded-mx-xl font-black uppercase tracking-widest text-mx-tiny"
          >
            <Send size={16} className="mr-2" /> Lembrar Pendentes
          </Button>
        </div>
      </Card>

      <Card className="p-mx-10 md:p-12 space-y-mx-lg border-none shadow-mx-lg bg-white">
        <header className="flex items-center gap-mx-sm mb-4">
          <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center border border-status-success/20 shadow-mx-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <Typography variant="h3" className="uppercase tracking-tight leading-none">
              Auditoria Diária
            </Typography>
            <Typography
              variant="caption"
              tone="muted"
              className="uppercase font-black text-tiny tracking-widest mt-1"
            >
              {routineLog ? 'LOG SINCRONIZADO' : 'AGUARDANDO FIRMA'}
            </Typography>
          </div>
        </header>
        <Textarea
          value={routineNotes}
          onChange={(e) => setRoutineNotes(e.target.value)}
          placeholder="Observações táticas da operação de hoje..."
          className="min-h-mx-xl"
        />
        <Button
          onClick={onRegisterRoutine}
          disabled={savingRoutine || !!routineLog}
          className="w-full h-mx-2xl rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest text-tiny"
        >
          {savingRoutine ? (
            <RefreshCw className="animate-spin mr-2" />
          ) : (
            <FileCheck size={20} className="mr-2" />
          )}{' '}
          FIRMAR AUDITORIA
        </Button>
      </Card>
    </aside>
  )
}

export default RotinaSnapshotAside
