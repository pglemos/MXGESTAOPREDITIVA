import { MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { SmallPanel, MiniBar } from './DashboardPrimitives'

export type FeedbackCardData = {
  positives?: string | null
  action?: string | null
  acknowledged?: boolean | null
  seller_comment?: string | null
  created_at?: string | null
  manager?: { name?: string | null } | null
  manager_name?: string | null
}

export function FeedbackPanel({ feedback }: { feedback: FeedbackCardData | null }) {
  const managerName = feedback?.manager?.name || feedback?.manager_name || 'Gestor'
  const feedbackDate = feedback?.created_at ? new Date(feedback.created_at).toLocaleDateString('pt-BR') : null

  return (
    <SmallPanel title="Último feedback" action="Ver todos" to="/devolutivas">
      {feedback ? (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-md">
          <Typography variant="p" className="font-semibold text-text-primary">
            “{feedback.positives || feedback.action || 'Continue evoluindo na rotina.'}”
          </Typography>
          <div className="mt-mx-md border-t border-border-subtle pt-mx-sm">
            <Typography variant="caption" className="block font-semibold normal-case tracking-normal text-text-secondary">
              Ação vinculada: {feedback.action || 'Definir próximo passo comercial'}
            </Typography>
            <MiniBar value={feedback.acknowledged ? 100 : 35} className="mt-mx-xs" />
            <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
              {feedback.acknowledged ? '1 de 1 concluído' : 'ação em andamento'}
            </Typography>
          </div>
          <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
            {managerName}
            {feedbackDate ? ` · ${feedbackDate}` : ''}
          </Typography>
          <div className="mt-mx-md flex gap-mx-sm">
            <Link to="/devolutivas" className="inline-flex h-9 flex-1 items-center justify-center rounded-mx-md bg-brand-primary px-mx-sm text-xs font-semibold text-white">
              Li e compreendi
            </Link>
            <Link to="/devolutivas" className="inline-flex h-9 flex-1 items-center justify-center rounded-mx-md border border-border-subtle px-mx-sm text-xs font-semibold text-text-secondary">
              Responder
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-md">
          <div className="flex items-start gap-mx-xs text-text-tertiary">
            <MessageSquare size={16} />
            <div>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
                Nenhum feedback recebido ainda.
              </Typography>
              <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
                Quando sua liderança registrar um feedback, ele aparecerá aqui com ação vinculada, prazo, status e confirmação de leitura.
              </Typography>
            </div>
          </div>
        </div>
      )}
    </SmallPanel>
  )
}
