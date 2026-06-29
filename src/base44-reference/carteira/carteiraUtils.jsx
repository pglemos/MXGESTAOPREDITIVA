import moment from "moment";

export const MOMENTOS = [
  "Novo contato",
  "Cliente frio em nutrição",
  "Cliente morno em aquecimento",
  "Cliente quente sem visita",
  "Visita agendada",
  "Visita a confirmar",
  "Visita realizada",
  "Proposta enviada",
  "Em negociação",
  "Venda realizada",
  "Perda registrada",
  "Pós-venda ativo",
  "Garantia em acompanhamento",
  "Oportunidade futura de troca",
];

export const TEMPERATURAS = ["Frio", "Morno", "Quente"];

export const RESULTADOS = [
  "Agendou visita",
  "Pediu proposta",
  "Vai pensar",
  "Não respondeu",
  "Sem interesse",
  "Comprou em outra loja",
  "Número inválido",
  "Reagendar contato",
];

export const MISSOES = [
  { id: "avaliacoes", nome: "Recuperar avaliações", potencial: "3 a 6 vendas", prioridade: "Alta", icone: "🔁", objetivo: "Retomar contato e transformar interesse em venda.", filtro: c => c.momento === "Visita realizada" || c.momento === "Cliente quente sem visita" },
  { id: "propostas", nome: "Propostas sem resposta", potencial: "2 a 4 vendas", prioridade: "Alta", icone: "📋", objetivo: "Recuperar decisão e fechar negócio.", filtro: c => c.momento === "Proposta enviada" },
  { id: "nao_compareceu", nome: "Agendou e não compareceu", potencial: "2 a 5 vendas", prioridade: "Alta", icone: "📅", objetivo: "Reagendar visita e retomar interesse.", filtro: c => c.momento === "Visita a confirmar" || (c.visita_agendada_em && moment(c.visita_agendada_em).isBefore(moment(), "day")) },
  { id: "visitou", nome: "Visitou e não comprou", potencial: "3 a 7 vendas", prioridade: "Alta", icone: "🚗", objetivo: "Entender barreira e tentar fechar.", filtro: c => c.momento === "Visita realizada" },
  { id: "sumidos", nome: "Leads que sumiram", potencial: "1 a 3 vendas", prioridade: "Média", icone: "👻", objetivo: "Reativar sem pressionar.", filtro: c => c.momento === "Novo contato" || c.temperatura === "Frio" },
  { id: "financiamento", nome: "Financiamento aprovado sem compra", potencial: "2 a 4 vendas", prioridade: "Alta", icone: "💳", objetivo: "Retomar oportunidade de crédito aprovado.", filtro: c => c.interesse_financiamento && c.momento === "Em negociação" },
  { id: "mornos", nome: "Aquecer clientes mornos", potencial: "2 a 6 vendas", prioridade: "Média", icone: "🌡️", objetivo: "Entender prazo de compra e barreiras.", filtro: c => c.temperatura === "Morno" || c.momento === "Cliente morno em aquecimento" },
  { id: "frios", nome: "Reativar clientes frios", potencial: "1 a 4 vendas", prioridade: "Baixa", icone: "❄️", objetivo: "Nutrir e programar reativação.", filtro: c => c.temperatura === "Frio" || c.momento === "Cliente frio em nutrição" },
  { id: "pos_venda", nome: "Pós-venda hoje", potencial: "Indicações", prioridade: "Média", icone: "⭐", objetivo: "Relacionamento e indicação.", filtro: c => c.momento === "Pós-venda ativo" },
  { id: "indicacao", nome: "Pedir indicação", potencial: "1 a 3 indicações", prioridade: "Média", icone: "🤝", objetivo: "Ativar rede de clientes satisfeitos.", filtro: c => c.momento === "Venda realizada" },
  { id: "troca", nome: "Troca futura", potencial: "2 a 5 vendas", prioridade: "Baixa", icone: "🔄", objetivo: "Cultivar oportunidade futura.", filtro: c => c.momento === "Oportunidade futura de troca" || c.interesse_troca },
  { id: "garantia", nome: "Garantia em acompanhamento", potencial: "Relacionamento", prioridade: "Baixa", icone: "🛡️", objetivo: "Acompanhar e manter relacionamento.", filtro: c => c.momento === "Garantia em acompanhamento" },
];

