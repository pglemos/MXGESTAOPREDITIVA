import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import type { FeedbackFormData } from '@/types/database'
import { AdminFeedbackModal } from './AdminFeedbackModal'
import { StoreFeedbackModal } from './StoreFeedbackModal'

function buildFormData(overrides: Partial<FeedbackFormData> = {}): FeedbackFormData {
  return {
    seller_id: 'seller-1',
    week_reference: '2026-06-15',
    leads_week: 12,
    agd_week: 6,
    visit_week: 3,
    vnd_week: 1,
    tx_lead_agd: 50,
    tx_agd_visita: 50,
    tx_visita_vnd: 33.3,
    meta_compromisso: 4,
    caso_motivo: 'Queda em visita.',
    positives: 'Bom volume de leads.',
    attention_points: 'Pouca confirmacao.',
    action: '',
    ...overrides,
  }
}

function StoreModalHarness() {
  const [formData, setFormData] = useState<FeedbackFormData>(buildFormData())

  return (
    <StoreFeedbackModal
      open
      onClose={mock()}
      saving={false}
      formData={formData}
      setFormData={setFormData}
      sellers={[{ id: 'seller-1', name: 'Ana' }]}
      onSellerSelect={mock()}
      onWeekReferenceChange={mock()}
      onSubmit={mock()}
    />
  )
}

function AdminModalHarness() {
  const [formData, setFormData] = useState<FeedbackFormData>(buildFormData())

  return (
    <AdminFeedbackModal
      open
      onClose={mock()}
      saving={false}
      formData={formData}
      setFormData={setFormData}
      selectedStoreId="store-1"
      setSelectedStoreId={mock()}
      filteredSellers={[{
        id: 'seller-1',
        name: 'Ana',
        store_id: 'store-1',
        store_name: 'Loja Centro',
      }]}
      lojas={[{ id: 'store-1', name: 'Loja Centro' }]}
      previousWeekLabel="15/06 a 21/06"
      onSellerSelect={mock()}
      onWeekReferenceChange={mock()}
      onSubmit={mock()}
    />
  )
}

afterEach(() => {
  cleanup()
})

describe('feedback action catalog modals', () => {
  test('store manager can select a standardized action and keep it editable', () => {
    render(<StoreModalHarness />)

    fireEvent.change(screen.getByLabelText('Ação padronizada'), {
      target: { value: 'confirmacao_visita' },
    })

    const action = screen.getByLabelText(/^Ação$/i) as HTMLTextAreaElement
    expect(action.value).toContain('Ana')
    expect(action.value).toContain('2026-06-15')
    expect(action.value).toContain('08:30')
    expect(action.value).toContain('confirmar')

    fireEvent.change(action, { target: { value: `${action.value} Ajuste manual.` } })
    expect(action.value).toContain('Ajuste manual.')
  })

  test('admin manager can apply the same action catalog in the feedback modal', () => {
    render(<AdminModalHarness />)

    fireEvent.change(screen.getByLabelText('Ação padronizada'), {
      target: { value: 'retomar_clientes_parados' },
    })

    const action = screen.getByLabelText(/próximo passo/i) as HTMLTextAreaElement
    expect(action.value).toContain('Ana')
    expect(action.value).toContain('2026-06-15')
    expect(action.value).toContain('11:00')
    expect(action.value).toContain('retomar clientes parados')
  })
})
