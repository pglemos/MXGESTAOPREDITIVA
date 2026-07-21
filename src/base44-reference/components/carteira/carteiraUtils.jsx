import moment from "moment";

// ─── SITUAÇÕES ATUAIS ────────────────────────────────────────────────────────
export const SITUACOES_ATUAIS = [
  "Lead sem resposta",
  "Primeiro contato pendente",
  "Em cadência sem resposta",
  "Cliente respondeu",
  "Necessidade em qualificação",
  "Veículo definido",
  "Cliente quente sem visita",
  "Visita agendada",
  "Visita a confirmar",
  "Visita hoje",
  "Não compareceu",
  "Visita realizada",
  "Proposta enviada",
  "Proposta sem retorno",
  "Financiamento em análise",
  "Financiamento aprovado sem compra",
  "Em negociação ativa",
  "Vai pensar",
  "Aguardando resposta do cliente",
  "Aguardando ação do vendedor",
  "Venda realizada",
  "Venda perdida",
  "Pós-venda ativo",
  "Garantia em acompanhamento",
  "Oportunidade futura",
  "Cadência encerrada",
];

// Mantido para compatibilidade com código legado
export const MOMENTOS = SITUACOES_ATUAIS;

// ─── CANAIS ──────────────────────────────────────────────────────────────────
export const CANAIS_COMERCIAIS = ["Porta", "Internet", "Carteira"];

export const ORIGENS_DETALHADAS = [
  "Lead da loja (site/redes sociais)",
  "Lead campanha empresa",
  "Google Ads empresa",
  "Instagram loja",
  "Marketplace empresa",
  "Atendimento presencial",
  "Indicação",
  "Cliente antigo",
  "Pós-venda",
  "Garantia",
  "Prospecção própria",
  "Publicação própria",
  "Redes sociais próprias",
  "OLX próprio",
  "Tráfego pago próprio",
  "Marketplace próprio",
  "Feirão",
  "Outros",
];

// ─── STATUS COMERCIAL ─────────────────────────────────────────────────────────
export const STATUS_COMERCIAIS = [
  "Novo",
  "Em negociação",
  "Agendado",
  "Vendido",
  "Perdido",
  "Pós-venda",
  "Garantia",
  "Futuro",
];

// ─── TEMPERATURAS ─────────────────────────────────────────────────────────────
export const TEMPERATURAS = ["Frio", "Morno", "Quente"];

// ─── OBJETIVOS COMERCIAIS ────────────────────────────────────────────────────
export const OBJETIVOS = [
  "Iniciar conversa",
  "Qualificar necessidade",
  "Definir veículo",
  "Entender prazo e barreiras",
  "Gerar visita",
  "Confirmar visita",
  "Reagendar visita",
  "Registrar atendimento",
  "Construir proposta",
  "Retomar proposta",
  "Acompanhar financiamento",
  "Converter aprovação",
  "Fechar negociação",
  "Registrar perda",
  "Recuperar oportunidade",
  "Reativar relacionamento",
  "Pedir indicação",
  "Acompanhar garantia",
  "Criar recompra/troca futura",
];

// ─── PRÓXIMOS PASSOS ──────────────────────────────────────────────────────────
export const PROXIMOS_PASSOS = [
  "Enviar primeira abordagem",
  "Enviar segunda abordagem",
  "Fazer pergunta consultiva",
  "Definir veículo de interesse",
  "Convidar para visita",
  "Confirmar visita amanhã",
  "Confirmar visita hoje",
  "Reagendar visita",
  "Enviar resumo do atendimento",
  "Enviar proposta",
  "Retomar proposta",
  "Acompanhar financiamento",
  "Converter financiamento aprovado",
  "Fazer follow-up de decisão",
  "Registrar motivo de perda",
  "Reativar cliente antigo",
  "Pedir indicação",
  "Acompanhar garantia",
  "Programar troca futura",
];

// ─── RESULTADOS PADRONIZADOS ─────────────────────────────────────────────────
export const RESULTADOS = [
  "Cliente não respondeu",
  "Cliente respondeu",
  "Informou veículo",
  "Pediu proposta",
  "Agendou visita",
  "Reagendou visita",
  "Não compareceu",
  "Compareceu",
  "Vai pensar",
  "Pediu financiamento",
  "Financiamento aprovado",
  "Comprou",
  "Sem interesse",
  "Comprou em outra loja",
  "Número inválido",
  "Cliente pediu contato futuro",
];

