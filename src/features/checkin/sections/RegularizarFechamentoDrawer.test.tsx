import React from 'react'
import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegularizarFechamentoDrawer } from './RegularizarFechamentoDrawer'

afterEach(cleanup)

describe('RegularizarFechamentoDrawer', () => {
  it('permite enviar os dados preenchidos para aprovação do gerente antes da aplicação', () => {
    render(
      <MemoryRouter>
        <RegularizarFechamentoDrawer
        date="2026-07-09"
        finalized={false}
        formValues={{
          leads_cart: 1,
          leads_net: 0,
          visitas_porta: 2,
          visitas_cart: 0,
          visitas_net: 0,
          agd_cart: 1,
          agd_net: 0,
          vnd_porta: 0,
          vnd_cart: 0,
          vnd_net: 0,
          reason: 'Inclusão de dado',
        }}
        onFieldChange={() => {}}
        onReasonChange={() => {}}
        saving={false}
        onVoltar={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/nenhum lançamento será aplicado antes da aprovação/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Solicitar aprovação do gerente/i })).toBeEnabled()
    expect(screen.getAllByRole('button', { name: '+' })[0]).toBeEnabled()
  })

  // MX-22.3 (AC-5; Spec §1.3/§8.4/FEV-DATA-10): "Observações Operacionais
  // (Justificativa)" foi removida em cc338e13 — este é o teste de regressão
  // que faltava no ARQUIVO CERTO (renderiza de verdade, não só checa a
  // string-fonte). Motivo do catálogo (ADJUSTMENT_REASONS) é o único campo
  // obrigatório; o campo distinto e legítimo "checkin-note" pertence ao
  // formulário principal (CheckinForm.tsx) e não existe neste drawer.
  it('não renderiza o campo Observações Operacionais (Justificativa) removido (§8.4)', () => {
    render(
      <MemoryRouter>
        <RegularizarFechamentoDrawer
        date="2026-07-09"
        finalized={false}
        formValues={{
          leads_cart: 1,
          leads_net: 0,
          visitas_porta: 2,
          visitas_cart: 0,
          visitas_net: 0,
          agd_cart: 1,
          agd_net: 0,
          vnd_porta: 0,
          vnd_cart: 0,
          vnd_net: 0,
          reason: 'Inclusão de dado',
        }}
        onFieldChange={() => {}}
        onReasonChange={() => {}}
        saving={false}
        onVoltar={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/Observações Operacionais \(Justificativa\)/i)).toBeNull()
    expect(screen.queryByLabelText(/Justificativa/i)).toBeNull()
    expect(screen.queryByText(/checkin-note/i)).toBeNull()
  })
})
