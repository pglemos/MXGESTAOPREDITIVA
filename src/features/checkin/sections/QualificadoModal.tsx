import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import {
  CRM_CANAIS,
  CRM_CANAL_LABEL,
  CRM_FINANCIAMENTO,
  CRM_FINANCIAMENTO_LABEL,
  type CrmCanal,
  type CrmFinanciamento,
} from '@/lib/schemas/crm.schema'

interface QualificadoModalProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

const formatPhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Registro rápido de cliente Qualificado — não substitui o formulário
 * "+ Novo Cliente" (Venda/Agendamento). Busca cliente por telefone (base
 * única) antes de criar; sempre gera uma oportunidade etapa="qualificacao",
 * que emite cliente_qualificado (+ oportunidade_registrada se canal=internet)
 * e faz o cliente entrar na Carteira.
 */
export function QualificadoModal({ open, onClose, onSaved }: QualificadoModalProps) {
  const { buscarClienteExistentePorTelefone, createCliente } = useClientes()
  const { createOportunidade } = useOportunidades()

  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [canal, setCanal] = useState<CrmCanal>('internet')
  const [veiculo, setVeiculo] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [financiamento, setFinanciamento] = useState<CrmFinanciamento>('nao_aplica')
  const [possuiTroca, setPossuiTroca] = useState<'nao' | 'sim'>('nao')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const reset = () => {
    setTelefone('')
    setNome('')
    setCanal('internet')
    setVeiculo('')
    setOrcamento('')
    setFinanciamento('nao_aplica')
    setPossuiTroca('nao')
    setObservacao('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSalvar = async () => {
    if (!telefone.trim()) {
      toast.error('Informe o telefone do cliente.')
      return
    }
    if (!veiculo.trim()) {
      toast.error('Informe o veículo de interesse.')
      return
    }

    setSaving(true)
    try {
      let clienteId = typeof buscarClienteExistentePorTelefone === 'function'
        ? await buscarClienteExistentePorTelefone(telefone)
        : null

      if (!clienteId) {
        if (!nome.trim()) {
          toast.error('Cliente não encontrado pelo telefone — informe o nome para cadastrar.')
          setSaving(false)
          return
        }
        const { error: clienteError, id } = await createCliente({
          nome: nome.trim(),
          telefone,
          canal_origem: canal,
          status: 'oportunidade',
          observacoes: observacao.trim() || null,
        })
        if (clienteError || !id) {
          toast.error(clienteError || 'Não foi possível cadastrar o cliente.')
          setSaving(false)
          return
        }
        clienteId = id
      }

      const { error: oportunidadeError } = await createOportunidade({
        cliente_id: clienteId,
        veiculo_interesse: veiculo.trim(),
        valor_negociado: Number(orcamento.replace(/\D/g, '')) || 0,
        etapa: 'qualificacao',
        canal,
        financiamento,
        carro_avaliado: possuiTroca === 'sim',
      })

      if (oportunidadeError) {
        toast.error(oportunidadeError)
        setSaving(false)
        return
      }

      toast.success('Cliente qualificado registrado.')
      reset()
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[3px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Registrar cliente qualificado"
    >
      <div className="relative w-full max-w-[480px] my-8 rounded-[18px] border border-[#DFE0E1] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] flex flex-col overflow-hidden">
        <header className="px-6 pt-6 pb-4 border-b border-[#DFE0E1] relative">
          <h2 className="text-[18px] font-extrabold text-[#071822]">Registrar Qualificado</h2>
          <p className="mt-1.5 text-[13px] font-medium text-[#526B7A] leading-relaxed">
            Busca o cliente pelo telefone (não duplica) e envia direto para a Carteira.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-lg text-[#526B7A] hover:bg-[#F7F8F8] transition-all"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <FormField
            label="Telefone"
            value={telefone}
            onChange={event => setTelefone(formatPhoneInput(event.target.value))}
            placeholder="(11) 98765-4321"
            required
          />
          <FormField
            label="Nome do cliente (se ainda não cadastrado)"
            value={nome}
            onChange={event => setNome(event.target.value)}
            placeholder="Ex: João Santos"
          />
          <div className="space-y-mx-xs">
            <label htmlFor="qualificado-canal" className="block ml-2 text-[11px] font-extrabold uppercase tracking-wider text-[#526B7A]">
              Canal
            </label>
            <Select id="qualificado-canal" value={canal} onChange={event => setCanal(event.target.value as CrmCanal)}>
              {CRM_CANAIS.map(item => <option key={item} value={item}>{CRM_CANAL_LABEL[item]}</option>)}
            </Select>
          </div>
          <FormField
            label="Veículo de interesse"
            value={veiculo}
            onChange={event => setVeiculo(event.target.value)}
            placeholder="Ex: HB20 1.0 Comfort"
            required
          />
          <FormField
            label="Orçamento"
            value={orcamento}
            onChange={event => setOrcamento(event.target.value)}
            placeholder="Ex: 80000"
          />
          <div className="space-y-mx-xs">
            <label htmlFor="qualificado-financiamento" className="block ml-2 text-[11px] font-extrabold uppercase tracking-wider text-[#526B7A]">
              Financiamento
            </label>
            <Select id="qualificado-financiamento" value={financiamento} onChange={event => setFinanciamento(event.target.value as CrmFinanciamento)}>
              {CRM_FINANCIAMENTO.map(item => <option key={item} value={item}>{CRM_FINANCIAMENTO_LABEL[item]}</option>)}
            </Select>
          </div>
          <div className="space-y-mx-xs">
            <label htmlFor="qualificado-troca" className="block ml-2 text-[11px] font-extrabold uppercase tracking-wider text-[#526B7A]">
              Possui troca?
            </label>
            <Select id="qualificado-troca" value={possuiTroca} onChange={event => setPossuiTroca(event.target.value as 'nao' | 'sim')}>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </Select>
          </div>
          <FormField
            label="Observação"
            value={observacao}
            onChange={event => setObservacao(event.target.value)}
            placeholder="Detalhes da qualificação"
          />
        </div>

        <footer className="px-6 py-4 border-t border-[#DFE0E1] flex justify-center gap-3 bg-[#F7F8F8]">
          <button
            type="button"
            onClick={handleClose}
            className="h-[42px] px-6 rounded-full border border-[#DFE0E1] bg-white text-sm font-bold text-[#526B7A] hover:bg-[#F7F8F8] transition-colors"
          >
            Cancelar
          </button>
          <Button type="button" onClick={handleSalvar} disabled={saving} className="h-[42px] px-6 rounded-full">
            {saving ? 'Salvando...' : 'Registrar Qualificado'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default QualificadoModal
