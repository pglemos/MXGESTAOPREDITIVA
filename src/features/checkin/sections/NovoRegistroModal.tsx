import { useState } from 'react'
import { ArrowLeft, CalendarCheck, ShieldCheck, ShoppingCart, UserCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { Typography } from '@/components/atoms/Typography'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import type { CrmCanal, CrmEtapaFunil } from '@/lib/schemas/crm.schema'

/**
 * Modal unico "Novo Registro" — porta 1:1 de components/fechamento/
 * NovoRegistroModal.jsx (Base44). 4 tipos (Agendamento/Venda/Garantia/
 * Qualificado), cada um com formulario proprio, todos gravando na base
 * unica cliente+oportunidade+agendamento (schema real, nao entities SDK).
 */

type RegistroTipo = 'agendamento' | 'venda' | 'garantia' | 'qualificado'

const CANAIS_UI = ['Showroom', 'Internet', 'Carteira'] as const
const CANAL_UI_TO_DB: Record<string, CrmCanal> = { Showroom: 'showroom', Internet: 'internet', Carteira: 'carteira' }
const MODALIDADES = ['Visita na loja', 'Atendimento externo', 'Videochamada'] as const
const SITUACOES_OPORTUNIDADE = ['Nova', 'Validação', 'Construção', 'Compromisso', 'Decisão', 'Recuperação'] as const
const PASSO_TO_ETAPA: Record<string, CrmEtapaFunil> = {
  Nova: 'prospeccao', Validação: 'qualificacao', Construção: 'apresentacao', Compromisso: 'negociacao', Decisão: 'fechamento', Recuperação: 'prospeccao',
}
const MOTIVOS_GARANTIA = ['Mecânica', 'Documentação', 'Acessório', 'Acabamento', 'Promessa comercial', 'Outro'] as const
const URGENCIAS = ['Imediato', '30 dias', '60 dias', '90 dias', 'Sem prazo'] as const
const FINANCIAMENTO_OPTS = ['Aprovado', 'Recusado', 'Não se aplica'] as const
const FINANCIAMENTO_UI_TO_DB: Record<string, 'aprovado' | 'reprovado' | 'nao_aplica'> = {
  Aprovado: 'aprovado', Recusado: 'reprovado', 'Não se aplica': 'nao_aplica',
}

function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '')
}