export const SCRIPTS = {
  avaliacoes: `Oi, {nome}! Tudo bem?\nVi que você avaliou o {veiculo} e fiquei pensando se ainda faz sentido para você.\nTemos algumas condições esta semana e quero te mostrar o que conseguimos fazer para te ajudar a realizar esse sonho.\nPosso te enviar as condições atualizadas e agendar um horário para você ver o carro de novo?`,
  visitou: `Oi, {nome}! Tudo bem?\nVi que você demonstrou interesse no {veiculo}.\nPara te ajudar a decidir com mais segurança, o ideal é você ver o carro pessoalmente.\nTenho horário hoje às {opcao1} ou amanhã às {opcao2}. Qual fica melhor para você?`,
  confirmar_visita: `Oi, {nome}! Tudo bem?\nSua visita para ver o {veiculo} está agendada para {data} às {hora}.\nVou deixar tudo organizado para te atender bem. Posso manter esse horário?`,
  mornos: `Oi, {nome}! Tudo bem?\nPassando para entender melhor seu momento.\nA compra do {veiculo} ainda faz sentido para agora ou você está olhando para mais adiante?\nAssim consigo te mandar opções mais alinhadas ao que você precisa.`,
  frios: `Oi, {nome}! Tudo bem?\nEstou atualizando minha carteira e queria saber se a ideia de trocar ou comprar um veículo ainda está nos seus planos.\nSe não for para agora, posso deixar anotado para te chamar no momento certo.`,
  propostas: `Oi, {nome}! Tudo bem?\nConseguiu avaliar a proposta do {veiculo}?\nSe fizer sentido, posso revisar as condições com você e ver se existe algum ponto que ainda está travando sua decisão.`,
  pos_venda: `Oi, {nome}! Tudo bem com o {veiculo}?\nEstou passando para saber se está tudo certo e se você ficou satisfeito com a compra.\nQualquer coisa, sigo por aqui para te ajudar.`,
  padrao: `Oi, {nome}! Tudo bem?\nPassando para manter nosso contato e ver como posso te ajudar com o {veiculo}.\nQualquer novidade, estarei por aqui!`,
};

export function getScriptParaMissao(missaoId) {
  return SCRIPTS[missaoId] || SCRIPTS.padrao;
}

export function preencherScript(script, cliente) {
  return script
    .replace(/{nome}/g, cliente.nome || "")
    .replace(/{veiculo}/g, cliente.veiculo_interesse || "veículo")
    .replace(/{data}/g, cliente.visita_agendada_em ? moment(cliente.visita_agendada_em).format("DD/MM") : "")
    .replace(/{hora}/g, cliente.visita_agendada_em ? moment(cliente.visita_agendada_em).format("HH:mm") : "")
    .replace(/{opcao1}/g, "10h")
    .replace(/{opcao2}/g, "14h");
}

export function calcularProximaAcao(cliente) {
  const { momento, temperatura, visita_agendada_em } = cliente;

  if (momento === "Visita agendada" && visita_agendada_em) {
    const diff = moment(visita_agendada_em).diff(moment(), "days");
    if (diff <= 0) return "Atendimento agendado (hoje)";
    if (diff === 1) return "Confirmar visita";
    if (diff === 2) return "Confirmar amanhã";
    return "Visita agendada";
  }
  if (momento === "Cliente quente sem visita" || temperatura === "Quente") return "Agendar visita";
  if (momento === "Proposta enviada") return "Retomar proposta";
  if (momento === "Cliente morno em aquecimento" || temperatura === "Morno") return "Entender prazo e barreiras";
  if (momento === "Cliente frio em nutrição" || temperatura === "Frio") return "Nutrir ou programar reativação";
  if (momento === "Visita realizada") return "Enviar proposta";
  if (momento === "Em negociação") return "Fechar negociação";
  if (momento === "Pós-venda ativo") return "Manter relacionamento";
  if (momento === "Garantia em acompanhamento") return "Acompanhar relacionamento";
  if (momento === "Oportunidade futura de troca") return "Cultivar oportunidade";
  if (momento === "Perda registrada") return "Criar oportunidade futura";
  return "Fazer contato inicial";
}

export function resultadoParaMomento(resultado) {
  const map = {
    "Agendou visita": { momento: "Visita agendada", temperatura: "Quente" },
    "Pediu proposta": { momento: "Proposta enviada", temperatura: "Quente" },
    "Vai pensar": { momento: "Cliente morno em aquecimento", temperatura: "Morno" },
    "Não respondeu": { momento: null, temperatura: null },
    "Sem interesse": { momento: "Perda registrada", temperatura: "Frio" },
    "Comprou em outra loja": { momento: "Perda registrada", temperatura: "Frio" },
    "Número inválido": { momento: "Perda registrada", temperatura: "Frio" },
    "Reagendar contato": { momento: "Cliente morno em aquecimento", temperatura: "Morno" },
  };
  return map[resultado] || { momento: null, temperatura: null };
}

export function tempColor(t) {
  if (t === "Quente") return "bg-[#FEECEC] text-[#EF4343] border-[#FEECEC]";
  if (t === "Morno") return "bg-[#FFF7E6] text-[#F59F0A] border-[#FFF7E6]";
  return "bg-[#DFE0E1] text-[#526B7A] border-[#DFE0E1]";
}

export function prioridadeColor(p) {
  if (p === "Alta") return "bg-[#FEECEC] text-[#EF4343]";
  if (p === "Média") return "bg-[#FFF7E6] text-[#F59F0A]";
  return "bg-[#DFE0E1] text-[#526B7A]";
}