// ─── MAPEAMENTO RESULTADO → NOVA SITUAÇÃO ────────────────────────────────────
export function resultadoParaSituacao(resultado) {
  const map = {
    "Cliente não respondeu": { situacao: "Aguardando resposta do cliente", temperatura: null, objetivo: "Iniciar conversa", proximoPasso: "Enviar segunda abordagem" },
    "Cliente respondeu": { situacao: "Necessidade em qualificação", temperatura: "Morno", objetivo: "Qualificar necessidade", proximoPasso: "Fazer pergunta consultiva" },
    "Informou veículo": { situacao: "Veículo definido", temperatura: "Morno", objetivo: "Gerar visita", proximoPasso: "Convidar para visita" },
    "Pediu proposta": { situacao: "Proposta enviada", temperatura: "Quente", objetivo: "Retomar proposta", proximoPasso: "Retomar proposta" },
    "Agendou visita": { situacao: "Visita agendada", temperatura: "Quente", objetivo: "Confirmar visita", proximoPasso: "Confirmar visita amanhã" },
    "Reagendou visita": { situacao: "Visita agendada", temperatura: "Quente", objetivo: "Confirmar visita", proximoPasso: "Confirmar visita amanhã" },
    "Não compareceu": { situacao: "Não compareceu", temperatura: "Morno", objetivo: "Reagendar visita", proximoPasso: "Reagendar visita" },
    "Compareceu": { situacao: "Visita realizada", temperatura: "Quente", objetivo: "Construir proposta", proximoPasso: "Enviar proposta" },
    "Vai pensar": { situacao: "Vai pensar", temperatura: "Morno", objetivo: "Fechar negociação", proximoPasso: "Fazer follow-up de decisão" },
    "Pediu financiamento": { situacao: "Financiamento em análise", temperatura: "Quente", objetivo: "Acompanhar financiamento", proximoPasso: "Acompanhar financiamento" },
    "Financiamento aprovado": { situacao: "Financiamento aprovado sem compra", temperatura: "Quente", objetivo: "Converter aprovação", proximoPasso: "Converter financiamento aprovado" },
    "Comprou": { situacao: "Venda realizada", temperatura: "Quente", objetivo: "Pedir indicação", proximoPasso: "Pedir indicação", statusComercial: "Vendido" },
    "Sem interesse": { situacao: "Venda perdida", temperatura: "Frio", objetivo: "Registrar perda", proximoPasso: "Registrar motivo de perda", statusComercial: "Perdido" },
    "Comprou em outra loja": { situacao: "Venda perdida", temperatura: "Frio", objetivo: "Registrar perda", proximoPasso: "Registrar motivo de perda", statusComercial: "Perdido" },
    "Número inválido": { situacao: "Cadência encerrada", temperatura: "Frio", objetivo: "Registrar perda", proximoPasso: "Registrar motivo de perda" },
    "Cliente pediu contato futuro": { situacao: "Oportunidade futura", temperatura: "Frio", objetivo: "Criar recompra/troca futura", proximoPasso: "Programar troca futura", statusComercial: "Futuro" },
  };
  return map[resultado] || { situacao: null, temperatura: null, objetivo: null, proximoPasso: null };
}

// Compatibilidade legada
export function resultadoParaMomento(resultado) {
  const r = resultadoParaSituacao(resultado);
  return { momento: r.situacao, temperatura: r.temperatura };
}

