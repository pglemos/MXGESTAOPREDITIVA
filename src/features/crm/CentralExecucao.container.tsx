import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle2, XCircle, Clock, Plus, MessageCircle, Trash2 } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { useAgendamentos, type AgendamentoInput, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { DAILY_ROUTINE_SLOTS } from '@/features/vendedor-home/data/dailyRoutine'
import { resolveCloseDayReminderSchedule } from '@/lib/daily-routine'
import { Link } from 'react-router-dom'
import {
  CRM_CANAIS, CRM_CANAL_LABEL,
  CRM_AGENDAMENTO_TIPO,
  CRM_AGENDAMENTO_STATUS, CRM_AGENDAMENTO_STATUS_LABEL,
  type CrmAgendamentoStatus,
} from '@/lib/schemas/crm.schema'

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita', retorno: 'Retorno', test_drive: 'Test drive', entrega: 'Entrega', negociacao: 'Negociação',
}
type Filtro = 'hoje' | 'atrasados' | 'proximos7' | 'todos'

const isSameDay = (d: Date, ref: Date) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
const onlyDigits = (s: string | null | undefined) => (s || '').replace(/\D/g, '')

const EMPTY: AgendamentoInput = {
  cliente_id: '', data_hora: '', canal: null, tipo: 'visita', status: 'aguardando', proxima_acao: '',
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="border-none bg-white p-mx-md shadow-mx-md">
      <div className="flex items-center gap-mx-xs text-text-secondary">{icon}<Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography></div>
      <Typography variant="h2" className="mt-mx-xs text-2xl">{value}</Typography>
      {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
    </Card>
  )
}

