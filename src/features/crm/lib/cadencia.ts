import type { Cliente } from '@/lib/schemas/crm.schema'
import type { OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import type { AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'

/**
 * Cadência comercial por canal (spec Módulo Vendedor §7).
 *
 * O CONTEÚDO de cada etapa (objetivo, o que fazer, script) é orientação de
 * processo configurada aqui. O PROGRESSO do cliente na cadência é derivado
 * exclusivamente de dados reais: oportunidades (etapa do funil) e
 * agendamentos (status de comparecimento).
 */

export type ScriptContext = { cliente: string; vendedor: string }

export type EtapaCadencia = {
  id: string
  label: string
  objetivo: string
  oQueFazer: string[]
  script: (ctx: ScriptContext) => string
}

const ETAPAS: Record<string, EtapaCadencia> = {
  lead: {
    id: 'lead',
    label: 'Lead',
    objetivo: 'Responder rápido e iniciar a conversa com o cliente.',
    oQueFazer: [
      'Responder o lead o quanto antes (idealmente em minutos).',
      'Se apresentar e agradecer o interesse.',
      'Entender qual veículo o cliente procura.',
    ],
    script: ({ cliente, vendedor }) =>
      `Olá ${cliente}, tudo bem? Aqui é o ${vendedor}. Vi seu interesse e quero te ajudar a encontrar a melhor opção. Qual veículo você está procurando?`,
  },
  contato: {
    id: 'contato',
    label: 'Contato',
    objetivo: 'Gerar conexão, qualificar a necessidade e preparar o agendamento.',
    oQueFazer: [
      'Confirmar o veículo de interesse e a forma de pagamento.',
      'Perguntar se há veículo na troca.',
      'Despertar o interesse pela visita.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, aqui é o ${vendedor}. Para eu te atender bem: você pretende financiar ou pagar à vista? Tem algum veículo para colocar na troca?`,
  },
  agendamento: {
    id: 'agendamento',
    label: 'Agendamento',
    objetivo: 'Garantir o agendamento da visita e gerar compromisso.',
    oQueFazer: [
      'Confirmar interesse e disponibilidade.',
      'Definir data, horário e local da visita.',
      'Entender se há veículo na troca.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, tudo bem? Aqui é o ${vendedor}. Estou confirmando nossa visita para conhecermos as opções que combinam com o que você procura. Podemos manter para [data] às [horário]?`,
  },
  visita: {
    id: 'visita',
    label: 'Visita',
    objetivo: 'Realizar um atendimento presencial impecável e avançar para a proposta.',
    oQueFazer: [
      'Confirmar a visita no dia, pela manhã.',
      'Preparar o veículo e as opções antes do cliente chegar.',
      'Conduzir test drive e apresentar o valor do veículo.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, bom dia! Aqui é o ${vendedor}. Está confirmada nossa visita de hoje? Já deixei tudo preparado para você conhecer o veículo.`,
  },
  negociacao: {
    id: 'negociacao',
    label: 'Negociação',
    objetivo: 'Apresentar proposta, tratar objeções e conduzir ao fechamento.',
    oQueFazer: [
      'Apresentar proposta clara (valor, troca, financiamento).',
      'Tratar objeções com alternativas, não com desconto.',
      'Combinar próximo passo com data definida.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, aqui é o ${vendedor}. Consegui condições especiais na proposta que montamos. Posso te apresentar hoje para fecharmos os detalhes?`,
  },
  venda: {
    id: 'venda',
    label: 'Venda',
    objetivo: 'Concluir a venda e encaminhar um pós-venda que gera indicação.',
    oQueFazer: [
      'Confirmar documentação e prazos de entrega.',
      'Combinar a entrega como um momento especial.',
      'Pedir indicação e manter contato no pós-venda.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, parabéns pela conquista! Aqui é o ${vendedor}. Sua entrega está confirmada. Qualquer coisa que precisar, estou à disposição — e se conhecer alguém procurando carro, pode contar comigo.`,
  },
  atendimento: {
    id: 'atendimento',
    label: 'Atendimento',
    objetivo: 'Atender com qualidade e capturar o contato do cliente.',
    oQueFazer: [
      'Fazer um atendimento consultivo, sem pressa.',
      'Registrar nome e telefone do cliente.',
      'Combinar o próximo contato antes de o cliente sair.',
    ],
    script: ({ cliente, vendedor }) =>
      `${cliente}, foi um prazer te atender! Aqui é o ${vendedor}. Vou te mandar as opções que conversamos. Posso te ligar amanhã para continuarmos?`,
  },
}

export type FluxoCanal = 'internet' | 'carteira' | 'porta'

export const FLUXOS: Record<FluxoCanal, EtapaCadencia[]> = {
  internet: [ETAPAS.lead, ETAPAS.contato, ETAPAS.agendamento, ETAPAS.visita, ETAPAS.negociacao, ETAPAS.venda],
  carteira: [ETAPAS.agendamento, ETAPAS.visita, ETAPAS.negociacao, ETAPAS.venda],
  porta: [ETAPAS.atendimento, ETAPAS.negociacao, ETAPAS.venda],
}

/** Canal CRM → fluxo de cadência (showroom segue o fluxo de porta/atendimento). */
export function fluxoDoCanal(canal: string | null | undefined): FluxoCanal {
  if (canal === 'internet') return 'internet'
  if (canal === 'carteira') return 'carteira'
  return 'porta'
}

export type ProgressoCadencia = {
  fluxo: FluxoCanal
  etapas: EtapaCadencia[]
  concluidas: number
  etapaAtual: EtapaCadencia
  etapaAtualIndex: number
  cadencia: number
  encerramento: 'ganho' | 'perdido' | null
}

const ETAPA_FUNIL_ORDEM: Record<string, number> = {
  prospeccao: 0,
  qualificacao: 1,
  apresentacao: 2,
  negociacao: 3,
  fechamento: 4,
  ganho: 5,
  perdido: -1,
}

/** Deriva o progresso real do cliente na cadência do seu canal de origem. */
export function derivarProgresso(
  cliente: Pick<Cliente, 'id' | 'canal_origem' | 'ultima_interacao'>,
  oportunidades: OportunidadeComCliente[],
  agendamentos: AgendamentoComCliente[],
): ProgressoCadencia {
  const fluxo = fluxoDoCanal(cliente.canal_origem)
  const etapas = FLUXOS[fluxo]

  const opps = oportunidades.filter(o => o.cliente_id === cliente.id)
  const agds = agendamentos.filter(a => a.cliente_id === cliente.id)

  const maxFunil = opps.reduce((acc, o) => Math.max(acc, ETAPA_FUNIL_ORDEM[o.etapa] ?? 0), opps.length > 0 ? 0 : -Infinity)
  const temGanho = opps.some(o => o.etapa === 'ganho')
  const soPerdido = opps.length > 0 && opps.every(o => o.etapa === 'perdido')

  const atingiu: Record<string, boolean> = {
    lead: true,
    atendimento: true,
    contato: Boolean(cliente.ultima_interacao) || maxFunil >= 1 || agds.length > 0,
    agendamento: agds.length > 0,
    visita: agds.some(a => a.status === 'compareceu') || maxFunil >= 3,
    negociacao: maxFunil >= 3,
    venda: temGanho,
  }

  // Cadência é sequencial: conta etapas concluídas até a primeira pendente.
  let concluidas = 0
  for (const etapa of etapas) {
    if (atingiu[etapa.id]) concluidas += 1
    else break
  }

  const etapaAtualIndex = Math.min(concluidas, etapas.length - 1)
  return {
    fluxo,
    etapas,
    concluidas,
    etapaAtual: etapas[etapaAtualIndex],
    etapaAtualIndex,
    cadencia: Math.round((concluidas / etapas.length) * 100),
    encerramento: temGanho ? 'ganho' : soPerdido ? 'perdido' : null,
  }
}

/**
 * Persistência Comercial (spec): % de clientes que percorreram toda a
 * cadência, medida sobre os clientes com negociação encerrada (ganho ou
 * perdido). Sem encerrados, não há base de cálculo (retorna null).
 */
export function calcularPersistencia(progressos: ProgressoCadencia[]): number | null {
  const encerrados = progressos.filter(p => p.encerramento !== null)
  if (encerrados.length === 0) return null
  const completos = encerrados.filter(p => p.encerramento === 'ganho').length
  return Math.round((completos / encerrados.length) * 100)
}