// ─── LÓGICA AUTOMÁTICA: SITUAÇÃO → OBJETIVO + PRÓXIMO PASSO ─────────────────
export function calcularObjetivoEProximoPasso(cliente) {
  // Proteção contra nulos
  if (!cliente) {
    return { objetivo: "Iniciar conversa", proximoPasso: "Enviar primeira abordagem" };
  }

  const s = cliente.situacao_atual || cliente.momento || "";
  const canal = cliente.canal_comercial || cliente.canal_origem || "";
  const visita = cliente.visita_agendada_em || cliente.proxima_acao_data;

  if (s === "Lead sem resposta" || s === "Primeiro contato pendente" || s === "Novo contato")
    return { objetivo: "Iniciar conversa", proximoPasso: "Enviar primeira abordagem" };
  if (s === "Em cadência sem resposta")
    return { objetivo: "Iniciar conversa", proximoPasso: "Enviar segunda abordagem" };
  if (s === "Cliente respondeu" || s === "Aguardando ação do vendedor")
    return { objetivo: "Qualificar necessidade", proximoPasso: "Fazer pergunta consultiva" };
  if (s === "Necessidade em qualificação")
    return { objetivo: "Qualificar necessidade", proximoPasso: "Fazer pergunta consultiva" };
  if (s === "Veículo definido")
    return { objetivo: "Gerar visita", proximoPasso: "Convidar para visita" };
  if (s === "Cliente quente sem visita")
    return { objetivo: "Gerar visita", proximoPasso: "Convidar para visita" };
  if (s === "Visita agendada" && visita) {
    const diff = moment(visita).diff(moment(), "days");
    if (diff <= 0) return { objetivo: "Confirmar visita", proximoPasso: "Confirmar visita hoje" };
    if (diff === 1) return { objetivo: "Confirmar visita", proximoPasso: "Confirmar visita hoje" };
    if (diff === 2) return { objetivo: "Confirmar visita", proximoPasso: "Confirmar visita amanhã" };
    return { objetivo: "Confirmar visita", proximoPasso: "Visita agendada" };
  }
  if (s === "Visita a confirmar")
    return { objetivo: "Confirmar visita", proximoPasso: "Confirmar visita amanhã" };
  if (s === "Visita hoje")
    return { objetivo: "Registrar atendimento", proximoPasso: "Confirmar visita hoje" };
  if (s === "Não compareceu")
    return { objetivo: "Reagendar visita", proximoPasso: "Reagendar visita" };
  if (s === "Visita realizada")
    return { objetivo: "Construir proposta", proximoPasso: "Enviar proposta" };
  if (s === "Proposta enviada" || s === "Proposta sem retorno")
    return { objetivo: "Retomar proposta", proximoPasso: "Retomar proposta" };
  if (s === "Financiamento em análise")
    return { objetivo: "Acompanhar financiamento", proximoPasso: "Acompanhar financiamento" };
  if (s === "Financiamento aprovado sem compra")
    return { objetivo: "Converter aprovação", proximoPasso: "Converter financiamento aprovado" };
  if (s === "Em negociação ativa")
    return { objetivo: "Fechar negociação", proximoPasso: "Fazer follow-up de decisão" };
  if (s === "Vai pensar")
    return { objetivo: "Fechar negociação", proximoPasso: "Fazer follow-up de decisão" };
  if (s === "Aguardando resposta do cliente")
    return { objetivo: "Iniciar conversa", proximoPasso: "Enviar segunda abordagem" };
  if (s === "Venda realizada")
    return { objetivo: "Pedir indicação", proximoPasso: "Pedir indicação" };
  if (s === "Pós-venda ativo")
    return { objetivo: "Reativar relacionamento", proximoPasso: "Pedir indicação" };
  if (s === "Garantia em acompanhamento")
    return { objetivo: "Acompanhar garantia", proximoPasso: "Acompanhar garantia" };
  if (s === "Oportunidade futura")
    return { objetivo: "Criar recompra/troca futura", proximoPasso: "Programar troca futura" };
  if (s === "Venda perdida" || s === "Cadência encerrada")
    return { objetivo: "Recuperar oportunidade", proximoPasso: "Reativar cliente antigo" };
  if (canal === "Carteira")
    return { objetivo: "Reativar relacionamento", proximoPasso: "Reativar cliente antigo" };
  return { objetivo: "Iniciar conversa", proximoPasso: "Enviar primeira abordagem" };
}

// Compatibilidade legada
export function calcularProximaAcao(cliente) {
  const { proximoPasso } = calcularObjetivoEProximoPasso(cliente);
  return proximoPasso;
}

