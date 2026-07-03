/**
 * Biblioteca de scripts de abordagem — chaveada pelos textos reais de
 * `proxima_acao` já produzidos por resolverPrimeiraAcaoCadencia /
 * resolverProximoCicloCadencia (src/features/crm/lib/cadencia.ts). Não é
 * geração por IA (o "Script IA" do Base44 também é template estático,
 * não LLM) — é templating simples com {nome}/{veiculo}.
 */
const SCRIPT_TEMPLATES: Record<string, string> = {
  'Enviar mensagem 1 de primeiro contato':
    'Oi, {nome}! Tudo bem?\n\nVi seu interesse no {veiculo} e quero te ajudar com as informações certas.\n\nVocê está buscando esse modelo para comprar agora ou ainda pesquisando opções?',
  'Enviar mensagem 2 com opção de veículo e convite para conversa':
    'Oi, {nome}! Passando para saber se ainda faz sentido eu te ajudar com o {veiculo}.\n\nPosso te mostrar as opções e condições disponíveis — tem um tempinho agora?',
  'Confirmar veículo, forma de pagamento e carro na troca':
    'Legal, {nome}! Para eu te passar a proposta certa: você já definiu o {veiculo} ou ainda está comparando? E pretende dar algum carro na troca ou financiar?',
  'Enviar mensagem 3 com pergunta objetiva para destravar resposta':
    'Oi, {nome}! Só para eu não perder seu contato: ainda faz sentido eu te ajudar com o {veiculo}? Se não for o momento, sem problema — me avisa.',
  'Retomar contato em 7 dias':
    'Oi, {nome}! Tudo bem? Passando para saber se a ideia de fechar o {veiculo} ainda está nos seus planos.',
  'Agendar visita ou chamada com compromisso definido':
    '{nome}, para você decidir com mais segurança, que tal ver o {veiculo} pessoalmente ou por vídeo? Tenho horário hoje ou amanhã — qual fica melhor?',
  'Confirmar presença antes da visita':
    'Oi, {nome}! Tudo bem? Confirmando sua visita para ver o {veiculo}. Posso manter o horário combinado?',
  'Apresentar proposta e combinar próximo compromisso':
    'Oi, {nome}! Preparei as condições para o {veiculo}. Posso te enviar agora e já combinamos o próximo passo?',
  'Ligar para cliente da carteira e propor próximo compromisso':
    'Oi, {nome}! Tudo bem? Estou passando para saber se ainda faz sentido conversarmos sobre o {veiculo} e já deixar um próximo passo combinado.',
  'Enviar mensagem de follow-up com oferta ou novidade relevante':
    'Oi, {nome}! Tenho uma novidade sobre o {veiculo} que pode te interessar. Posso te contar?',
  'Retornar ao cliente da carteira em 7 dias':
    'Oi, {nome}! Tudo bem? Retomando contato para saber se o interesse no {veiculo} ainda segue de pé.',
  'Confirmar visita ou test drive com horário definido':
    'Oi, {nome}! Confirmando seu test drive/visita para o {veiculo}. Posso manter o horário combinado?',
  'Apresentar proposta e próximo passo da negociação':
    'Oi, {nome}! Vamos avançar com a proposta do {veiculo}? Posso te enviar as condições agora.',
  'Enviar mensagem de pós-atendimento e salvar interesse do cliente':
    'Oi, {nome}! Foi um prazer te atender. Fico à disposição para qualquer dúvida sobre o {veiculo}.',
  'Retornar em até 24h com opções e convite para negociação':
    'Oi, {nome}! Trouxe novas opções para o {veiculo}. Posso te apresentar?',
  'Apresentar proposta e combinar decisão com data definida':
    'Oi, {nome}! Vamos fechar os detalhes do {veiculo}? Posso te enviar a proposta e combinarmos um prazo para decisão?',
}

const DEFAULT_TEMPLATE =
  'Oi, {nome}! Tudo bem? Passando para dar continuidade ao seu atendimento sobre o {veiculo}.'

export function obterScriptSugerido(
  proximaAcao: string | null | undefined,
  nome: string,
  veiculo: string | null | undefined,
): string {
  const template = (proximaAcao && SCRIPT_TEMPLATES[proximaAcao]) || DEFAULT_TEMPLATE
  return template
    .replace(/{nome}/g, nome || 'tudo bem')
    .replace(/{veiculo}/g, veiculo || 'veículo de interesse')
}

/**
 * Tons do script — mesma lista do Base44 (ScriptIA.jsx), mas aplicados por
 * transformação determinística de texto, não por chamada de LLM (NFR-IA1:
 * MX não usa LLM em produção — decisão mantida na sessão de 2026-07-03,
 * ver docs/auditorias/auditoria-comparativa-base44-vs-mx-2026-07-03.md).
 */
export type ScriptTom = 'consultivo' | 'direto' | 'leve' | 'reativacao' | 'audio'

export const TONS: { id: ScriptTom; label: string; desc: string }[] = [
  { id: 'consultivo', label: 'Consultivo', desc: 'Perguntativo, orientado a entender a necessidade' },
  { id: 'direto', label: 'Direto', desc: 'Objetivo, claro, sem rodeios' },
  { id: 'leve', label: 'Leve', desc: 'Descontraído, próximo, não pressiona' },
  { id: 'reativacao', label: 'Reativação', desc: 'Para clientes frios ou sem resposta' },
  { id: 'audio', label: 'Áudio curto', desc: 'Breve, natural, como uma mensagem de voz' },
]

function primeiraFrase(texto: string): string {
  const match = texto.replace(/\n+/g, ' ').match(/^[^.!?]+[.!?]/)
  return (match ? match[0] : texto).trim()
}

export function aplicarTom(scriptBase: string, tom: ScriptTom, nome: string, veiculo: string | null | undefined): string {
  const v = veiculo || 'veículo de interesse'
  switch (tom) {
    case 'direto':
      return `${primeiraFrase(scriptBase)} Podemos avançar com o ${v}?`
    case 'leve':
      return `Oi, ${nome}! 😊 Passando rapidinho por aqui sobre o ${v} — sem pressa nenhuma, só quando fizer sentido pra você. Me chama quando puder!`
    case 'reativacao':
      return `Oi, ${nome}! Faz um tempo que a gente não se fala. Ainda faz sentido eu te ajudar com o ${v}? Se não for mais o momento, sem problema — só me avisa.`
    case 'audio':
      return `Oi ${nome}, tudo bem? Aqui é rapidinho: queria saber se ainda faz sentido pra você a gente seguir conversando sobre o ${v}. Fico no aguardo, viu? Um abraço.`
    case 'consultivo':
    default:
      return scriptBase
  }
}
