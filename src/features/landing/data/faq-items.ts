// FAQ items extraídos do MXPerformanceLanding monolítico (Story 2.1).
// Mantém ordem e textos verbatim para preservar baseline visual.

export type FaqItem = {
  ix: string
  question: string
  answer: string
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    ix: '01',
    question: 'Quanto tempo leva para a equipe entrar na rotina?',
    answer:
      'A primeira semana já estabiliza o lançamento diário. Em 30 dias, ranking, devolutivas e diagnóstico do funil estão funcionando como ritual. A consultoria acompanha esse onboarding presencialmente ou online.',
  },
  {
    ix: '02',
    question: 'Funciona para uma loja ou só para rede?',
    answer:
      'Funciona em ambos. Você pode operar uma única unidade com Painel da Loja, ou consolidar várias no Painel Geral da Rede, com filtros, comparativos e ordenação por gap, projeção e disciplina.',
  },
  {
    ix: '03',
    question: 'Os vendedores precisam saber tecnologia?',
    answer:
      'Não. O Terminal MX é desenhado para o lançamento ser feito em segundos, com janela operacional clara (até 09:30 lançar, até 09:45 editar). Quem usa WhatsApp, usa o Terminal.',
  },
  {
    ix: '04',
    question: 'E os dados que já temos hoje?',
    answer:
      'O sistema possui módulo de reprocessamento e importação. Você sobe a base bruta, acompanha logs, corrige sem perder histórico e mantém auditoria completa.',
  },
  {
    ix: '05',
    question: 'A consultoria é obrigatória?',
    answer:
      'Não. Você pode usar só a plataforma. Mas a camada de consultoria — visitas PMR, DRE, plano de ação e ROI — é o que conecta método à rotina, e por isso tira o resultado do platô.',
  },
  {
    ix: '06',
    question: 'Como a privacidade dos dados é tratada?',
    answer:
      'Cada papel acessa apenas o que faz sentido para sua função. Há auditoria, logs, controle de vigência e governança de clientes na camada interna da MX. Política completa em /privacidade.',
  },
] as const
