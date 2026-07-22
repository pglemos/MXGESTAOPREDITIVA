/**
 * Banco local de mensagens prontas por tom, usado quando a geração por IA
 * não está disponível. Cada tom tem várias variações — a cada clique em
 * "Gerar outra versão" ou troca de tom, sorteia uma variação diferente da
 * anterior, preenchida com os dados do cliente.
 *
 * IMPORTANTE: nunca injetar o rótulo cru do próximo passo (ex.: "Converter
 * financiamento aprovado") dentro da mensagem — isso é um nome de etapa do
 * CRM, não uma frase que um vendedor diria pro cliente. GANCHO_POR_PASSO
 * traduz cada etapa pra um gancho de conversa em português falado.
 *
 * Técnicas aplicadas em todas as variações: rapport (abertura pessoal, tom
 * de conversa real), ancoragem (referência a uma condição/esforço já
 * encaminhado), escassez ética (agenda do vendedor, nunca "última unidade"
 * ou promoção inventada — isso violaria as regras do próprio prompt de IA
 * deste componente) e call-to-action único e de baixa fricção (pergunta
 * fechada, sim/não).
 */

const GANCHO_POR_PASSO = {
  "Enviar primeira abordagem": "vi que você deu uma olhada",
  "Enviar segunda abordagem": "te mandei uma mensagem outro dia e não quero deixar esfriar",
  "Fazer pergunta consultiva": "a gente já trocou uma ideia",
  "Definir veículo de interesse": "você tá entre algumas opções",
  "Convidar para visita": "já entendi o que você procura",
  "Confirmar visita hoje": "combinamos de você passar aqui hoje",
  "Confirmar visita amanhã": "combinamos sua visita",
  "Reagendar visita": "a gente não conseguiu se encontrar da última vez",
  "Enviar resumo do atendimento": "você esteve aqui comigo outro dia",
  "Retomar proposta": "te passei uma proposta",
  "Converter financiamento aprovado": "seu financiamento saiu aprovado",
  "Fazer follow-up de decisão": "ficamos de conversar sobre a decisão",
  "Reativar cliente antigo": "já faz um tempo que a gente não fecha negócio",
  "Pedir indicação": "você fechou com a gente",
  "Acompanhar garantia": "seu carro tá em garantia",
  "Enviar proposta": "já deixei as condições prontas",
  "Acompanhar financiamento": "seu financiamento tá em análise",

  // Ganchos para os labels oficiais de PASSOS (PP01–PP17, ver proximoPassoLib.js).
  // cliente.proximo_passo é gravado com esses labels após qualquer transição
  // registrada — sem entrada aqui, cai no GANCHO_PADRAO genérico.
  "Realizar diagnóstico": "a gente ainda não bateu o papo direito sobre o que você precisa",
  "Enviar fotos ou vídeo": "separei fotos e vídeo do carro pra te mostrar",
  "Apresentar veículo ideal": "encontrei uma opção que encaixa bem no que você me contou",
  "Simular financiamento": "fiz uma simulação de financiamento pensando em você",
  "Avaliar usado": "vamos avançar com a avaliação do seu usado",
  "Agendar visita ou videochamada": "já entendi o que você procura",
  "Confirmar agendamento": "combinamos sua visita",
  "Realizar atendimento comercial": "você tá vindo aqui pra gente conversar",
  "Trabalhar objeção": "ficou faltando resolver um ponto pra você fechar",
  "Solicitar documentos / ficha": "tá quase tudo certo, só falta um detalhe",
  "Confirmar venda": "seu negócio tá praticamente fechado",
  "Retomar contato": "ainda não recebi seu retorno",
  "Reativar cliente": "já faz um tempo que a gente não fecha negócio",
  "Encerrar oportunidade": "chegamos ao fim dessa negociação",
  "Registrar motivo de perda": "esse não era o momento certo pra você",
  "Programar troca futura": "você comentou que pensa em trocar mais pra frente",
};

const GANCHO_PADRAO = "vi seu interesse";

