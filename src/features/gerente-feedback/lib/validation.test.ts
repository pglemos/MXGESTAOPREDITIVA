import { describe, expect, it } from 'bun:test'
import { validarFeedbackObrigatorio } from './validation'

const validForm = {
  seller_id: 'seller-1',
  caso_motivo: 'Cliente perdeu a negociação por falta de argumentação no financiamento.',
  positives: 'Boa velocidade de resposta.',
  attention_points: 'Precisa melhorar perguntas de qualificação.',
  action: 'Agendar tres retornos qualificados por dia.',
}

describe('validarFeedbackObrigatorio', () => {
  it('bloqueia feedback sem caso ou motivo', () => {
    expect(validarFeedbackObrigatorio({ ...validForm, caso_motivo: '  ' })).toEqual({
      ok: false,
      message: 'Informe o caso ou motivo da devolutiva.',
    })
  })

  it('mantem validacoes obrigatorias ja existentes', () => {
    expect(validarFeedbackObrigatorio({ ...validForm, seller_id: '' })).toEqual({
      ok: false,
      message: 'Selecione o especialista.',
    })
    expect(validarFeedbackObrigatorio({ ...validForm, action: '' })).toEqual({
      ok: false,
      message: 'Preencha a ação combinada.',
    })
  })

  it('aprova feedback completo', () => {
    expect(validarFeedbackObrigatorio(validForm)).toEqual({ ok: true })
  })

  it('aceita feedback positivo sem pontos de atenção', () => {
    expect(validarFeedbackObrigatorio({ ...validForm, attention_points: '', feedback_type: 'positive' })).toEqual({ ok: true })
  })

  it('aceita feedback de desenvolvimento sem pontos fortes', () => {
    expect(validarFeedbackObrigatorio({ ...validForm, positives: '', feedback_type: 'development' })).toEqual({ ok: true })
  })
})
