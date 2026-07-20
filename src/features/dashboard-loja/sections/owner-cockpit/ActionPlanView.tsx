import { Download, MoreVertical, Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { toneClasses, type ActionRow } from './types'
import { SectionTitle, SideList, ToolbarPlaceholder } from './primitives'
import { OwnerActionPlanSummary } from './OwnerHomeWidgets'

export function ActionPlanView({
  actions,
  onNewAction,
  disableNewAction,
}: {
  actions: ActionRow[]
  onNewAction: () => void
  disableNewAction: boolean
}) {
  const handleExport = () => {
    const headers = [
      'Prioridade',
      'Departamento',
      'Indicador',
      'Problema',
      'Ação',
      'Como',
      'Responsável',
      'Prazo',
      'Status',
      'Eficácia',
      'Origem',
      'Evidência',
    ]
    const rows = actions.map((action) => [
      action.priority,
      action.department,
      action.indicator,
      action.problem,
      action.action,
      action.how,
      action.owner,
      action.due,
      action.status,
      action.efficacy,
      action.origin,
      action.evidence,
    ])
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'plano-de-acao.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Plano de Ação" subtitle="Transforme problemas em execução e acompanhe eficácia." />
        <div className="flex gap-mx-sm">
          <Button type="button" className="rounded-mx-xl" onClick={onNewAction} disabled={disableNewAction}>
            <Plus size={16} /> Nova Ação
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-mx-xl bg-white"
            onClick={handleExport}
            disabled={actions.length === 0}
          >
            <Download size={16} /> Exportar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <ToolbarPlaceholder searchPlaceholder="Buscar ação, problema ou indicador..." />
          {actions.length === 0 ? (
            <div className="owner-base44-exact__empty-state mt-mx-md" role="status">
              <strong className="text-base font-black text-text-primary">Nenhuma ação cadastrada</strong>
              <p className="text-sm text-text-secondary">O plano de ação para esta unidade está vazio.</p>
            </div>
          ) : (
            <div className="mt-mx-md overflow-x-auto">
              <table className="min-w-[1480px] w-full text-sm">
                <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                  <tr>
                    <th className="px-mx-sm py-mx-sm">Prioridade</th>
                    <th className="px-mx-sm py-mx-sm">Departamento</th>
                    <th className="px-mx-sm py-mx-sm">Indicador</th>
                    <th className="px-mx-sm py-mx-sm">Problema</th>
                    <th className="px-mx-sm py-mx-sm">Ação</th>
                    <th className="px-mx-sm py-mx-sm">Como</th>
                    <th className="px-mx-sm py-mx-sm">Responsável</th>
                    <th className="px-mx-sm py-mx-sm">Prazo</th>
                    <th className="px-mx-sm py-mx-sm">Status</th>
                    <th className="px-mx-sm py-mx-sm">Eficácia</th>
                    <th className="px-mx-sm py-mx-sm">Origem</th>
                    <th className="px-mx-sm py-mx-sm">Evidência</th>
                    <th className="px-mx-sm py-mx-sm">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {actions.map((action, index) => {
                    const classes = toneClasses[action.tone]
                    return (
                      <tr key={`${action.id}-${index}`}>
                        <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.priority}</span></td>
                        <td className="px-mx-sm py-mx-sm font-black">{action.department}</td>
                        <td className="px-mx-sm py-mx-sm text-text-secondary">{action.indicator}</td>
                        <td className="px-mx-sm py-mx-sm font-black">{action.problem}</td>
                        <td className="px-mx-sm py-mx-sm text-text-secondary">{action.action}</td>
                        <td className="px-mx-sm py-mx-sm text-text-secondary">{action.how}</td>
                        <td className="px-mx-sm py-mx-sm font-bold">{action.owner}</td>
                        <td className={cn('px-mx-sm py-mx-sm font-black', classes.text)}>{action.due}</td>
                        <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.status}</span></td>
                        <td className="px-mx-sm py-mx-sm font-bold">{action.efficacy}</td>
                        <td className="px-mx-sm py-mx-sm">{action.origin}</td>
                        <td className="px-mx-sm py-mx-sm text-text-secondary">{action.evidence}</td>
                        <td className="px-mx-sm py-mx-sm"><MoreVertical size={18} className="text-text-tertiary" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-mx-md">
          <OwnerActionPlanSummary actions={actions} />
          <SideList title="Gargalos Principais" items={actions.slice(0, 3).map(action => action.problem)} />
        </div>
      </div>
    </div>
  )
}
