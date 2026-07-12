import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Modal } from '@/components/organisms/Modal'
import type { CheckinWithTotals } from '@/types/database'
import {
  LEAD_FIELDS,
  buildLeadCorrectionPayload,
  buildLeadCorrectionReason,
  computeLeadDiff,
  getLeadOriginals,
  validateLeadCorrection,
  type LeadFieldKey,
} from './corrigir-leads'

export interface CorrigirLeadsModalProps {
  open: boolean
  onClose: () => void
  sellerName: string
  checkin: CheckinWithTotals | null
  onSubmit: (payload: ReturnType<typeof buildLeadCorrectionPayload>, reason: string) => Promise<{ error: string | null }>
}

/**
 * Correção controlada de leads pelo gerente (§13.2 Corrigir Leads).
 * Exibe valor anterior, novo e diferença; exige motivo; toda a aplicação
 * acontece server-side pelas RPCs canônicas de regularização (auditadas).
 */
export function CorrigirLeadsModal({ open, onClose, sellerName, checkin, onSubmit }: CorrigirLeadsModalProps) {
  const originals = useMemo(() => checkin ? getLeadOriginals(checkin) : { leads_prev_day: 0, leads_net_prev_day: 0 }, [checkin])
  const [values, setValues] = useState<Record<LeadFieldKey, number>>(originals)
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(originals)
      setMotivo('')
      setObservacao('')
      setError(null)
    }
  }, [open, originals])

  const diffs = useMemo(() => computeLeadDiff(originals, values), [originals, values])

  const submit = async () => {
    const validation = validateLeadCorrection(originals, { ...values, motivo, observacao })
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError(null)
    const result = await onSubmit(buildLeadCorrectionPayload(values), buildLeadCorrectionReason({ motivo, observacao }))
    setSaving(false)
    if (result.error) setError(result.error)
    else onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Corrigir leads — ${sellerName}`} description="Somente leads por canal podem ser alterados. Vendas, atendimentos, agendamentos, qualificados e garantia permanecem intocados."
      footer={<div className="flex justify-end gap-mx-sm"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={saving || !checkin} onClick={() => void submit()}>{saving ? 'Aplicando…' : 'Aplicar correção auditada'}</Button></div>}>
      {!checkin ? (
        <Typography variant="p" tone="muted">Este vendedor ainda não enviou o fechamento do dia — não há leads para corrigir.</Typography>
      ) : (
        <div className="space-y-mx-md">
          <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
            {LEAD_FIELDS.map(field => (
              <div key={field.key}>
                <label className="mb-mx-2xs block text-mx-tiny font-black uppercase tracking-wider text-text-tertiary" htmlFor={`corrigir-${field.key}`}>{field.label}</label>
                <Input id={`corrigir-${field.key}`} type="number" min={0} step={1} value={values[field.key]} onChange={event => setValues(prev => ({ ...prev, [field.key]: Number(event.target.value) }))} />
                <Typography variant="tiny" tone="muted" className="mt-mx-2xs">Valor anterior: {originals[field.key]}</Typography>
              </div>
            ))}
          </div>
          {diffs.length > 0 && (
            <div className="rounded-mx-md border border-border-subtle bg-surface-alt p-mx-md" role="status">
              {diffs.map(diff => (
                <Typography key={diff.key} variant="tiny">{diff.label}: {diff.anterior} → {diff.novo} (diferença {diff.diferenca > 0 ? `+${diff.diferenca}` : diff.diferenca})</Typography>
              ))}
            </div>
          )}
          <div>
            <label className="mb-mx-2xs block text-mx-tiny font-black uppercase tracking-wider text-text-tertiary" htmlFor="corrigir-motivo">Motivo (obrigatório)</label>
            <Input id="corrigir-motivo" value={motivo} onChange={event => setMotivo(event.target.value)} placeholder="Ex.: lead contado em duplicidade no canal internet" />
          </div>
          <div>
            <label className="mb-mx-2xs block text-mx-tiny font-black uppercase tracking-wider text-text-tertiary" htmlFor="corrigir-observacao">Observação (opcional)</label>
            <Textarea id="corrigir-observacao" rows={2} value={observacao} onChange={event => setObservacao(event.target.value)} placeholder="Contexto adicional para a auditoria" />
          </div>
          <Typography variant="tiny" tone="muted">A correção registra gerente, data/hora, valores anteriores e novos no log de auditoria do fechamento.</Typography>
          {error && <Typography variant="p" tone="error" role="alert">{error}</Typography>}
        </div>
      )}
    </Modal>
  )
}
