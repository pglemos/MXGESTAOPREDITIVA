import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { useOwnerContext } from './OwnerContext'

const requestTypes = [
  { value: 'duvida', label: 'Tirar uma dúvida' },
  { value: 'analise', label: 'Solicitar análise' },
  { value: 'decisao', label: 'Discutir uma decisão' },
  { value: 'revisao_acao', label: 'Revisar uma ação' },
  { value: 'agendamento', label: 'Agendar encontro' },
  { value: 'informacao', label: 'Enviar informação' },
  { value: 'urgente', label: 'Situação urgente' },
]

const priorities = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export default function OwnerConsultantModal() {
  const { profile } = useAuth()
  const { consultantModalOpen, closeConsultantModal, selectedStore, selectedStoreId } = useOwnerContext()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [requestType, setRequestType] = useState('duvida')
  const [priority, setPriority] = useState('media')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!consultantModalOpen) return
    setSubject('')
    setMessage('')
    setRequestType('duvida')
    setPriority('media')
    setDone(false)
  }, [consultantModalOpen])

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()
    if (!selectedStoreId || !profile?.id) {
      toast.error('Não foi possível identificar a loja e o usuário atuais.')
      return
    }
    if (subject.trim().length < 3 || message.trim().length < 3) {
      toast.error('Preencha assunto e mensagem com informações suficientes.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('solicitacoes_consultoria').insert({
      store_id: selectedStoreId,
      created_by: profile.id,
      request_type: requestType,
      subject: subject.trim(),
      message: message.trim(),
      priority,
      context_type: 'general',
      context_snapshot: { loja: selectedStore?.name || 'Loja atual' },
      status: 'aberta',
    })
    setSubmitting(false)

    if (error) {
      toast.error('Não foi possível enviar a solicitação. Revise os dados e tente novamente.')
      return
    }

    setDone(true)
    toast.success('Solicitação enviada e registrada na Consultoria.')
  }, [message, priority, profile?.id, requestType, selectedStore?.name, selectedStoreId, subject])

  return (
    <Dialog open={consultantModalOpen} onOpenChange={(open) => !open && closeConsultantModal()}>
      <DialogContent className="owner-base44-exact__consultant-modal sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Falar com Consultor</DialogTitle>
          <DialogDescription>
            Envie uma solicitação ao consultor responsável pela sua unidade.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="owner-base44-exact__consultant-success">
            <CheckCircle2 size={40} aria-hidden="true" />
            <strong>Solicitação enviada</strong>
            <p>O consultor receberá sua mensagem e retornará pelo canal registrado.</p>
          </div>
        ) : (
          <form className="owner-base44-exact__consultant-form" onSubmit={handleSubmit}>
            <label>
              <span>Assunto</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} />
            </label>
            <label>
              <span>Tipo</span>
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                {requestTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Prioridade</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                {priorities.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Mensagem</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} required minLength={3} />
            </label>
            <DialogFooter>
              <button type="button" className="owner-base44-exact__consultant-secondary" onClick={closeConsultantModal}>
                Cancelar
              </button>
              <button type="submit" className="owner-base44-exact__consultant-primary" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar solicitação'}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