export function CentralExecucao() {
  const { agendamentos, metrics, loading, error, createAgendamento, updateStatus, deleteAgendamento } = useAgendamentos()
  const { clientes } = useClientes()
  const { perfil } = useVendedorPerfil()
  const closeDayReminder = resolveCloseDayReminderSchedule({
    enabled: perfil.fechar_dia_notificacao_ativa,
    reminderTime: perfil.fechar_dia_notificacao_hora,
    workEndTime: perfil.hora_saida,
    workDays: perfil.dias_trabalho,
  })
  const [filtro, setFiltro] = useState<Filtro>('hoje')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AgendamentoInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtrados = useMemo(() => {
    const hoje = new Date()
    const em7 = new Date(); em7.setDate(em7.getDate() + 7)
    return agendamentos.filter(a => {
      const d = new Date(a.data_hora)
      if (filtro === 'hoje') return isSameDay(d, hoje)
      if (filtro === 'atrasados') return d < hoje && !isSameDay(d, hoje) && (a.status === 'aguardando' || a.status === 'confirmado')
      if (filtro === 'proximos7') return d >= hoje && d <= em7
      return true
    })
  }, [agendamentos, filtro])

  async function handleCreate() {
    if (!form.data_hora) { toast.error('Informe data e hora.'); return }
    setSaving(true)
    const { error: e } = await createAgendamento(form)
    setSaving(false)
    if (e) { toast.error(e); return }
    toast.success('Agendamento criado.')
    setForm(EMPTY); setModalOpen(false)
  }

  async function handleStatus(id: string, status: CrmAgendamentoStatus) {
    const { error: e } = await updateStatus(id, status)
    if (e) { toast.error(e); return }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o agendamento de "${nome}"?`)) return
    const { error: e } = await deleteAgendamento(id)
    if (e) { toast.error(e); return }
    toast.success('Agendamento excluído.')
  }

  function openWhatsApp(a: AgendamentoComCliente) {
    const tel = onlyDigits(a.cliente?.telefone)
    if (!tel) { toast.error('Cliente sem telefone cadastrado.'); return }
    const num = tel.length <= 11 ? `55${tel}` : tel
    window.open(`https://wa.me/${num}`, '_blank', 'noopener')
  }

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader
          title="Central de Execução"
          description="Sua rotina diária. Organize o dia e foque no que gera resultado."
          actions={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Novo agendamento</Button>}
        />

        {error && <Typography className="text-status-error">{error}</Typography>}

        <section className="grid grid-cols-2 gap-mx-md md:grid-cols-4 xl:grid-cols-5" aria-label="Indicadores do dia">
          <Metric icon={<CalendarCheck size={16} />} label="Agendamentos Hoje" value={String(metrics.agendamentosHoje)} hint="do dia" />
          <Metric icon={<CheckCircle2 size={16} />} label="Compareceram" value={String(metrics.compareceram)} hint={`${metrics.taxaComparecimento}% do dia`} />
          <Metric icon={<XCircle size={16} />} label="Não Compareceram" value={String(metrics.naoCompareceram)} />
          <Metric icon={<Clock size={16} />} label="Confirmados" value={String(metrics.confirmados)} />
          <Metric icon={<Clock size={16} />} label="Aguardando" value={String(metrics.aguardando)} />
        </section>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-3">
          <Card className="border-none bg-white p-mx-lg shadow-mx-md xl:col-span-2">
            <div className="flex flex-wrap gap-mx-xs">
              {([['hoje', 'Hoje'], ['atrasados', 'Atrasados'], ['proximos7', 'Próximos 7 dias'], ['todos', 'Todos']] as [Filtro, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFiltro(f)} className={`rounded-mx-md px-3 py-1.5 text-sm font-semibold transition-colors ${filtro === f ? 'bg-brand-secondary text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface'}`}>{label}</button>
              ))}
            </div>

            <div className="mt-mx-lg overflow-x-auto">
              {loading ? (
                <Typography tone="muted">Carregando agenda...</Typography>
              ) : filtrados.length === 0 ? (
                <EmptyState title="Nada na agenda" description="Crie um agendamento para organizar seu dia." />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-text-muted">
                      <th className="pb-mx-sm font-semibold">Horário</th>
                      <th className="pb-mx-sm font-semibold">Cliente</th>
                      <th className="pb-mx-sm font-semibold">Tipo</th>
                      <th className="pb-mx-sm font-semibold">Canal</th>
                      <th className="pb-mx-sm font-semibold">Status</th>
                      <th className="pb-mx-sm font-semibold">Próxima ação</th>
                      <th className="pb-mx-sm font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(a => (
                      <tr key={a.id} className="border-t border-border-subtle">
                        <td className="py-mx-sm">
                          <Typography variant="p" className="font-semibold">{fmtHora(a.data_hora)}</Typography>
                          <Typography variant="caption" tone="muted">{fmtData(a.data_hora)}</Typography>
                        </td>
                        <td className="py-mx-sm font-semibold">{a.cliente?.nome || '—'}</td>
                        <td className="py-mx-sm text-text-secondary">{TIPO_LABEL[a.tipo]}</td>
                        <td className="py-mx-sm text-text-secondary">{a.canal ? CRM_CANAL_LABEL[a.canal] : '—'}</td>
                        <td className="py-mx-sm">
                          <Select aria-label="Status" value={a.status} onChange={e => handleStatus(a.id, e.target.value as CrmAgendamentoStatus)}>
                            {CRM_AGENDAMENTO_STATUS.map(s => <option key={s} value={s}>{CRM_AGENDAMENTO_STATUS_LABEL[s]}</option>)}
                          </Select>
                        </td>
                        <td className="py-mx-sm text-text-secondary">{a.proxima_acao || '—'}</td>
                        <td className="py-mx-sm">
                          <div className="flex items-center justify-end gap-mx-xs">
                            <Button variant="ghost" size="icon" aria-label="WhatsApp" onClick={() => openWhatsApp(a)}><MessageCircle size={16} /></Button>
                            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => handleDelete(a.id, a.cliente?.nome || 'cliente')}><Trash2 size={16} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card className="border-none bg-white p-mx-lg shadow-mx-md">
            <Typography variant="h3" className="uppercase tracking-tight">Rotina do Dia</Typography>
            <Typography variant="caption" tone="muted">Siga sua rotina e ganhe disciplina.</Typography>
            <div className="mt-mx-md rounded-mx-lg bg-status-info-surface p-mx-sm">
              <div className="flex items-start justify-between gap-mx-sm">
                <div>
                  <Typography variant="caption" tone="muted">Expediente cadastrado</Typography>
                  <Typography variant="p" className="font-black">
                    {perfil.hora_entrada && perfil.hora_saida
                      ? `${perfil.hora_entrada.slice(0, 5)} às ${perfil.hora_saida.slice(0, 5)}`
                      : 'Cadastre seu horário'}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {closeDayReminder.enabled
                      ? `Lembrete Fechar o dia: ${closeDayReminder.time}`
                      : perfil.fechar_dia_notificacao_ativa
                        ? 'Lembrete Fechar o dia: defina um horário'
                      : 'Lembrete Fechar o dia desativado'}
                  </Typography>
                </div>
                <Link to="/perfil" className="shrink-0 rounded-mx-md bg-white px-3 py-1.5 text-xs font-black text-brand-secondary shadow-sm hover:bg-surface-alt">
                  Editar
                </Link>
              </div>
            </div>
            <ol className="mt-mx-md flex flex-col gap-mx-md">
              {DAILY_ROUTINE_SLOTS.map((slot, i) => (
                <li key={slot.task} className="flex gap-mx-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-secondary/10 text-sm font-bold text-brand-secondary">{i + 1}</span>
                  <div>
                    <Typography variant="p" className="font-semibold">{slot.task}</Typography>
                    <Typography variant="caption" tone="muted">{slot.desc}</Typography>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo agendamento"
        description="Organize um compromisso com um cliente."
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar agendamento'}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <Select label="Cliente" value={form.cliente_id || ''} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value || null }))}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
          </Select>
          <FormField type="datetime-local" label="Data e hora *" value={form.data_hora} onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))} />
          <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as AgendamentoInput['tipo'] }))}>
            {CRM_AGENDAMENTO_TIPO.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          </Select>
          <Select label="Canal" value={form.canal || ''} onChange={e => setForm(f => ({ ...f, canal: (e.target.value || null) as AgendamentoInput['canal'] }))}>
            <option value="">Selecione</option>
            {CRM_CANAIS.map(c => <option key={c} value={c}>{CRM_CANAL_LABEL[c]}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CrmAgendamentoStatus }))}>
            {CRM_AGENDAMENTO_STATUS.map(s => <option key={s} value={s}>{CRM_AGENDAMENTO_STATUS_LABEL[s]}</option>)}
          </Select>
          <FormField label="Próxima ação" value={form.proxima_acao || ''} onChange={e => setForm(f => ({ ...f, proxima_acao: e.target.value }))} placeholder="Ex: Ligar 30 min antes" />
        </div>
      </Modal>
    </main>
  )
}

export default CentralExecucao
