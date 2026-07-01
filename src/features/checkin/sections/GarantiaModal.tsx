import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'

interface GarantiaModalProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  /** Data de competência do fechamento — padrão para a data de posicionamento. */
  defaultDate?: string
}

const MOTIVOS_GARANTIA = ['Mecânica', 'Documentação', 'Acessório', 'Acabamento', 'Promessa comercial', 'Outro']

const formatPhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Registro rápido de Garantia — não substitui nem altera o formulário
 * "+ Novo Cliente" (Venda/Agendamento/Qualificado). Busca cliente por
 * telefone (base única) antes de criar; sempre gera um agendamento
 * tipo="garantia", que por sua vez emite o evento comercial
 * garantia_registrada e aparece na Central de Execução.
 */
export function GarantiaModal({ open, onClose, onSaved, defaultDate }: GarantiaModalProps) {
  const { buscarClienteExistentePorTelefone, createCliente } = useClientes()
  const { createAgendamento } = useAgendamentos()

  const [telefone, setTelefone] = useState('')
  const [nome, setNome] = useState('')
  const [veiculo, setVeiculo] = useState('')
  const [motivo, setMotivo] = useState(MOTIVOS_GARANTIA[0])
  const [descricao, setDescricao] = useState('')
  const [dataPosicionamento, setDataPosicionamento] = useState(defaultDate || '')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const reset = () => {
    setTelefone('')
    setNome('')
    setVeiculo('')
    setMotivo(MOTIVOS_GARANTIA[0])
    setDescricao('')
    setDataPosicionamento(defaultDate || '')
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
    if (!dataPosicionamento) {
      toast.error('Informe a data de posicionamento do cliente.')
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
        const { error: clienteError, id } = await createCliente({ nome: nome.trim(), telefone })
        if (clienteError || !id) {
          toast.error(clienteError || 'Não foi possível cadastrar o cliente.')
          setSaving(false)
          return
        }
        clienteId = id
      }

      const observacoes = [
        `Motivo: ${motivo}`,
        veiculo.trim() ? `Veículo: ${veiculo.trim()}` : null,
        descricao.trim() || null,
      ].filter(Boolean).join(' — ')

      const { error: agendamentoError } = await createAgendamento({
        cliente_id: clienteId,
        data_hora: dataPosicionamento,
        tipo: 'garantia',
        status: 'aguardando',
        observacoes,
      })

      if (agendamentoError) {
        toast.error(agendamentoError)
        setSaving(false)
        return
      }

      toast.success('Garantia registrada.')
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
      aria-label="Registrar garantia"
    >
      <div className="relative w-full max-w-[480px] my-8 rounded-[18px] border border-[#DFE0E1] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] flex flex-col overflow-hidden">
        <header className="px-6 pt-6 pb-4 border-b border-[#DFE0E1] relative">
          <h2 className="text-[18px] font-extrabold text-[#071822]">Registrar Garantia</h2>
          <p className="mt-1.5 text-[13px] font-medium text-[#526B7A] leading-relaxed">
            Busca o cliente pelo telefone (não duplica) e cria uma pendência na Central de Execução.
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
          <FormField
            label="Veículo"
            value={veiculo}
            onChange={event => setVeiculo(event.target.value)}
            placeholder="Ex: HB20 1.0 Comfort"
          />
          <div className="space-y-mx-xs">
            <label htmlFor="garantia-motivo" className="block ml-2 text-[11px] font-extrabold uppercase tracking-wider text-[#526B7A]">
              Motivo
            </label>
            <Select id="garantia-motivo" value={motivo} onChange={event => setMotivo(event.target.value)}>
              {MOTIVOS_GARANTIA.map(item => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <FormField
            label="Descrição"
            value={descricao}
            onChange={event => setDescricao(event.target.value)}
            placeholder="Detalhe o problema relatado"
          />
          <FormField
            label="Data de posicionamento do cliente"
            type="datetime-local"
            value={dataPosicionamento}
            onChange={event => setDataPosicionamento(event.target.value)}
            required
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
            {saving ? 'Salvando...' : 'Registrar Garantia'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default GarantiaModal