// ─── EXPLICAÇÃO "POR QUE ESTÁ AQUI" ─────────────────────────────────────────
export function explicacaoCliente(cliente) {
  // Proteção contra nulos
  if (!cliente) {
    return "Este cliente precisa de atenção e desenvolvimento comercial.";
  }

  const s = cliente.situacao_atual || cliente.momento || "";
  const dias = cliente.ultimo_contato
    ? moment().diff(moment(cliente.ultimo_contato), "days")
    : null;
  const diasStr = dias !== null ? ` há ${dias} dia${dias !== 1 ? "s" : ""}` : "";

  if (s === "Cliente respondeu" || s === "Aguardando ação do vendedor")
    return "Este cliente respondeu sua mensagem e aguarda sua ação agora.";
  if (s === "Visita a confirmar" || s === "Visita hoje")
    return `Este cliente tem visita marcada e precisa de confirmação${diasStr}.`;
  if (s === "Proposta sem retorno" || s === "Proposta enviada")
    return `Este cliente recebeu uma proposta e não respondeu${diasStr}.`;
  if (s === "Cliente quente sem visita")
    return "Este cliente está quente mas ainda não tem visita agendada.";
  if (s === "Financiamento aprovado sem compra")
    return "Este cliente tem financiamento aprovado e ainda não comprou.";
  if (s === "Não compareceu")
    return "Este cliente agendou visita mas não compareceu. Precisa de reagendamento.";
  if (s === "Visita realizada")
    return "Este cliente visitou a loja e ainda não fechou negócio.";
  if (s === "Em negociação ativa" || s === "Vai pensar")
    return "Este cliente está em negociação ativa e aguarda follow-up.";
  if (s === "Financiamento em análise")
    return "Este cliente tem financiamento em análise e precisa de acompanhamento.";
  if (s === "Oportunidade futura")
    return "Este cliente pediu contato futuro. Mantenha o relacionamento.";
  if (s === "Pós-venda ativo")
    return "Este cliente comprou e está em pós-venda ativo. Cuide do relacionamento.";
  if (s === "Garantia em acompanhamento")
    return "Este cliente está com garantia em andamento. Acompanhe de perto.";
  if (diasStr && cliente.temperatura === "Quente")
    return `Este cliente está quente e sem contato${diasStr}. Risco de perda.`;
  return "Este cliente precisa de atenção e desenvolvimento comercial.";
}

// ─── SCORE DO CLIENTE ────────────────────────────────────────────────────────
export function calcularScore(cliente) {
  // Proteção contra nulos
  if (!cliente) {
    return { score: 100, motivos: [] };
  }

  let score = 100;
  const motivos = [];
  const s = cliente.situacao_atual || cliente.momento || "";
  const agora = moment();

  // Sem próximo passo definido - corrigido para usar proxima_acao_data
  const temProximoPasso = !!(cliente.proxima_acao_data || cliente.situacao_atual);
  if (!temProximoPasso) { score -= 20; motivos.push("Sem próxima ação definida."); }

  // Próxima ação vencida
  const proximaData = cliente.proxima_acao_data;
  if (proximaData && moment(proximaData).isBefore(agora, "day")) {
    score -= 25; motivos.push("Próxima ação vencida.");
  }

  // Cliente respondeu e vendedor não tratou
  if (s === "Aguardando ação do vendedor" || s === "Cliente respondeu") {
    const diasSemAcao = cliente.ultimo_contato
      ? agora.diff(moment(cliente.ultimo_contato), "days") : 0;
    if (diasSemAcao >= 1) { score -= 30; motivos.push(`Cliente respondeu há ${diasSemAcao} dia(s) sem retorno.`); }
  }

  // Cliente quente parado há 5+ dias
  if (cliente.temperatura === "Quente" && cliente.ultimo_contato) {
    const diasParado = agora.diff(moment(cliente.ultimo_contato), "days");
    if (diasParado >= 5) { score -= 20; motivos.push(`Cliente quente sem contato há ${diasParado} dias.`); }
  }

  // Proposta sem retorno e sem ação
  if ((s === "Proposta enviada" || s === "Proposta sem retorno") && cliente.ultimo_contato) {
    const diasSemAcao = agora.diff(moment(cliente.ultimo_contato), "days");
    if (diasSemAcao >= 3) { score -= 20; motivos.push(`Proposta enviada há ${diasSemAcao} dias sem retorno.`); }
  }

  // Histórico desatualizado (sem contato há 7+ dias)
  if (cliente.ultimo_contato) {
    const diasSemContato = agora.diff(moment(cliente.ultimo_contato), "days");
    if (diasSemContato >= 7) { score -= 10; motivos.push(`Sem contato há ${diasSemContato} dias.`); }
  } else {
    score -= 10; motivos.push("Histórico sem registro de contato.");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, motivos };
}

export function classificacaoScore(score) {
  if (score >= 90) return { label: "Excelente", color: "text-green-600 bg-green-50" };
  if (score >= 75) return { label: "Boa", color: "text-blue-600 bg-blue-50" };
  if (score >= 50) return { label: "Atenção", color: "text-amber-600 bg-amber-50" };
  return { label: "Crítica", color: "text-red-600 bg-red-50" };
}

