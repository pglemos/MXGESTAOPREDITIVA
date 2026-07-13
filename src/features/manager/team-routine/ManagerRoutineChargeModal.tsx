import { useEffect, useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Modal } from '@/components/organisms/Modal'

const DEFAULT_MESSAGE = 'Você possui pendências na Rotina do Dia. Conclua as ações planejadas e atualize o Plano de Ataque para que a gestão acompanhe corretamente sua execução.'

type ManagerRoutineChargeModalProps = {
  open: boolean
  sellerName: string
  date: string
  onClose: () => void
  onSave: (message: string) => void | Promise<void>
}

export function ManagerRoutineChargeModal({ open, sellerName, date, onClose, onSave }: ManagerRoutineChargeModalProps) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    setMessage(DEFAULT_MESSAGE)
    setSending(false)
    setSent(false)
  }, [open, sellerName, date])

  const handleSend = async () => {
    setSending(true)
    try {
      await onSave(message)
      setSent(true)
      window.setTimeout(onClose, 1400)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      referenceStyle
      title="Cobrar rotina do vendedor"
      description="Uma notificação interna será registrada para o vendedor."
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500" htmlFor="manager-routine-charge-seller">Vendedor</label>
          <div id="manager-routine-charge-seller" className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{sellerName}</div>
        </div>
        <div>
          <label className="text-xs text-gray-500" htmlFor="manager-routine-charge-date">Data</label>
          <div id="manager-routine-charge-date" className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{date}</div>
        </div>
        <div>
          <label className="text-xs text-gray-500" htmlFor="manager-routine-charge-message">Mensagem</label>
          <textarea
            id="manager-routine-charge-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {sent && <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Cobrança registrada.</div>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleSend()} loading={sending} disabled={sent}>Enviar cobrança</Button>
      </div>
    </Modal>
  )
}

export { DEFAULT_MESSAGE }
