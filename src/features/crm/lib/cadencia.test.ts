import { describe, expect, it } from 'bun:test'
import {
  CADENCIA_FLUXOS_PADRAO,
  fluxoDoCanal,
  montarDataHoraAcaoCadencia,
  resolverProximoCicloCadencia,
  resolverPrimeiraAcaoCadencia,
  sugerirHorarioAcaoCadencia,
} from './cadencia'

describe('cadencia configuravel', () => {
  it('resolve a primeira acao da cadencia de internet com prazo imediato', () => {
    const acao = resolverPrimeiraAcaoCadencia('internet', new Date('2026-06-16T12:00:00-03:00'))

    expect(acao.fluxo.canal).toBe('internet')
    expect(acao.fluxo.versao).toBe(1)
    expect(acao.passo.key).toBe('internet_mensagem_1')
    expect(acao.proximaAcao).toBe('Enviar mensagem 1 de primeiro contato')
    expect(acao.proximaAcaoEm).toBe('2026-06-16')
  })

  it('usa fluxo porta para showroom e canais ausentes', () => {
    expect(fluxoDoCanal('showroom')).toBe('porta')
    expect(fluxoDoCanal(null)).toBe('porta')
    expect(resolverPrimeiraAcaoCadencia('showroom').fluxo.canal).toBe('porta')
  })

  it('mantem fluxos versionados com transicoes apontando para passos existentes', () => {
    for (const fluxo of Object.values(CADENCIA_FLUXOS_PADRAO)) {
      const keys = new Set(fluxo.passos.map(passo => passo.key))

      expect(fluxo.versao).toBeGreaterThan(0)
      expect(fluxo.passos.length).toBeGreaterThan(0)

      for (const passo of fluxo.passos) {
        expect(passo.proximaAcao.length).toBeGreaterThan(0)
        expect(passo.prazoDias).toBeGreaterThanOrEqual(0)
        expect(passo.limiteTentativas).toBeGreaterThan(0)
        for (const next of [passo.aoFazer, passo.aoNaoFazer, passo.aoAguardar]) {
          if (next) expect(keys.has(next)).toBe(true)
        }
      }
    }
  })

  it('reagenda tentativa sem sucesso para o proximo dia antes do limite', () => {
    const ciclo = resolverProximoCicloCadencia({
      fluxo: CADENCIA_FLUXOS_PADRAO.internet,
      passoAtualKey: 'internet_qualificacao',
      resultado: 'nao_feito',
      tentativasPasso: 1,
      baseDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(ciclo.passo.key).toBe('internet_qualificacao')
    expect(ciclo.proximaAcao).toBe('Confirmar veículo, forma de pagamento e carro na troca')
    expect(ciclo.proximaAcaoEm).toBe('2026-06-17')
    expect(ciclo.status).toBe('ativo')
    expect(ciclo.tentativasPasso).toBe(2)
    expect(ciclo.tentativaRegistrada).toBe(2)
    expect(ciclo.limiteTentativas).toBe(3)
    expect(ciclo.reagendamentoAutomatico).toBe(true)
    expect(ciclo.limiteEstourado).toBe(false)
  })

  it('segue fallback configurado quando tentativa sem sucesso atinge o limite', () => {
    const ciclo = resolverProximoCicloCadencia({
      fluxo: CADENCIA_FLUXOS_PADRAO.internet,
      passoAtualKey: 'internet_qualificacao',
      resultado: 'nao_feito',
      tentativasPasso: 2,
      baseDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(ciclo.passo.key).toBe('internet_mensagem_2')
    expect(ciclo.proximaAcaoEm).toBe('2026-06-17')
    expect(ciclo.status).toBe('ativo')
    expect(ciclo.tentativasPasso).toBe(0)
    expect(ciclo.tentativaRegistrada).toBe(3)
    expect(ciclo.reagendamentoAutomatico).toBe(false)
    expect(ciclo.limiteEstourado).toBe(true)
  })

  it('encerra em terminal quando estoura limite sem fallback', () => {
    const ciclo = resolverProximoCicloCadencia({
      fluxo: CADENCIA_FLUXOS_PADRAO.internet,
      passoAtualKey: 'internet_retorno_7d',
      resultado: 'aguardando',
      tentativasPasso: 0,
      baseDate: new Date('2026-06-16T12:00:00-03:00'),
    })

    expect(ciclo.passo.key).toBe('internet_retorno_7d')
    expect(ciclo.proximaAcao).toBe('Cadencia encerrada por limite de tentativas')
    expect(ciclo.proximaAcaoEm).toBe('2026-06-17')
    expect(ciclo.status).toBe('cancelado')
    expect(ciclo.limiteEstourado).toBe(true)
  })

  it('sugere horarios rastreaveis para a agenda da Central', () => {
    expect(sugerirHorarioAcaoCadencia('Enviar mensagem 1 de primeiro contato', 'internet')).toBe('08:55')
    expect(sugerirHorarioAcaoCadencia('Ligar para cliente da carteira', 'carteira')).toBe('11:00')
    expect(sugerirHorarioAcaoCadencia('Confirmar visita antes do compromisso', 'internet')).toBe('13:00')
    expect(sugerirHorarioAcaoCadencia('Apresentar proposta de negociação', 'porta')).toBe('16:00')
    expect(sugerirHorarioAcaoCadencia('Retorno combinado às 14:30', 'internet')).toBe('14:30')
    expect(montarDataHoraAcaoCadencia('2026-06-17', 'Enviar mensagem 2', 'internet')).toBe('2026-06-17T08:55:00')
  })
})
