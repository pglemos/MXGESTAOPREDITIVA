import type { FeedbackActionRow } from '@/features/gerente-feedback/lib/feedback-actions'
import type { CheckinScope } from '@/types/database'

const MIN_JUSTIFICATION_LENGTH = 8

type ResolveFeedbackActionCloseLockInput = {
  actions: FeedbackActionRow[]
  note: string
  metricScope: CheckinScope
}

type ResolveFeedbackActionCloseLockResult = {
  blocked: boolean
  message: string | null
  actionIdsToJustify: string[]
}

export function resolveFeedbackActionCloseLock({
  actions,
  note,
  metricScope,
}: ResolveFeedbackActionCloseLockInput): ResolveFeedbackActionCloseLockResult {
  if (metricScope !== 'daily') {
    return { blocked: false, message: null, actionIdsToJustify: [] }
  }

  const mandatoryPendingActions = actions.filter(
    action => action.status === 'pendente' && action.obrigatoria_fechamento,
  )

  if (mandatoryPendingActions.length === 0) {
    return { blocked: false, message: null, actionIdsToJustify: [] }
  }

  const actionIdsToJustify = mandatoryPendingActions.map(action => action.id)
  if (note.trim().length < MIN_JUSTIFICATION_LENGTH) {
    return {
      blocked: true,
      message: 'Existe ação obrigatória de feedback pendente. Conclua na Central ou descreva o motivo de não cumprimento nas observações.',
      actionIdsToJustify,
    }
  }

  return { blocked: false, message: null, actionIdsToJustify }
}
