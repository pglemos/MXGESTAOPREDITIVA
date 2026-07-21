/**
 * Banco local de mensagens prontas por tom, usado quando a geração por IA
 * não está disponível. Cada tom tem várias variações — a cada clique em
 * "Gerar outra versão" ou troca de tom, sorteia uma variação diferente da
 * anterior, preenchida com os dados do cliente.
 */

function primeiroNome(nome) {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

function veiculoLongo(veiculo) {
  return veiculo ? `o ${veiculo}` : "o veículo que você procura";
}

function minuscula(texto) {
  if (!texto) return "";
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

const VARIACOES_POR_TOM = {
  consultivo: [
    ({ nome, veiculoTxt, proximoPasso }) =>
      `Oi, ${nome}! Tudo bem?\n\nQuero te ajudar da forma certa com ${veiculoTxt}.\n\n${proximoPasso} — faz sentido a gente avançar nesse ponto agora?`,
    ({ nome, veiculoTxt, objetivoMin }) =>
      `${nome}, posso te fazer uma pergunta rápida?\n\nSobre ${veiculoTxt}, o que mais pesa pra você decidir: condição de pagamento, prazo ou o próprio veículo?\n\nAssim consigo te ajudar a ${objetivoMin}.`,
    ({ nome, veiculoTxt, proximoPasso }) =>
      `Oi, ${nome}!\n\nAntes de seguir, queria entender melhor sua situação com ${veiculoTxt}.\n\n${proximoPasso}. O que acha de conversarmos sobre isso agora?`,
    ({ nome, objetivo }) =>
      `${nome}, tudo certo?\n\nPensando no seu caso: ${objetivo}.\n\nMe conta, isso ainda faz sentido pra você nesse momento?`,
    ({ nome, veiculoTxt, proximoPasso }) =>
      `Oi, ${nome}!\n\nQuero entender melhor o que você precisa antes de seguirmos com ${veiculoTxt}.\n\n${proximoPasso} — topa me contar um pouco mais?`,
  ],
  direto: [
    ({ nome, proximoPasso }) =>
      `${nome}, direto ao ponto: ${proximoPasso}.\n\nIsso resolve pra você agora?`,
    ({ nome, proximoPasso }) =>
      `Oi, ${nome}.\n\nPróximo passo: ${proximoPasso}.\n\nPodemos seguir com isso hoje?`,
    ({ nome, veiculoTxt, objetivo }) =>
      `${nome}, sobre ${veiculoTxt}: ${objetivo}.\n\nMe responde se topa avançar.`,
    ({ nome, proximoPasso }) =>
      `Oi, ${nome}! ${proximoPasso}.\n\nSem enrolação: você quer seguir com isso?`,
    ({ nome, objetivo }) =>
      `${nome}, resumindo: ${objetivo}.\n\nBora avançar?`,
  ],
  leve: [
    ({ nome, veiculoTxt, proximoPasso }) =>
      `Oi, ${nome}! Tudo certo por aí?\n\nPassando rapidinho pra falar sobre ${veiculoTxt}.\n\n${proximoPasso}, sem pressão nenhuma — só me avisa quando puder.`,
    ({ nome, veiculoTxt, proximoPasso }) =>
      `${nome}, e aí, como vão as coisas?\n\nSó lembrando aqui sobre ${veiculoTxt}. ${proximoPasso} quando fizer sentido pra você, tá bom?`,
    ({ nome, veiculoTxt, objetivo }) =>
      `Oi, ${nome}!\n\nQueria só te dar um toque sobre ${veiculoTxt}.\n\n${objetivo}. Bora ver isso com calma?`,
    ({ nome, veiculoTxt, proximoPasso }) =>
      `${nome}, tudo tranquilo?\n\nEstou aqui se quiser dar aquele próximo passo com ${veiculoTxt}: ${proximoPasso}.`,
    ({ nome, proximoPasso }) =>
      `Oi, ${nome}!\n\nSem compromisso nenhum: ${proximoPasso}. Se fizer sentido, me chama.`,
  ],
  reativacao: [
    ({ nome, veiculoTxt, objetivoMin }) =>
      `Oi, ${nome}! Faz um tempinho que a gente não se fala.\n\nAinda faz sentido pra você ${objetivoMin}?\n\nSe sim, posso retomar com ${veiculoTxt}.`,
    ({ nome, veiculoTxt }) =>
      `${nome}, tudo bem?\n\nSei que ficou um tempo sem retorno, mas queria saber se ${veiculoTxt} ainda está nos seus planos.`,
    ({ nome, proximoPasso }) =>
      `Oi, ${nome}! Passando para reabrir nosso papo.\n\n${proximoPasso} — se ainda fizer sentido, me avisa que eu retomo com você.`,
    ({ nome, veiculoTxt }) =>
      `${nome}, notei que faz tempo sem resposta.\n\nSem cobrança nenhuma: se ${veiculoTxt} voltar a fazer sentido pra você, é só chamar.`,
    ({ nome, veiculoTxt }) =>
      `Oi, ${nome}!\n\nQueria saber se posso te ajudar ainda com ${veiculoTxt}. Se não for o momento, tudo bem — fico à disposição.`,
  ],
  audio: [
    ({ nome, veiculoCurto, proximoPasso }) =>
      `Oi ${nome}, tudo bem? Passando rapidinho aqui pra falar sobre ${veiculoCurto}. ${proximoPasso}, viu? Qualquer coisa me chama.`,
    ({ nome, veiculoCurto, objetivo }) =>
      `E aí ${nome}, beleza? Só um recado rápido sobre ${veiculoCurto}. ${objetivo}. Depois me fala o que achou.`,
    ({ nome, proximoPasso }) =>
      `Oi ${nome}! Direto aqui: ${proximoPasso}. Fico no aguardo do seu retorno, tá bom?`,
    ({ nome, veiculoCurto, objetivoMin }) =>
      `${nome}, tudo certo? Rapidinho: sobre ${veiculoCurto}, ${objetivoMin}. Me chama quando puder.`,
    ({ nome, veiculoCurto, proximoPasso }) =>
      `Oi ${nome}, passando pra dar aquele toque sobre ${veiculoCurto}. ${proximoPasso}. Falo com você em breve!`,
  ],
};

/**
 * Sorteia uma variação de mensagem para o tom informado, evitando repetir o
 * texto imediatamente anterior (para o clique em "Gerar outra versão" sempre
 * parecer uma mensagem nova).
 */
export function gerarScriptLocal({ cliente, objetivo, proximoPasso, tom, textoAnterior }) {
  const variacoes = VARIACOES_POR_TOM[tom] || VARIACOES_POR_TOM.consultivo;
  const vars = {
    nome: primeiroNome(cliente?.nome) || "tudo bem",
    veiculoTxt: veiculoLongo(cliente?.veiculo_interesse),
    veiculoCurto: cliente?.veiculo_interesse || "o veículo",
    proximoPasso: proximoPasso || "seguir com o próximo passo",
    objetivo: objetivo || "avançar com você",
    objetivoMin: minuscula(objetivo || "avançar com você"),
  };

  let candidatos = variacoes.map(fn => fn(vars));
  if (candidatos.length > 1 && textoAnterior) {
    candidatos = candidatos.filter(texto => texto !== textoAnterior);
  }
  const indice = Math.floor(Math.random() * candidatos.length);
  return candidatos[indice];
}
