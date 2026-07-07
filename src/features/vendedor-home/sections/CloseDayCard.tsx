import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { DashboardCard, PanelTitle, ProgressRing, CheckRow } from './DashboardPrimitives'

export function CloseDayCard({
  disciplina,
  fechamentoFeito,
  atividadesTotal,
  feedbacksPendentes,
  clientesSemStatus,
}: {
  disciplina: number
  fechamentoFeito: boolean
  atividadesTotal: number
  feedbacksPendentes: number
  clientesSemStatus: number
}) {
  const atividadesConcluidas = Math.max(0, atividadesTotal - clientesSemStatus)
  const hasActivities = atividadesTotal > 0
  const activityProgress = hasActivities ? Math.round((atividadesConcluidas / atividadesTotal) * 100) : 0
  const completion = fechamentoFeito ? 100 : Math.max(20, Math.round((activityProgress + disciplina) / 2))
  const pendencias = [
    !fechamentoFeito ? 'Fechamento Diário' : null,
    !hasActivities || atividadesConcluidas === 0 ? 'Atividades não executadas' : null,
    feedbacksPendentes > 0 ? `${feedbacksPendentes} feedback obrigatório${feedbacksPendentes === 1 ? '' : 's'}` : null,
    clientesSemStatus > 0 ? `${clientesSemStatus} cliente${clientesSemStatus === 1 ? '' : 's'} sem status atualizado` : 'Clientes sem status atualizado',
  ].filter(Boolean)

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Fechamento Diário" subtitle="Confirme produção, pendências e justificativas do dia." />
      <div className="mt-mx-lg grid grid-cols-[96px_minmax(0,1fr)] items-center gap-mx-md">
        <ProgressRing value={completion} label="do dia concluído" />
        <div className="space-y-mx-sm">
          <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">
            Atividades realizadas: {hasActivities ? `${atividadesConcluidas} de ${atividadesTotal}` : 'nenhuma atividade registrada'}
          </Typography>
          <Typography variant="p" className="font-semibold text-text-primary">
            Concluído:
          </Typography>
          <CheckRow label="Central de Execução acessada" value="ok" done />
          <CheckRow label="Próximos passos sugeridos" value="ok" done />
          <Typography variant="p" className="pt-mx-xs font-semibold text-text-primary">
            Pendências:
          </Typography>
          {pendencias.length === 0 ? (
            <CheckRow label="Nenhuma pendência crítica" value="ok" done />
          ) : (
            pendencias.map((item) => <CheckRow key={item} label={item || ''} value="" />)
          )}
        </div>
      </div>
      <Link to="/vendedor/terminal-mx" className="mt-mx-lg flex h-11 w-full items-center justify-center rounded-mx-md bg-brand-primary text-sm font-semibold text-white">
        Abrir Fechamento Diário
      </Link>
    </DashboardCard>
  )
}