function primeiroNome(nome) {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

function veiculoLongo(veiculo) {
  return veiculo ? `o ${veiculo}` : "esse carro que você tá de olho";
}

function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function ganchoDoPasso(proximoPasso) {
  return GANCHO_POR_PASSO[proximoPasso] || GANCHO_PADRAO;
}

const VARIACOES_POR_TOM = {
  consultivo: [
    ({ nome, veiculoTxt, ganchoCap }) =>
      `Oi, ${nome}! Tudo bem?\n\n${ganchoCap} e queria entender melhor o que ainda pesa na decisão sobre ${veiculoTxt}: preço, prazo ou o próprio carro?\n\nMe conta que eu ajusto certinho pra você.`,
    ({ nome, ganchoCap }) =>
      `${nome}, posso te fazer uma pergunta rápida?\n\n${ganchoCap}. O que faria você fechar com mais tranquilidade agora?`,
    ({ nome, veiculoTxt }) =>
      `Oi, ${nome}!\n\nAntes de eu seguir com qualquer coisa, quero entender: ${veiculoTxt} ainda é a opção certa pra você, ou rolou alguma dúvida no caminho?`,
    ({ nome, ganchoCap }) =>
      `${nome}, tudo certo?\n\n${ganchoCap} e fiquei pensando no seu caso. O que falta pra você dar o próximo passo com mais segurança?`,
    ({ nome, veiculoTxt, gancho }) =>
      `Oi, ${nome}!\n\nQuero te ajudar da forma certa, sem enrolação: ${gancho}. O que ainda falta pra você fechar com ${veiculoTxt} agora?`,
  ],
  direto: [
    ({ nome, gancho }) =>
      `${nome}, direto ao ponto: ${gancho}. Faz sentido a gente seguir com isso agora?`,
    ({ nome, ganchoCap }) =>
      `Oi, ${nome}. ${ganchoCap}. Minha agenda essa semana tá cheia, mas separei um espaço pensando em você. Confirma?`,
    ({ nome, gancho }) =>
      `${nome}, sem enrolação: ${gancho} e já deixei encaminhado do jeito que faz sentido pra você. Topa avançar?`,
    ({ nome, ganchoCap }) =>
      `Oi, ${nome}! ${ganchoCap}. Me diz só um sim ou não: seguimos?`,
    ({ nome, gancho }) =>
      `${nome}, resumindo: ${gancho}. Quer que eu já deixe isso encaminhado pra você?`,
  ],
  leve: [
    ({ nome, veiculoTxt, gancho }) =>
      `Oi, ${nome}! Tudo certo por aí?\n\n${capitalizar(gancho)}, e lembrei de você aqui. Sem pressão nenhuma, só queria saber se ainda faz sentido a gente continuar essa conversa sobre ${veiculoTxt}.`,
    ({ nome, gancho }) =>
      `${nome}, e aí, como vão as coisas?\n\n${capitalizar(gancho)}. Se ainda tiver interesse, me chama que eu te mostro os próximos passos com calma.`,
    ({ nome, gancho }) =>
      `Oi, ${nome}!\n\nQueria só dar um toque: ${gancho}. Bora ver isso juntos quando fizer sentido pra você?`,
    ({ nome, veiculoTxt, ganchoCap }) =>
      `${nome}, tudo tranquilo?\n\n${ganchoCap}. Fico por aqui se quiser retomar ${veiculoTxt} sem compromisso.`,
    ({ nome, veiculoTxt, gancho }) =>
      `Oi, ${nome}!\n\nPassando rapidinho: ${gancho}. Se quiser, seguimos com ${veiculoTxt}, sem pressa nenhuma.`,
  ],
  reativacao: [
    ({ nome, veiculoTxt, gancho }) =>
      `Oi, ${nome}! Faz um tempinho que a gente não troca ideia.\n\n${capitalizar(gancho)}. Ainda faz sentido pra você retomar ${veiculoTxt}?`,
    ({ nome, gancho }) =>
      `${nome}, tudo bem?\n\nSei que ficou um tempo parado, mas ${gancho} e queria saber se ainda vale a pena eu separar uma condição pra você.`,
    ({ nome, ganchoCap }) =>
      `Oi, ${nome}! Passando pra reabrir nosso papo.\n\n${ganchoCap}. Se ainda fizer sentido, me avisa que eu retomo com você agora mesmo.`,
    ({ nome, veiculoTxt }) =>
      `${nome}, notei que faz tempo sem resposta.\n\nSem cobrança nenhuma: se ${veiculoTxt} ainda estiver nos seus planos, é só me chamar.`,
    ({ nome, veiculoTxt, gancho }) =>
      `Oi, ${nome}!\n\nQueria saber se posso te ajudar ainda com ${veiculoTxt}. ${capitalizar(gancho)}, e não quero deixar isso esfriar à toa.`,
  ],
  audio: [
    ({ nome, ganchoCap }) =>
      `Oi ${nome}, tudo bem? Passando rapidinho aqui. ${ganchoCap}, viu? Me chama que eu te explico certinho.`,
    ({ nome, ganchoCap }) =>
      `E aí ${nome}, beleza? ${ganchoCap}. Separei um tempinho pra te atender direito, só confirma comigo.`,
    ({ nome, gancho }) =>
      `Oi ${nome}! Direto aqui: ${gancho}. Fico no aguardo do seu retorno, tá bom?`,
    ({ nome, gancho }) =>
      `${nome}, tudo certo? Rapidinho: ${gancho}. Me chama quando puder que eu te passo os detalhes.`,
    ({ nome, ganchoCap }) =>
      `Oi ${nome}, passando pra dar um toque. ${ganchoCap}. Falo com você em breve!`,
  ],
};

/**
 * Sorteia uma variação de mensagem para o tom informado, evitando repetir o
 * texto imediatamente anterior (para o clique em "Gerar outra versão" sempre
 * parecer uma mensagem nova).
 */
export function gerarScriptLocal({ cliente, proximoPasso, tom, textoAnterior }) {
  const variacoes = VARIACOES_POR_TOM[tom] || VARIACOES_POR_TOM.consultivo;
  const gancho = ganchoDoPasso(proximoPasso);
  const vars = {
    nome: primeiroNome(cliente?.nome) || "tudo bem",
    veiculoTxt: veiculoLongo(cliente?.veiculo_interesse),
    gancho,
    ganchoCap: capitalizar(gancho),
  };

  let candidatos = variacoes.map(fn => fn(vars));
  if (candidatos.length > 1 && textoAnterior) {
    candidatos = candidatos.filter(texto => texto !== textoAnterior);
  }
  const indice = Math.floor(Math.random() * candidatos.length);
  return candidatos[indice];
}