// ─── PRIORIDADE COMERCIAL ────────────────────────────────────────────────────
export function calcularPrioridade(cliente) {
  // Proteção contra nulos
  if (!cliente) {
    return "Baixa";
  }

  const s = cliente.situacao_atual || cliente.momento || "";
  const { score } = calcularScore(cliente);

  let potencial = "Baixo";
  if (["Visita hoje", "Financiamento aprovado sem compra"].includes(s)) potencial = "Muito alto";
  else if (["Proposta enviada", "Proposta sem retorno", "Em negociação ativa", "Cliente quente sem visita", "Visita agendada", "Visita a confirmar"].includes(s)) potencial = "Alto";
  else if (["Cliente respondeu", "Visita realizada", "Vai pensar", "Financiamento em análise", "Aguardando ação do vendedor"].includes(s)) potencial = "Médio";

  if (potencial === "Muito alto") return score < 50 ? "Máxima" : "Alta";
  if (potencial === "Alto") return score < 75 ? "Alta" : "Média";
  if (potencial === "Médio") return score >= 75 ? "Baixa" : "Média";
  return "Baixa";
}

// ─── CORES ───────────────────────────────────────────────────────────────────
export function tempColor(t) {
  if (t === "Quente") return "bg-red-50 text-red-600 border-red-100";
  if (t === "Morno") return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

export function prioridadeColor(p) {
  if (p === "Máxima") return "bg-red-100 text-red-700";
  if (p === "Alta") return "bg-red-50 text-red-600";
  if (p === "Média") return "bg-amber-50 text-amber-600";
  return "bg-slate-100 text-slate-500";
}

export function statusComercialColor(s) {
  if (s === "Vendido") return "bg-green-50 text-green-600";
  if (s === "Perdido") return "bg-red-50 text-red-500";
  if (s === "Agendado") return "bg-blue-50 text-blue-600";
  if (s === "Em negociação") return "bg-purple-50 text-purple-600";
  if (s === "Futuro") return "bg-slate-100 text-slate-500";
  return "bg-slate-50 text-slate-500";
}

// ─── SCRIPTS BIBLIOTECA ───────────────────────────────────────────────────────
export const SCRIPTS_BIBLIOTECA = {
  "Enviar primeira abordagem": {
    id: "S01",
    titulo: "Primeira abordagem",
    objetivo: "Iniciar conversa",
    texto: `Oi, {nome}! Tudo bem?\n\nVi seu interesse no {veiculo} e quero te ajudar com as informações certas.\n\nVocê está buscando esse modelo para comprar agora ou ainda está pesquisando opções?`,
  },
  "Enviar segunda abordagem": {
    id: "S02",
    titulo: "Segunda abordagem sem resposta",
    objetivo: "Obter resposta",
    texto: `Oi, {nome}! Passando só para confirmar se ainda faz sentido eu te enviar informações sobre o {veiculo}.\n\nSe não for o melhor momento, sem problema. Posso deixar anotado para te chamar depois.`,
  },
  "Fazer pergunta consultiva": {
    id: "S03",
    titulo: "Qualificação consultiva",
    objetivo: "Entender necessidade",
    texto: `Legal, {nome}.\n\nPara eu te orientar melhor: você procura esse veículo para uso próprio, trabalho ou família?\n\nVocê pensa em comprar agora ou está se planejando para mais adiante?`,
  },
  "Definir veículo de interesse": {
    id: "S04",
    titulo: "Definir veículo",
    objetivo: "Identificar melhor opção",
    texto: `Entendi, {nome}.\n\nAlém do {veiculo}, você considera algum outro modelo ou quer focar exatamente nessa opção?\n\nAssim eu consigo te mostrar as condições mais alinhadas ao que você procura.`,
  },
  "Convidar para visita": {
    id: "S05",
    titulo: "Convite para visita",
    objetivo: "Transformar interesse em presença na loja",
    texto: `{nome}, para você decidir com mais segurança, o ideal é ver o {veiculo} pessoalmente.\n\nTenho horário hoje às {opcao1} ou amanhã às {opcao2}. Qual fica melhor para você?`,
  },
  "Confirmar visita hoje": {
    id: "S06a",
    titulo: "Confirmar visita (hoje)",
    objetivo: "Garantir comparecimento",
    texto: `Oi, {nome}! Tudo bem?\n\nSua visita para ver o {veiculo} está agendada para hoje às {hora}.\n\nVou deixar tudo organizado para te atender bem. Posso manter esse horário?`,
  },
  "Confirmar visita amanhã": {
    id: "S06b",
    titulo: "Confirmar visita (amanhã)",
    objetivo: "Garantir comparecimento",
    texto: `Oi, {nome}! Tudo bem?\n\nSua visita para ver o {veiculo} está agendada para {data} às {hora}.\n\nVou deixar tudo organizado para te atender bem. Posso manter esse horário?`,
  },
  "Reagendar visita": {
    id: "S07",
    titulo: "Reagendar visita perdida",
    objetivo: "Recuperar não comparecimento",
    texto: `Oi, {nome}! Vi que hoje não conseguimos nos encontrar.\n\nSem problema. Ainda faz sentido você ver o {veiculo}?\n\nTenho novos horários disponíveis e posso reagendar para você.`,
  },
  "Enviar resumo do atendimento": {
    id: "S08",
    titulo: "Pós-atendimento Porta",
    objetivo: "Manter negociação viva após visita",
    texto: `Oi, {nome}! Foi um prazer te atender hoje.\n\nFiquei à disposição para te ajudar com o {veiculo}.\n\nSe quiser, posso te enviar um resumo das condições e próximos passos para facilitar sua decisão.`,
  },
  "Retomar proposta": {
    id: "S09",
    titulo: "Proposta enviada",
    objetivo: "Recuperar decisão",
    texto: `Oi, {nome}! Tudo bem?\n\nConseguiu avaliar a proposta do {veiculo}?\n\nSe fizer sentido, posso revisar as condições com você e ver se existe algum ponto que ainda está travando sua decisão.`,
  },
  "Converter financiamento aprovado": {
    id: "S10",
    titulo: "Financiamento aprovado",
    objetivo: "Converter aprovação em venda",
    texto: `Boa notícia, {nome}.\n\nCom a aprovação do financiamento, já conseguimos avançar para a melhor condição possível no {veiculo}.\n\nQuer que eu te mostre o próximo passo para garantirmos essa oportunidade?`,
  },
  "Fazer follow-up de decisão": {
    id: "S11",
    titulo: "Cliente vai pensar",
    objetivo: "Descobrir objeção real",
    texto: `Entendo, {nome}.\n\nSó para eu te ajudar melhor: o que ficou pesando mais na sua decisão?\n\nValor, entrada, parcela, troca ou ainda está comparando outras opções?`,
  },
  "Reativar cliente antigo": {
    id: "S12",
    titulo: "Reativar cliente antigo",
    objetivo: "Retomar relacionamento",
    texto: `Oi, {nome}! Tudo bem?\n\nEstou atualizando minha carteira e queria saber se a ideia de comprar ou trocar de veículo ainda está nos seus planos.\n\nSe não for para agora, posso deixar anotado para te chamar no momento certo.`,
  },
  "Pedir indicação": {
    id: "S13",
    titulo: "Pós-venda e indicação",
    objetivo: "Relacionamento e indicação",
    texto: `Oi, {nome}! Tudo bem com o {veiculo}?\n\nPassando para saber se está tudo certo e se você ficou satisfeito com a compra.\n\nSe lembrar de alguém que também esteja procurando carro, pode me indicar. Vou atender com o mesmo cuidado.`,
  },
  "Acompanhar garantia": {
    id: "S14",
    titulo: "Garantia",
    objetivo: "Proteger relacionamento",
    texto: `Oi, {nome}! Tudo bem?\n\nEstou acompanhando a situação do seu veículo e queria saber se houve alguma atualização.\n\nQuero garantir que você seja bem atendido até a resolução.`,
  },
  "Enviar proposta": {
    id: "S09",
    titulo: "Proposta",
    objetivo: "Enviar e recuperar decisão",
    texto: `Oi, {nome}! Tudo bem?\n\nPreparei as melhores condições para o {veiculo}.\n\nPosso te enviar agora para você avaliar?`,
  },
  "Acompanhar financiamento": {
    id: "S10b",
    titulo: "Acompanhar financiamento",
    objetivo: "Manter cliente informado",
    texto: `Oi, {nome}! Tudo bem?\n\nPassando para te atualizar sobre o andamento do financiamento do {veiculo}.\n\nAssim que tiver novidades, te aviso imediatamente.`,
  },
};

export function getScriptParaProximoPasso(proximoPasso) {
  return SCRIPTS_BIBLIOTECA[proximoPasso]?.texto || SCRIPTS_BIBLIOTECA["Enviar primeira abordagem"].texto;
}

// Compatibilidade legada para missões
export function getScriptParaMissao(missaoId) {
  const map = {
    avaliacoes: SCRIPTS_BIBLIOTECA["Convidar para visita"].texto,
    visitou: SCRIPTS_BIBLIOTECA["Enviar resumo do atendimento"].texto,
    confirmar_visita: SCRIPTS_BIBLIOTECA["Confirmar visita hoje"].texto,
    mornos: SCRIPTS_BIBLIOTECA["Fazer pergunta consultiva"].texto,
    frios: SCRIPTS_BIBLIOTECA["Reativar cliente antigo"].texto,
    propostas: SCRIPTS_BIBLIOTECA["Retomar proposta"].texto,
    pos_venda: SCRIPTS_BIBLIOTECA["Pedir indicação"].texto,
    padrao: SCRIPTS_BIBLIOTECA["Enviar primeira abordagem"].texto,
  };
  return map[missaoId] || map.padrao;
}

export function preencherScript(script, cliente) {
  // Proteção contra nulos
  if (!cliente) return script || "";

  const visita = cliente.visita_agendada_em || cliente.proxima_acao_data;
  return script
    .replace(/{nome}/g, cliente.nome || "")
    .replace(/{veiculo}/g, cliente.veiculo_interesse || "veículo")
    .replace(/{data}/g, visita ? moment(visita).format("DD/MM") : "{data}")
    .replace(/{hora}/g, visita ? moment(visita).format("HH:mm") : "{hora}")
    .replace(/{opcao1}/g, "10h")
    .replace(/{opcao2}/g, "14h");
}

// ─── MISSÕES DO PLANO DE ATAQUE ───────────────────────────────────────────────
export const MISSOES = [
  {
    id: "proposta_sem_retorno",
    nome: "Recuperar propostas",
    icone: "📋",
    prioridade: "Alta",
    objetivo: "Retomar proposta e fechar negócio.",
    porqueAgora: "Clientes com proposta sem resposta têm alto potencial e risco crescente de perda.",
    potencial: "2 a 4 vendas",
    scriptId: "Retomar proposta",
    filtro: c => (c.situacao_atual === "Proposta enviada" || c.situacao_atual === "Proposta sem retorno" || c.momento === "Proposta enviada"),
  },
  {
    id: "financiamento_aprovado",
    nome: "Converter aprovações",
    icone: "💳",
    prioridade: "Máxima",
    objetivo: "Converter financiamento aprovado em venda.",
    porqueAgora: "Financiamento aprovado sem compra é a oportunidade mais quente da carteira.",
    potencial: "2 a 4 vendas",
    scriptId: "Converter financiamento aprovado",
    filtro: c => c.situacao_atual === "Financiamento aprovado sem compra" || (c.interesse_financiamento && (c.situacao_atual === "Em negociação ativa" || c.momento === "Em negociação")),
  },
  {
    id: "nao_compareceu",
    nome: "Reagendar visitas",
    icone: "📅",
    prioridade: "Alta",
    objetivo: "Reagendar clientes que não compareceram.",
    porqueAgora: "Cada visita não realizada é uma oportunidade que pode ser recuperada rapidamente.",
    potencial: "2 a 5 vendas",
    scriptId: "Reagendar visita",
    filtro: c => c.situacao_atual === "Não compareceu" || (c.visita_agendada_em && moment(c.visita_agendada_em).isBefore(moment(), "day") && c.situacao_atual !== "Venda realizada"),
  },
  {
    id: "confirmar_visita",
    nome: "Confirmar visitas",
    icone: "✅",
    prioridade: "Alta",
    objetivo: "Confirmar presença de clientes agendados.",
    porqueAgora: "Visitas confirmadas têm taxa muito maior de comparecimento.",
    potencial: "3 a 6 vendas",
    scriptId: "Confirmar visita amanhã",
    filtro: c => c.situacao_atual === "Visita a confirmar" || (c.visita_agendada_em && moment(c.visita_agendada_em).diff(moment(), "days") <= 2 && moment(c.visita_agendada_em).diff(moment(), "days") >= 0),
  },
  {
    id: "cliente_quente",
    nome: "Agendar visitas (quentes)",
    icone: "🔥",
    prioridade: "Alta",
    objetivo: "Transformar interesse quente em visita.",
    porqueAgora: "Clientes quentes sem visita perdem temperatura a cada dia.",
    potencial: "3 a 7 vendas",
    scriptId: "Convidar para visita",
    filtro: c => c.situacao_atual === "Cliente quente sem visita" || (c.temperatura === "Quente" && !c.visita_agendada_em && c.situacao_atual !== "Venda realizada" && c.situacao_atual !== "Venda perdida"),
  },
  {
    id: "visitou_nao_comprou",
    nome: "Recuperar visitas",
    icone: "🚗",
    prioridade: "Alta",
    objetivo: "Entender barreira e tentar fechar.",
    porqueAgora: "Quem visitou já tem intenção. Falta superar a barreira.",
    potencial: "3 a 7 vendas",
    scriptId: "Retomar proposta",
    filtro: c => c.situacao_atual === "Visita realizada" || c.momento === "Visita realizada",
  },
  {
    id: "lead_sem_resposta",
    nome: "Retomar leads",
    icone: "👻",
    prioridade: "Média",
    objetivo: "Reativar leads sem resposta.",
    porqueAgora: "Leads frios podem ser reativados com abordagem correta.",
    potencial: "1 a 3 vendas",
    scriptId: "Enviar segunda abordagem",
    filtro: c => ["Lead sem resposta", "Em cadência sem resposta", "Aguardando resposta do cliente"].includes(c.situacao_atual) || c.temperatura === "Frio" || c.momento === "Cliente frio em nutrição" || c.momento === "Novo contato",
  },
  {
    id: "vai_pensar",
    nome: "Follow-up de decisão",
    icone: "🤔",
    prioridade: "Média",
    objetivo: "Descobrir objeção e converter.",
    porqueAgora: "Clientes 'vão pensar' precisam de follow-up inteligente.",
    potencial: "2 a 4 vendas",
    scriptId: "Fazer follow-up de decisão",
    filtro: c => c.situacao_atual === "Vai pensar" || c.situacao_atual === "Em negociação ativa" || c.momento === "Em negociação",
  },
  {
    id: "reativar_carteira",
    nome: "Reativar carteira",
    icone: "🔄",
    prioridade: "Média",
    objetivo: "Retomar relacionamento com clientes antigos.",
    porqueAgora: "Clientes antigos compram mais rápido do que leads novos.",
    potencial: "2 a 5 vendas",
    scriptId: "Reativar cliente antigo",
    filtro: c => (c.canal_comercial === "Carteira" || c.canal_origem === "Carteira") && ["Oportunidade futura", "Cliente frio em nutrição", "Venda realizada"].includes(c.situacao_atual || c.momento),
  },
  {
    id: "pos_venda",
    nome: "Pós-venda e indicação",
    icone: "⭐",
    prioridade: "Média",
    objetivo: "Manter relacionamento e pedir indicação.",
    porqueAgora: "Clientes satisfeitos indicam. Não deixe essa janela fechar.",
    potencial: "Indicações",
    scriptId: "Pedir indicação",
    filtro: c => c.situacao_atual === "Pós-venda ativo" || c.momento === "Pós-venda ativo",
  },
  {
    id: "garantia",
    nome: "Acompanhar garantias",
    icone: "🛡️",
    prioridade: "Baixa",
    objetivo: "Proteger relacionamento pós-venda.",
    porqueAgora: "Clientes com garantia precisam de atenção para manter confiança.",
    potencial: "Relacionamento",
    scriptId: "Acompanhar garantia",
    filtro: c => c.situacao_atual === "Garantia em acompanhamento" || c.momento === "Garantia em acompanhamento",
  },
  {
    id: "troca_futura",
    nome: "Oportunidades de troca",
    icone: "🔁",
    prioridade: "Baixa",
    objetivo: "Cultivar oportunidade de troca futura.",
    porqueAgora: "Clientes com intenção futura podem antecipar a compra.",
    potencial: "2 a 5 vendas",
    scriptId: "Reativar cliente antigo",
    filtro: c => c.situacao_atual === "Oportunidade futura" || c.interesse_troca || c.momento === "Oportunidade futura de troca",
  },
];