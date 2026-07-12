import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { CalendarDays, Copy, MessageCircle, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Modal } from '@/components/organisms/Modal'
import {
  AGENDA_CANAL_LABEL,
  AGENDA_D1_DEFAULT_FILTERS,
  AGENDA_STATUS_LABEL,
  AGENDA_TIPO_LABEL,
  CONFIRMATION_OUTCOMES,
  buildWhatsappMessage,
  buildWhatsappUrl,
  dedupeActiveAppointments,
  extractMeetLink,
  filterAgenda,
  normalizePhoneBr,
  type AgendaD1Filters,
  type AgendaD1Row,
  type ConfirmationOutcome,
} from './agenda-d1'

interface SellerOption { id: string; name: string }

export interface AgendaD1PanelProps {
  open: boolean
  onClose: () => void
  referenceDate: string
  sellers: SellerOption[]
  initialSellerId?: string
}

/**
 * Agenda D+1 do gerente. Origem canônica: agendamentos do CRM/carteira.
 * O gerente não altera a agenda do vendedor: contatos e confirmações são
 * registrados em d1_audit_log e reagendamento/cancelamento notifica o vendedor.
 */
export function AgendaD1Panel({ open, onClose, referenceDate, sellers, initialSellerId }: AgendaD1PanelProps) {
  const { storeId, profile, membership } = useAuth()
  const { sendNotification } = useNotifications()
  const d1Date = useMemo(() => format(addDays(parseISO(referenceDate), 1), 'yyyy-MM-dd'), [referenceDate])
  const [rows, setRows] = useState<AgendaD1Row[]>([])
  const [lastContactByCliente, setLastContactByCliente] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AgendaD1Filters>({ ...AGENDA_D1_DEFAULT_FILTERS, sellerId: initialSellerId || 'all' })
  const [confirming, setConfirming] = useState<{ rowId: string; outcome: ConfirmationOutcome | ''; note: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setFilters({ ...AGENDA_D1_DEFAULT_FILTERS, sellerId: initialSellerId || 'all' })
  }, [open, initialSellerId])

  const fetchAgenda = useCallback(async () => {
    if (!storeId || !open) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('agendamentos')
      .select('id, data_hora, canal, tipo, status, observacoes, seller_user_id, cliente:clientes(id, nome, telefone, telefone_normalizado, ultima_interacao), oportunidade:oportunidades(veiculo_interesse)')
      .eq('loja_id', storeId)
      .gte('data_hora', `${d1Date}T00:00:00-03:00`)
      .lte('data_hora', `${d1Date}T23:59:59-03:00`)
      .order('data_hora')
    if (fetchError) {
      setError(fetchError.message)
      setRows([])
      setLoading(false)
      return
    }
    const active = dedupeActiveAppointments((data || []) as unknown as AgendaD1Row[])
    setRows(active)
    const clienteIds = active.map(item => item.cliente?.id).filter((id): id is string => Boolean(id))
    if (clienteIds.length) {
      const { data: logs } = await supabase
        .from('d1_audit_log')
        .select('cliente_id, created_at')
        .in('cliente_id', clienteIds)
        .order('created_at', { ascending: false })
      const map = new Map<string, string>()
      for (const log of logs || []) {
        if (log.cliente_id && !map.has(log.cliente_id)) map.set(log.cliente_id, log.created_at)
      }
      setLastContactByCliente(map)
    } else {
      setLastContactByCliente(new Map())
    }
    setLoading(false)
  }, [storeId, open, d1Date])

  useEffect(() => { void fetchAgenda() }, [fetchAgenda])

  const sellerNameById = useMemo(() => new Map(sellers.map(seller => [seller.id, seller.name])), [sellers])
  const visible = useMemo(() => filterAgenda(rows, filters), [rows, filters])

  const registerLog = useCallback(async (row: AgendaD1Row, tipoAlteracao: string, valorAnterior: string | null, valorNovo: string) => {
    if (!profile?.id) return { error: 'Sessão inválida.' }
    const { error: insertError } = await supabase.from('d1_audit_log').insert({
      usuario_id: profile.id,
      usuario_nome: profile.name || null,
      cliente_id: row.cliente?.id || null,
      tipo_alteracao: tipoAlteracao,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
    })
    if (insertError) return { error: insertError.message }
    if (row.cliente?.id) {
      setLastContactByCliente(prev => new Map(prev).set(row.cliente!.id, new Date().toISOString()))
    }
    return { error: null }
  }, [profile?.id, profile?.name])

  const openWhatsapp = useCallback(async (row: AgendaD1Row) => {
    const phone = normalizePhoneBr(row.cliente?.telefone_normalizado || row.cliente?.telefone)
    if (!phone || !row.cliente) {
      toast.error('Cliente sem telefone válido para WhatsApp.')
      return
    }
    const message = buildWhatsappMessage({
      clienteNome: row.cliente.nome,
      tipo: row.tipo,
      dataHora: row.data_hora,
      lojaNome: membership?.store?.name || null,
      meetLink: extractMeetLink(row.observacoes),
    })
    window.open(buildWhatsappUrl(phone, message), '_blank', 'noopener')
    const results = await Promise.all([
      registerLog(row, 'agenda_d1_whatsapp', AGENDA_STATUS_LABEL[row.status], 'WhatsApp aberto pelo gerente'),
      storeId && profile?.id
        ? supabase.from('logs_compartilhamento_whatsapp').insert({ store_id: storeId, user_id: profile.id, message_text: message, reference_date: d1Date, shared_via: 'whatsapp', source: 'agenda_d1_gerente' }).then(result => ({ error: result.error?.message || null }))
        : Promise.resolve({ error: null }),
    ])
    const failure = results.find(result => result.error)
    if (failure?.error) toast.error(`Contato aberto, mas o log falhou: ${failure.error}`)
    else toast.success('WhatsApp aberto e contato registrado.')
  }, [membership?.store?.name, registerLog, storeId, profile?.id, d1Date])

  const callPhone = useCallback(async (row: AgendaD1Row) => {
    const phone = normalizePhoneBr(row.cliente?.telefone_normalizado || row.cliente?.telefone)
    if (!phone) {
      toast.error('Cliente sem telefone válido.')
      return
    }
    window.location.href = `tel:+${phone}`
    const { error: logError } = await registerLog(row, 'agenda_d1_telefone', AGENDA_STATUS_LABEL[row.status], 'Ligação iniciada pelo gerente')
    if (logError) toast.error(`Ligação iniciada, mas o log falhou: ${logError}`)
    else toast.success('Ligação registrada.')
  }, [registerLog])

  const copyPhone = useCallback(async (row: AgendaD1Row) => {
    const phone = normalizePhoneBr(row.cliente?.telefone_normalizado || row.cliente?.telefone)
    if (!phone) {
      toast.error('Cliente sem telefone válido.')
      return
    }
    try {
      await navigator.clipboard.writeText(`+${phone}`)
      toast.success('Telefone copiado. Use seu aparelho para ligar.')
    } catch {
      toast.error(`Não foi possível copiar. Número: +${phone}`)
    }
  }, [])

  const saveConfirmation = useCallback(async (row: AgendaD1Row) => {
    if (!confirming || confirming.rowId !== row.id || !confirming.outcome) return
    if (confirming.outcome === 'Outro' && !confirming.note.trim()) {
      toast.error('Descreva a observação para o resultado "Outro".')
      return
    }
    setSaving(true)
    const valorNovo = confirming.note.trim() ? `${confirming.outcome} — ${confirming.note.trim()}` : confirming.outcome
    const { error: logError } = await registerLog(row, 'agenda_d1_confirmacao', AGENDA_STATUS_LABEL[row.status], valorNovo)
    if (logError) {
      toast.error(`Não foi possível registrar: ${logError}`)
      setSaving(false)
      return
    }
    if (confirming.outcome === 'Solicitou reagendamento' || confirming.outcome === 'Cancelou') {
      const { error: notificationError } = await sendNotification({
        recipient_id: row.seller_user_id,
        title: confirming.outcome === 'Cancelou' ? 'Cliente cancelou agendamento D+1' : 'Cliente pediu reagendamento (D+1)',
        message: `${row.cliente?.nome || 'Cliente'} — ${format(parseISO(row.data_hora), 'dd/MM HH:mm')}. ${valorNovo}. A agenda original não foi alterada: atualize pela Carteira.`,
        type: 'agenda',
        priority: 'high',
        link: '/carteira',
      })
      if (notificationError) toast.error('Registro salvo, mas o aviso ao vendedor falhou.')
    }
    toast.success('Contato registrado na auditoria D+1.')
    setConfirming(null)
    setSaving(false)
  }, [confirming, registerLog, sendNotification])

  const filterSelectClass = 'h-mx-10'

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Agenda D+1" description={`Agendamentos de ${format(parseISO(d1Date), 'dd/MM/yyyy')} — origem: Carteira/CRM. Confirmações não alteram a agenda do vendedor.`}>
      <div className="space-y-mx-md">
        <div className="grid grid-cols-2 gap-mx-sm md:grid-cols-5" role="group" aria-label="Filtros da Agenda D+1">
          <Select label="Vendedor" className={filterSelectClass} value={filters.sellerId} onChange={event => setFilters(prev => ({ ...prev, sellerId: event.target.value }))}>
            <option value="all">Todos</option>
            {sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
          </Select>
          <Select label="Canal" className={filterSelectClass} value={filters.canal} onChange={event => setFilters(prev => ({ ...prev, canal: event.target.value as AgendaD1Filters['canal'] }))}>
            <option value="all">Todos</option>
            {Object.entries(AGENDA_CANAL_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select label="Tipo" className={filterSelectClass} value={filters.tipo} onChange={event => setFilters(prev => ({ ...prev, tipo: event.target.value as AgendaD1Filters['tipo'] }))}>
            <option value="all">Todos</option>
            {Object.entries(AGENDA_TIPO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select label="Status" className={filterSelectClass} value={filters.status} onChange={event => setFilters(prev => ({ ...prev, status: event.target.value as AgendaD1Filters['status'] }))}>
            <option value="all">Todos</option>
            {Object.entries(AGENDA_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select label="Horário" className={filterSelectClass} value={filters.periodo} onChange={event => setFilters(prev => ({ ...prev, periodo: event.target.value as AgendaD1Filters['periodo'] }))}>
            <option value="all">Todos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </Select>
        </div>
        {error && (
          <div className="rounded-mx-md border border-status-error/30 bg-status-error-surface p-mx-md">
            <Typography variant="p" tone="error">Não foi possível carregar a Agenda D+1: {error}</Typography>
            <Button size="xs" variant="outline" className="mt-mx-sm" onClick={() => void fetchAgenda()}>Tentar novamente</Button>
          </div>
        )}
        {loading ? (
          <div className="space-y-mx-sm" aria-busy="true"><Skeleton className="h-mx-12" /><Skeleton className="h-mx-12" /><Skeleton className="h-mx-12" /></div>
        ) : visible.length === 0 ? (
          <div className="p-mx-xl text-center">
            <CalendarDays className="mx-auto text-text-tertiary" />
            <Typography variant="p" tone="muted" className="mt-mx-sm">{rows.length === 0 ? 'Nenhum agendamento ativo para amanhã.' : 'Nenhum agendamento corresponde aos filtros.'}</Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-surface-alt">
                <tr>{['Horário', 'Cliente', 'Telefone', 'Veículo', 'Canal', 'Vendedor', 'Tipo', 'Status', 'Último contato', 'Ações'].map(label => <th key={label} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-wider text-text-tertiary">{label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visible.map(row => {
                  const lastContact = row.cliente ? (lastContactByCliente.get(row.cliente.id) || row.cliente.ultima_interacao) : null
                  const isConfirming = confirming?.rowId === row.id
                  return (
                    <FragmentRow key={row.id}>
                      <tr>
                        <td className="px-mx-md py-mx-sm font-black">{format(parseISO(row.data_hora), 'HH:mm')}</td>
                        <td className="px-mx-md py-mx-sm font-bold">{row.cliente?.nome || '—'}</td>
                        <td className="px-mx-md py-mx-sm">{row.cliente?.telefone || '—'}</td>
                        <td className="px-mx-md py-mx-sm">{row.oportunidade?.veiculo_interesse || '—'}</td>
                        <td className="px-mx-md py-mx-sm">{row.canal ? AGENDA_CANAL_LABEL[row.canal] : '—'}</td>
                        <td className="px-mx-md py-mx-sm">{sellerNameById.get(row.seller_user_id) || 'Vendedor da equipe'}</td>
                        <td className="px-mx-md py-mx-sm">{AGENDA_TIPO_LABEL[row.tipo]}</td>
                        <td className="px-mx-md py-mx-sm"><Badge variant={row.status === 'confirmado' ? 'success' : row.status === 'aguardando' ? 'warning' : 'default'}>{AGENDA_STATUS_LABEL[row.status]}</Badge></td>
                        <td className="px-mx-md py-mx-sm text-sm">{lastContact ? format(parseISO(lastContact), 'dd/MM HH:mm') : '—'}</td>
                        <td className="px-mx-md py-mx-sm">
                          <div className="flex flex-wrap gap-mx-xs">
                            <Button size="xs" variant="outline" aria-label={`WhatsApp para ${row.cliente?.nome || 'cliente'}`} onClick={() => void openWhatsapp(row)}><MessageCircle size={13} /> WhatsApp</Button>
                            <Button size="xs" variant="outline" aria-label={`Ligar para ${row.cliente?.nome || 'cliente'}`} onClick={() => void callPhone(row)}><Phone size={13} /> Telefone</Button>
                            <Button size="xs" variant="outline" aria-label="Copiar telefone" onClick={() => void copyPhone(row)}><Copy size={13} /></Button>
                            <Button size="xs" variant={isConfirming ? 'primary' : 'outline'} onClick={() => setConfirming(isConfirming ? null : { rowId: row.id, outcome: '', note: '' })}>Confirmar</Button>
                          </div>
                        </td>
                      </tr>
                      {isConfirming && (
                        <tr className="bg-surface-alt/60">
                          <td colSpan={10} className="px-mx-md py-mx-sm">
                            <div className="flex flex-wrap items-end gap-mx-sm">
                              <Select label="Resultado do contato" className="h-mx-10 min-w-[220px]" value={confirming.outcome} onChange={event => setConfirming(prev => prev ? { ...prev, outcome: event.target.value as ConfirmationOutcome } : prev)}>
                                <option value="" disabled>Selecione…</option>
                                {CONFIRMATION_OUTCOMES.map(outcome => <option key={outcome} value={outcome}>{outcome}</option>)}
                              </Select>
                              <div className="min-w-[260px] flex-1">
                                <label className="mb-mx-2xs block text-mx-tiny font-black uppercase tracking-wider text-text-tertiary" htmlFor={`agenda-d1-note-${row.id}`}>{confirming.outcome === 'Outro' ? 'Observação (obrigatória)' : 'Observação (opcional)'}</label>
                                <Input id={`agenda-d1-note-${row.id}`} className="h-mx-10" value={confirming.note} onChange={event => setConfirming(prev => prev ? { ...prev, note: event.target.value } : prev)} placeholder="Detalhe do contato com o cliente" />
                              </div>
                              <Button size="sm" disabled={saving || !confirming.outcome} onClick={() => void saveConfirmation(row)}>{saving ? 'Salvando…' : 'Salvar registro'}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancelar</Button>
                            </div>
                            {(confirming.outcome === 'Solicitou reagendamento' || confirming.outcome === 'Cancelou') && (
                              <Typography variant="tiny" tone="muted" className="mt-mx-xs">A agenda original não será alterada. O vendedor recebe um aviso para atualizar pela Carteira.</Typography>
                            )}
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}

function FragmentRow({ children }: { children: React.ReactNode }) { return <>{children}</> }
