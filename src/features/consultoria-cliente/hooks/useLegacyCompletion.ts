import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import {
  getRecommendedLegacyVisitSelection,
  LEGACY_PMR_VISITS,
  validateLegacyVisitCompletionInput,
} from '@/lib/consultoria/legacy-visit-completion'
import type { ConsultingClientDetail } from '@/features/consultoria/types'

type CompleteLegacyArgs = {
  visitNumbers: number[]
  summary: string
  effectiveVisitDate: string
}

type Params = {
  client: ConsultingClientDetail | null
  completeLegacyVisits: (args: CompleteLegacyArgs) => Promise<{ error?: string | null }>
}

export function useLegacyCompletion({ client, completeLegacyVisits }: Params) {
  const [showLegacyCompletionModal, setShowLegacyCompletionModal] = useState(false)
  const [legacyCompletionSubmitting, setLegacyCompletionSubmitting] = useState(false)
  const [legacyVisitNumbers, setLegacyVisitNumbers] = useState<number[]>([...LEGACY_PMR_VISITS])
  const [legacySummary, setLegacySummary] = useState('')
  const [legacyEffectiveDate, setLegacyEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const openLegacyCompletionModal = () => {
    if (!client) return
    setLegacyVisitNumbers(getRecommendedLegacyVisitSelection(client.visits || []))
    setLegacySummary(client.legacy_migration_summary || '')
    setLegacyEffectiveDate(format(new Date(), 'yyyy-MM-dd'))
    setShowLegacyCompletionModal(true)
  }

  const toggleLegacyVisit = (visitNumber: number) => {
    setLegacyVisitNumbers((current) => {
      if (current.includes(visitNumber)) return current.filter((item) => item !== visitNumber)
      return [...current, visitNumber].sort((a, b) => a - b)
    })
  }

  const handleSubmitLegacyCompletion = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateLegacyVisitCompletionInput({
      visitNumbers: legacyVisitNumbers,
      summary: legacySummary,
      effectiveVisitDate: legacyEffectiveDate,
    })
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLegacyCompletionSubmitting(true)
    const { error: completionError } = await completeLegacyVisits({
      visitNumbers: legacyVisitNumbers,
      summary: legacySummary,
      effectiveVisitDate: legacyEffectiveDate,
    })
    setLegacyCompletionSubmitting(false)

    if (completionError) {
      toast.error(completionError)
      return
    }

    toast.success('Visitas legadas concluídas.')
    setShowLegacyCompletionModal(false)
  }

  return {
    showLegacyCompletionModal,
    setShowLegacyCompletionModal,
    legacyCompletionSubmitting,
    legacyVisitNumbers,
    setLegacyVisitNumbers,
    legacySummary,
    setLegacySummary,
    legacyEffectiveDate,
    setLegacyEffectiveDate,
    openLegacyCompletionModal,
    toggleLegacyVisit,
    handleSubmitLegacyCompletion,
  }
}