function formatPhone(raw: string): string {
  const d = (raw || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function formatCurrency(raw: string): string {
  const num = (raw || '').replace(/\D/g, '')
  if (!num) return ''
  const val = (parseInt(num, 10) / 100).toFixed(2)
  return 'R$ ' + parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

function currencyToNumber(raw: string): number {
  const num = (raw || '').replace(/\D/g, '')
  return num ? parseInt(num, 10) / 100 : 0
}

type FormState = Record<string, string>

interface TipoDef {
  id: RegistroTipo
  icon: typeof CalendarCheck
  label: string
  desc: string
  cor: string
  iconCor: string
}

const TIPOS: TipoDef[] = [
  { id: 'agendamento', icon: CalendarCheck, label: 'Agendamento', desc: 'Compromisso comercial futuro', cor: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700', iconCor: 'text-blue-500' },
  { id: 'venda', icon: ShoppingCart, label: 'Venda', desc: 'Negócio fechado', cor: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700', iconCor: 'text-green-500' },
  { id: 'garantia', icon: ShieldCheck, label: 'Garantia', desc: 'Pós-venda ou garantia de veículo', cor: 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700', iconCor: 'text-amber-500' },
  { id: 'qualificado', icon: UserCheck, label: 'Qualificado', desc: 'Nova oportunidade trabalhável', cor: 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700', iconCor: 'text-purple-500' },
]

function TipoSelector({ onSelect }: { onSelect: (t: RegistroTipo) => void }) {
  return (
    <div>
      <p className="mb-4 text-[13px] text-slate-500">Qual tipo de registro você quer adicionar?</p>
      <div className="grid grid-cols-2 gap-3">
        {TIPOS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} type="button" onClick={() => onSelect(t.id)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${t.cor}`}>
              <Icon className={`h-7 w-7 ${t.iconCor}`} />
              <span className="text-[13px] font-bold">{t.label}</span>
              <span className="text-[11px] opacity-70">{t.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ClienteEncontradoBadge({ jaVendido }: { jaVendido?: boolean }) {
  return <p className="mt-0.5 text-[10px] font-semibold text-green-600">✓ Cliente encontrado na Carteira{jaVendido ? ' (já vendido)' : ''}.</p>
}

interface FormProps {
  form: FormState
  setF: (key: string, value: string) => void
  clienteEncontrado: boolean
  clienteJaVendido: boolean
  onPhoneBlur: () => void
}

function FormAgendamento({ form, setF, clienteEncontrado, clienteJaVendido, onPhoneBlur }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="WhatsApp / Telefone *" value={form.whatsapp || ''} onChange={e => setF('whatsapp', formatPhone(e.target.value))} onBlur={onPhoneBlur} placeholder="(11) 98765-4321" maxLength={15} />
      <div>
        <FormField label="Nome do Cliente *" value={form.nome || ''} onChange={e => setF('nome', e.target.value.toUpperCase())} placeholder="Ex: JOÃO SANTOS" disabled={clienteEncontrado} />
        {clienteEncontrado && <ClienteEncontradoBadge jaVendido={clienteJaVendido} />}
      </div>
      <Select label="Canal MX *" value={form.canal || ''} onChange={e => setF('canal', e.target.value)}>
        <option value="">Selecione</option>
        {CANAIS_UI.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
      <FormField label="Origem Detalhada" value={form.origem_detalhada || ''} onChange={e => setF('origem_detalhada', e.target.value)} placeholder="Ex: Indicação, Redes Sociais…" />
      <FormField label="Data e Hora do Agendamento *" type="datetime-local" value={form.data_hora_agendamento || ''} onChange={e => setF('data_hora_agendamento', e.target.value)} />
      <Select label="Modalidade *" value={form.modalidade || ''} onChange={e => setF('modalidade', e.target.value)}>
        <option value="">Selecione</option>
        {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      <FormField label="Veículo de Interesse *" value={form.veiculo_texto || ''} onChange={e => setF('veiculo_texto', e.target.value.toUpperCase())} placeholder="Ex: HB20 1.0 COMFORT" />
      <FormField label="Valor Negociado" value={form.valor_negociado || ''} onChange={e => setF('valor_negociado', formatCurrency(e.target.value))} placeholder="R$ 68.900,00" />
      <Select label="Financiamento *" value={form.financiamento || ''} onChange={e => setF('financiamento', e.target.value)}>
        <option value="">Selecione</option>
        {FINANCIAMENTO_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
      </Select>
      <Select label="Interesse em Troca" value={form.possui_troca || 'Não'} onChange={e => setF('possui_troca', e.target.value)}>
        <option value="Sim">Sim</option>
        <option value="Não">Não</option>
      </Select>
      <div className="sm:col-span-2">
        <FormField label="Observação" value={form.observacao || ''} onChange={e => setF('observacao', e.target.value)} placeholder="Observações gerais" />
      </div>
    </div>
  )
}

function FormVenda({ form, setF, clienteEncontrado, clienteJaVendido, onPhoneBlur }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="WhatsApp / Telefone *" value={form.whatsapp || ''} onChange={e => setF('whatsapp', formatPhone(e.target.value))} onBlur={onPhoneBlur} placeholder="(11) 98765-4321" maxLength={15} />
      <div>
        <FormField label="Nome do Cliente *" value={form.nome || ''} onChange={e => setF('nome', e.target.value.toUpperCase())} placeholder="Ex: JOÃO SANTOS" disabled={clienteEncontrado} />
        {clienteEncontrado && <ClienteEncontradoBadge jaVendido={clienteJaVendido} />}
      </div>
      <Select label="Canal MX *" value={form.canal || ''} onChange={e => setF('canal', e.target.value)}>
        <option value="">Selecione</option>
        {CANAIS_UI.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
      <FormField label="Origem Detalhada" value={form.origem_detalhada || ''} onChange={e => setF('origem_detalhada', e.target.value)} placeholder="Ex: Indicação, Tráfego Pago…" />
      <FormField label="Placa do Veículo *" value={form.placa_veiculo || ''} onChange={e => setF('placa_veiculo', e.target.value.toUpperCase())} placeholder="Ex: ABC-1234" maxLength={8} />
      <FormField label="Veículo Vendido *" value={form.veiculo_texto || ''} onChange={e => setF('veiculo_texto', e.target.value.toUpperCase())} placeholder="Ex: HB20 1.0 COMFORT 2024" />
      <FormField label="Data da Venda *" type="date" value={form.data_venda || ''} onChange={e => setF('data_venda', e.target.value)} />
      <FormField label="Valor da Venda *" value={form.valor_venda || ''} onChange={e => setF('valor_venda', formatCurrency(e.target.value))} placeholder="R$ 68.900,00" />
      <Select label="Financiamento *" value={form.financiamento || ''} onChange={e => setF('financiamento', e.target.value)}>
        <option value="">Selecione</option>
        {FINANCIAMENTO_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
      </Select>
      <Select label="Possui Troca" value={form.possui_troca || 'Não'} onChange={e => setF('possui_troca', e.target.value)}>
        <option value="Sim">Sim</option>
        <option value="Não">Não</option>
      </Select>
      <FormField label="Data e Hora da Entrega Prevista" type="datetime-local" value={form.data_hora_entrega || ''} onChange={e => setF('data_hora_entrega', e.target.value)} />
      {form.data_hora_entrega && (
        <FormField label="Observação da Entrega" value={form.observacao_entrega || ''} onChange={e => setF('observacao_entrega', e.target.value)} placeholder="Detalhes da entrega" />
      )}
      <div className="sm:col-span-2">
        <FormField label="Observação Geral" value={form.observacao || ''} onChange={e => setF('observacao', e.target.value)} placeholder="Observações sobre a venda" />
      </div>
    </div>
  )
}

function FormGarantia({ form, setF, clienteEncontrado, clienteJaVendido, onPhoneBlur }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="WhatsApp / Telefone *" value={form.whatsapp || ''} onChange={e => setF('whatsapp', formatPhone(e.target.value))} onBlur={onPhoneBlur} placeholder="(11) 98765-4321" maxLength={15} />
      <div>
        <FormField label="Nome do Cliente *" value={form.nome || ''} onChange={e => setF('nome', e.target.value.toUpperCase())} placeholder="Ex: JOÃO SANTOS" disabled={clienteEncontrado} />
        {clienteEncontrado && <ClienteEncontradoBadge jaVendido={clienteJaVendido} />}
      </div>
      <FormField label="Veículo (texto)" value={form.veiculo_texto || ''} onChange={e => setF('veiculo_texto', e.target.value.toUpperCase())} placeholder="Ex: HB20 1.0 COMFORT 2024" />
      <FormField label="Data da Garantia *" type="date" value={form.data_garantia || ''} onChange={e => setF('data_garantia', e.target.value)} />
      <Select label="Motivo da Garantia *" value={form.motivo_garantia || ''} onChange={e => setF('motivo_garantia', e.target.value)}>
        <option value="">Selecione o motivo</option>
        {MOTIVOS_GARANTIA.map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      <FormField label="Descrição da Garantia *" value={form.descricao_garantia || ''} onChange={e => setF('descricao_garantia', e.target.value)} placeholder="Descreva o problema relatado" />
      <FormField label="Data para Posicionar Cliente *" type="date" value={form.data_posicionamento || ''} onChange={e => setF('data_posicionamento', e.target.value)} />
      <FormField label="Hora para Posicionar" type="time" value={form.hora_posicionamento || ''} onChange={e => setF('hora_posicionamento', e.target.value)} />
      <FormField label="Responsável pela Tratativa" value={form.responsavel || ''} onChange={e => setF('responsavel', e.target.value)} placeholder="Ex: João / Gerência / Oficina" />
      <FormField label="Observação" value={form.observacao || ''} onChange={e => setF('observacao', e.target.value)} placeholder="Observações adicionais" />
    </div>
  )
}

function FormQualificado({ form, setF, clienteEncontrado, clienteJaVendido, onPhoneBlur }: FormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="WhatsApp / Telefone *" value={form.whatsapp || ''} onChange={e => setF('whatsapp', formatPhone(e.target.value))} onBlur={onPhoneBlur} placeholder="(11) 98765-4321" maxLength={15} />
      <div>
        <FormField label="Nome do Cliente *" value={form.nome || ''} onChange={e => setF('nome', e.target.value.toUpperCase())} placeholder="Ex: JOÃO SANTOS" disabled={clienteEncontrado} />
        {clienteEncontrado && <ClienteEncontradoBadge jaVendido={clienteJaVendido} />}
      </div>
      <Select label="Canal MX *" value={form.canal || ''} onChange={e => setF('canal', e.target.value)}>
        <option value="">Selecione</option>
        {CANAIS_UI.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
      <FormField label="Veículo de Interesse *" value={form.veiculo_texto || ''} onChange={e => setF('veiculo_texto', e.target.value.toUpperCase())} placeholder="Ex: HB20 1.0 COMFORT" />
      <FormField label="Orçamento" value={form.orcamento || ''} onChange={e => setF('orcamento', formatCurrency(e.target.value))} placeholder="R$ 68.900,00" />
      <Select label="Financiamento *" value={form.financiamento || ''} onChange={e => setF('financiamento', e.target.value)}>
        <option value="">Selecione</option>
        {FINANCIAMENTO_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
      </Select>
      <Select label="Possui Troca" value={form.possui_troca || 'Não'} onChange={e => setF('possui_troca', e.target.value)}>
        <option value="Sim">Sim</option>
        <option value="Não">Não</option>
      </Select>
      {form.possui_troca === 'Sim' && (
        <>
          <FormField label="Veículo para Troca *" value={form.veiculo_troca || ''} onChange={e => setF('veiculo_troca', e.target.value.toUpperCase())} placeholder="Ex: GOL 1.0 2018" />
          <FormField label="Valor Esperado na Troca" value={form.valor_esperado_troca || ''} onChange={e => setF('valor_esperado_troca', formatCurrency(e.target.value))} placeholder="R$ 25.000,00" />
        </>
      )}
      <Select label="Urgência de Compra" value={form.urgencia || ''} onChange={e => setF('urgencia', e.target.value)}>
        <option value="">Selecione</option>
        {URGENCIAS.map(u => <option key={u} value={u}>{u}</option>)}
      </Select>
      <Select label="Preferência de Modalidade" value={form.modalidade || 'Não informado'} onChange={e => setF('modalidade', e.target.value)}>
        {[...MODALIDADES, 'Não informado'].map(m => <option key={m} value={m}>{m}</option>)}
      </Select>
      <Select label="Passo Atual da Oportunidade *" value={form.passo_atual || ''} onChange={e => setF('passo_atual', e.target.value)}>
        <option value="">Selecione</option>
        {SITUACOES_OPORTUNIDADE.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>
      <div className="sm:col-span-2">
        <FormField label="Observação" value={form.observacao || ''} onChange={e => setF('observacao', e.target.value)} placeholder="Observações adicionais" />
      </div>
    </div>
  )
}

function canSaveForm(tipo: RegistroTipo, form: FormState, clienteEncontrado: boolean): boolean {
  const temNome = clienteEncontrado || form.nome?.trim()
  const temFone = form.whatsapp?.trim()
  if (!temFone || !temNome) return false

  if (tipo === 'agendamento') {
    return Boolean(form.canal && form.data_hora_agendamento && form.modalidade && form.veiculo_texto?.trim() && form.financiamento)
  }
  if (tipo === 'venda') {
    return Boolean(form.canal && form.placa_veiculo?.trim() && form.veiculo_texto?.trim() && form.data_venda && form.valor_venda && form.financiamento
      && (form.possui_troca !== 'Sim'))
  }
  if (tipo === 'garantia') {
    return Boolean(form.data_garantia && form.motivo_garantia && form.descricao_garantia?.trim())
  }
  if (tipo === 'qualificado') {
    return Boolean(form.canal && form.veiculo_texto?.trim() && form.financiamento && form.passo_atual
      && (form.possui_troca !== 'Sim' || form.veiculo_troca?.trim()))
  }
  return false
}

interface NovoRegistroModalProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  defaultDate?: string
}

export function NovoRegistroModal({ open, onClose, onSaved, defaultDate }: NovoRegistroModalProps) {
  const { buscarClienteExistentePorTelefone, createCliente, updateCliente } = useClientes()
  const { createOportunidade } = useOportunidades()
  const { createAgendamento } = useAgendamentos()

  const [tipo, setTipo] = useState<RegistroTipo | null>(null)
  const [form, setFormState] = useState<FormState>({})
  const [clienteEncontradoId, setClienteEncontradoId] = useState<string | null>(null)
  const [clienteJaVendido, setClienteJaVendido] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const hoje = defaultDate || new Date().toISOString().slice(0, 10)
  const amanha = new Date(new Date(`${hoje}T12:00:00`).getTime() + 86400000).toISOString().slice(0, 10)

  const setF = (key: string, val: string) => {
    setFormState(f => ({ ...f, [key]: val }))
    if (key === 'whatsapp') { setClienteEncontradoId(null); setClienteJaVendido(false) }
  }

  const handleWhatsAppBlur = async () => {
    const tel = normalizePhone(form.whatsapp || '')
    if (tel.length < 10) return
    setBuscando(true)
    const id = await buscarClienteExistentePorTelefone(form.whatsapp || '')
    setClienteEncontradoId(id)
    setBuscando(false)
  }

  const handleSelectTipo = (t: RegistroTipo) => {
    setTipo(t)
    const defaults: FormState = { data_venda: hoje, data_garantia: hoje, data_posicionamento: hoje }
    if (t === 'agendamento') defaults.data_hora_agendamento = `${amanha}T09:00`
    setFormState(defaults)
    setClienteEncontradoId(null)
    setClienteJaVendido(false)
  }

  const handleVoltar = () => { setTipo(null); setClienteEncontradoId(null) }
  const handleClose = () => { setTipo(null); setFormState({}); setClienteEncontradoId(null); onClose() }

  async function resolverCliente(): Promise<{ id: string; error: string | null }> {
    if (clienteEncontradoId) return { id: clienteEncontradoId, error: null }
    if (!form.nome?.trim()) return { id: '', error: 'Informe o nome do cliente.' }
    const canalDb = form.canal ? CANAL_UI_TO_DB[form.canal] : null
    const { error, id } = await createCliente({
      nome: form.nome.trim(),
      telefone: form.whatsapp,
      canal_origem: canalDb,
      status: 'oportunidade',
      observacoes: form.observacao?.trim() || null,
    })
    if (error || !id) return { id: '', error: error || 'Não foi possível cadastrar o cliente.' }
    return { id, error: null }
  }

  const handleSave = async () => {
    if (!tipo) return
    setSaving(true)
    try {
      const { id: clienteId, error: clienteError } = await resolverCliente()
      if (clienteError) { toast.error(clienteError); setSaving(false); return }

      const canalDb = form.canal ? CANAL_UI_TO_DB[form.canal] : null
      const financiamentoDb = form.financiamento ? FINANCIAMENTO_UI_TO_DB[form.financiamento] : 'nao_aplica'

      // Quando defaultDate é informado (regularização de um dia passado), o
      // registro precisa "pertencer" àquele dia — created_at é o campo que
      // deriveClientesListFromCrm usa pra filtrar a tabela por data.
      const createdAtOverride = defaultDate ? `${hoje}T12:00:00` : undefined

      if (tipo === 'agendamento') {
        const { error: opError, id: opId } = await createOportunidade({
          cliente_id: clienteId,
          veiculo_interesse: form.veiculo_texto,
          valor_negociado: currencyToNumber(form.valor_negociado || ''),
          etapa: 'negociacao',
          canal: canalDb,
          financiamento: financiamentoDb,
          carro_avaliado: form.possui_troca === 'Sim',
          created_at: createdAtOverride,
        })
        if (opError) { toast.error(opError); setSaving(false); return }
        const tipoAgendamento = form.modalidade === 'Visita na loja' ? 'visita' : 'negociacao'
        const { error: agError } = await createAgendamento({
          cliente_id: clienteId,
          oportunidade_id: opId,
          data_hora: form.data_hora_agendamento,
          canal: canalDb,
          tipo: tipoAgendamento,
          status: 'confirmado',
          observacoes: [form.modalidade, form.origem_detalhada, form.observacao].filter(Boolean).join(' — ') || null,
        })
        if (agError) { toast.error(agError); setSaving(false); return }
      }

      if (tipo === 'venda') {
        const { error: opError, id: opId } = await createOportunidade({
          cliente_id: clienteId,
          veiculo_interesse: form.veiculo_texto,
          valor_negociado: currencyToNumber(form.valor_venda || ''),
          etapa: 'ganho',
          canal: canalDb,
          financiamento: financiamentoDb,
          carro_avaliado: form.possui_troca === 'Sim',
          closed_at: `${form.data_venda}T12:00:00`,
          placa_veiculo: form.placa_veiculo,
          data_entrega_prevista: form.data_hora_entrega || null,
          created_at: createdAtOverride,
        })
        if (opError) { toast.error(opError); setSaving(false); return }
        if (form.data_hora_entrega) {
          await createAgendamento({
            cliente_id: clienteId,
            oportunidade_id: opId,
            data_hora: form.data_hora_entrega,
            canal: canalDb,
            tipo: 'entrega',
            status: 'aguardando',
            observacoes: [form.observacao_entrega, form.observacao].filter(Boolean).join(' — ') || null,
          })
        }
      }

      if (tipo === 'garantia') {
        const dataPos = form.data_posicionamento || hoje
        const horaPos = form.hora_posicionamento || '09:00'
        const observacoes = [
          `Motivo: ${form.motivo_garantia}`,
          form.veiculo_texto ? `Veículo: ${form.veiculo_texto}` : null,
          form.descricao_garantia,
          form.responsavel ? `Responsável: ${form.responsavel}` : null,
          form.observacao || null,
        ].filter(Boolean).join(' — ')
        const { error: agError } = await createAgendamento({
          cliente_id: clienteId,
          data_hora: `${dataPos}T${horaPos}`,
          tipo: 'garantia',
          status: 'aguardando',
          observacoes,
        })
        if (agError) { toast.error(agError); setSaving(false); return }
      }

      if (tipo === 'qualificado') {
        const etapa = form.passo_atual ? PASSO_TO_ETAPA[form.passo_atual] : 'prospeccao'
        const observacoes = [
          form.observacao || null,
          form.urgencia ? `Urgência: ${form.urgencia}` : null,
          form.modalidade && form.modalidade !== 'Não informado' ? `Modalidade preferida: ${form.modalidade}` : null,
          form.possui_troca === 'Sim' ? `Troca: ${form.veiculo_troca || '—'}${form.valor_esperado_troca ? ` (${form.valor_esperado_troca})` : ''}` : null,
        ].filter(Boolean).join(' — ')
        const { error: opError } = await createOportunidade({
          cliente_id: clienteId,
          veiculo_interesse: form.veiculo_texto,
          valor_negociado: currencyToNumber(form.orcamento || ''),
          etapa,
          canal: canalDb,
          financiamento: financiamentoDb,
          carro_avaliado: form.possui_troca === 'Sim',
          created_at: createdAtOverride,
        })
        if (opError) { toast.error(opError); setSaving(false); return }
        if (observacoes) await updateCliente(clienteId, { observacoes })
      }

      toast.success(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} salvo com sucesso.`)
      onSaved?.()
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  const TITULO: Record<RegistroTipo, string> = { agendamento: 'Novo Agendamento', venda: 'Nova Venda', garantia: 'Nova Garantia', qualificado: 'Novo Qualificado' }
  const ok = tipo ? canSaveForm(tipo, form, !!clienteEncontradoId) : false
  const formProps: FormProps = { form, setF, clienteEncontrado: !!clienteEncontradoId, clienteJaVendido, onPhoneBlur: handleWhatsAppBlur }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[3px] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Novo registro">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tipo && (
              <button type="button" onClick={handleVoltar} className="rounded-lg p-1 transition-colors hover:bg-slate-100" aria-label="Voltar">
                <ArrowLeft className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <Typography variant="h3" className="text-[17px] text-[#0F172A]">{tipo ? TITULO[tipo] : 'Novo Registro'}</Typography>
          </div>
          <button type="button" onClick={handleClose} aria-label="Fechar" className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="mb-4 text-[12px] text-slate-400">
          {tipo ? 'Dados salvos na base única de clientes/oportunidades.' : 'Escolha o tipo de registro para o fechamento de hoje.'}
        </p>

        {!tipo && <TipoSelector onSelect={handleSelectTipo} />}
        {tipo === 'agendamento' && <FormAgendamento {...formProps} />}
        {tipo === 'venda' && <FormVenda {...formProps} />}
        {tipo === 'garantia' && <FormGarantia {...formProps} />}
        {tipo === 'qualificado' && <FormQualificado {...formProps} />}

        {buscando && <p className="mt-1 text-[11px] text-slate-400">Buscando cliente…</p>}

        {tipo && (
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={handleClose} disabled={saving} className="rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-[13px] font-semibold text-[#64748B] transition-colors hover:bg-slate-50">
              Cancelar
            </button>
            <Button type="button" onClick={handleSave} disabled={!ok || saving} className="rounded-xl bg-[#6D28D9] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Salvando…' : `Salvar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NovoRegistroModal
