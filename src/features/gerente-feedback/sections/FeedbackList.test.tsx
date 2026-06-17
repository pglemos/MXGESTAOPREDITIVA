import React from 'react'
import { describe, expect, it, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { FeedbackList } from './FeedbackList'
import type { FeedbackListItem } from '../lib/helpers'

const feedback: FeedbackListItem = {
  id: '11111111-1111-4111-8111-111111111111',
  store_id: 'store-1',
  manager_id: 'manager-1',
  seller_id: 'seller-1',
  seller_name: 'Ana Vendedora',
  week_reference: '2026-06-15',
  leads_week: 10,
  agd_week: 6,
  visit_week: 4,
  vnd_week: 2,
  tx_lead_agd: 60,
  tx_agd_visita: 66,
  tx_visita_vnd: 50,
  meta_compromisso: 3,
  team_avg_json: {},
  diagnostic_json: {},
  commitment_suggested: 3,
  positives: 'Bom atendimento.',
  attention_points: 'Melhorar qualificação.',
  action: 'Agendar três retornos por dia.',
  caso_motivo: 'Cliente X perdeu negociação por falta de argumentação.',
  notes: null,
  acknowledged: false,
  acknowledged_at: null,
  seller_comment: null,
  seller_comment_at: null,
  created_at: '2026-06-16T12:00:00.000Z',
}

describe('FeedbackList', () => {
  it('mostra caso ou motivo no card de historico', () => {
    render(<FeedbackList feedbacks={[feedback]} onShareWhatsApp={mock()} variant="store" />)

    expect(screen.getByText(/caso\/motivo/i)).toBeInTheDocument()
    expect(screen.getByText(/Cliente X perdeu negociação/i)).toBeInTheDocument()
  })
})
