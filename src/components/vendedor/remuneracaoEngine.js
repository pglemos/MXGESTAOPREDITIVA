// Motor de cálculo de remuneração — consome PoliticaRemuneracao, FaixaComissao, PremiacaoRemuneracao

export function encontrarPoliticaAtiva(politicas, faixas, user, profile) {
  if (!politicas || politicas.length === 0) return null;
  const cargo = (profile?.role || "").toLowerCase();
  const loja = profile?.dealership || "";

  // Prioridade: vendedor específico > cargo > departamento > loja > primeira ativa
  return (
    politicas.find(p => p.vendedor_id === user?.id) ||
    politicas.find(p => p.cargo && cargo && p.cargo.toLowerCase() === cargo) ||
    politicas.find(p => p.departamento === "Comercial") ||
    politicas.find(p => p.loja_nome && loja && p.loja_nome === loja) ||
    politicas[0] ||
    null
  );
}

export function getFaixaPorQuantidade(faixas, politicaId, quantidade) {
  const faixasDaPolitica = faixas.filter(f => f.politica_id === politicaId);
  return faixasDaPolitica.find(f => {
    const inicio = f.quantidade_inicial || 0;
    const fim = f.quantidade_final ?? Infinity;
    return quantidade >= inicio && quantidade <= fim;
  }) || null;
}

export function getProximaFaixa(faixas, politicaId, quantidade) {
  const faixasDaPolitica = faixas
    .filter(f => f.politica_id === politicaId)
    .sort((a, b) => (a.quantidade_inicial || 0) - (b.quantidade_inicial || 0));
  return faixasDaPolitica.find(f => (f.quantidade_inicial || 0) > quantidade) || null;
}

export function calcularComissaoPorFaixa(politica, faixas, qtd, valorTotal) {
  if (!politica) return 0;
  const faixa = getFaixaPorQuantidade(faixas, politica.id, qtd);
  if (!faixa) return 0;
  if (faixa.tipo === "Valor fixo por veículo") return qtd * (faixa.valor || 0);
  if (faixa.tipo === "Percentual sobre valor vendido") return valorTotal * ((faixa.valor || 0) / 100);
  return 0;
}

export function calcularComissaoSimples(politica, qtd, valorTotal) {
  if (!politica) return 0;
  if (politica.tipo_comissao === "Comissão fixa por veículo") return qtd * (politica.valor_fixo || 0);
  if (politica.tipo_comissao === "Comissão percentual sobre valor vendido") return valorTotal * ((politica.percentual || 0) / 100);
  return 0;
}

export function calcularPremiacoes(premiacoes, politicaId, qtd) {
  const premsDaPolitica = premiacoes.filter(p => p.politica_id === politicaId);
  if (premsDaPolitica.length === 0) return { total: 0, atingidas: [], proxima: null };

  const sorted = [...premsDaPolitica].sort((a, b) => (a.quantidade_vendas_necessarias || 0) - (b.quantidade_vendas_necessarias || 0));
  const atingidas = sorted.filter(p => qtd >= (p.quantidade_vendas_necessarias || 0));
  const naoAtingidas = sorted.filter(p => qtd < (p.quantidade_vendas_necessarias || 0));
  const proxima = naoAtingidas[0] || null;

  let total = 0;
  if (atingidas.length > 0) {
    const tipoPremiacao = atingidas[0].tipo_premiacao;
    if (tipoPremiacao === "Substitutiva") {
      total = Math.max(...atingidas.map(p => p.valor_premio || 0));
    } else {
      total = atingidas.reduce((sum, p) => sum + (p.valor_premio || 0), 0);
    }
  }

  return { total, atingidas, proxima };
}

export function calcularComissao(politica, faixas, premiacoes, vendas, oportunidades, periodRange) {
  const qtd = vendas.length;
  const valorTotal = vendas.reduce((sum, v) => {
    const val = parseFloat(v.valor_venda || v.valor_negociado || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const ticketMedio = qtd > 0 ? valorTotal / qtd : 0;

  let comissao = 0;
  let faixaAtual = null;
  let proximaFaixa = null;
  let proxSaltoVendas = 0;
  let comissaoProxSalto = 0;
  let ganhoadicionalSalto = 0;

  if (!politica) {
    const premResult = { total: 0, atingidas: [], proxima: null };
    return buildResult(0, 0, null, null, 0, 0, 0, premResult, qtd, valorTotal, ticketMedio, oportunidades, 0, politica);
  }

  const tipo = politica.tipo_comissao || "";

  if (tipo === "Comissão fixa por veículo" || tipo === "Comissão percentual sobre valor vendido") {
    comissao = calcularComissaoSimples(politica, qtd, valorTotal);
  } else {
    // Faixa de volume (mista ou por faixa)
    comissao = calcularComissaoPorFaixa(politica, faixas, qtd, valorTotal);
    faixaAtual = getFaixaPorQuantidade(faixas, politica.id, qtd);
    proximaFaixa = getProximaFaixa(faixas, politica.id, qtd);

    if (proximaFaixa) {
      proxSaltoVendas = (proximaFaixa.quantidade_inicial || 0) - qtd;
      const qtdProx = proximaFaixa.quantidade_inicial || 0;
      const valorTotalProx = valorTotal + ticketMedio * proxSaltoVendas;
      comissaoProxSalto = calcularComissaoPorFaixa(politica, faixas, qtdProx, valorTotalProx);
      ganhoadicionalSalto = comissaoProxSalto - comissao;
    }
  }

  const premResult = calcularPremiacoes(premiacoes, politica.id, qtd);
  const salarioFixo = 0; // pode ser expandido com campo no UserProfile

  // Oportunidades quentes — potencial de comissão
  let comissaoPotencialOport = 0;
  if (oportunidades.length > 0) {
    oportunidades.forEach(op => {
      const val = parseFloat(op.valor_negociado || 0);
      const valorOp = val > 0 ? val : ticketMedio;
      const novaQtd = qtd + 1;
      const novoValorTotal = valorTotal + valorOp;
      const comissaoComOp = calcularComissaoPorFaixa(politica, faixas, novaQtd, novoValorTotal) ||
        calcularComissaoSimples(politica, novaQtd, novoValorTotal);
      comissaoPotencialOport += Math.max(0, comissaoComOp - comissao);
    });
  }

  return buildResult(
    comissao, salarioFixo, faixaAtual, proximaFaixa,
    proxSaltoVendas, comissaoProxSalto, ganhoadicionalSalto,
    premResult, qtd, valorTotal, ticketMedio, oportunidades,
    comissaoPotencialOport, politica
  );
}

function buildResult(
  comissao, salarioFixo, faixaAtual, proximaFaixa,
  proxSaltoVendas, comissaoProxSalto, ganhoAdicionalSalto,
  premResult, qtd, valorTotal, ticketMedio, oportunidades,
  comissaoPotencialOport, politica
) {
  const salarioPrevisto = salarioFixo + comissao + premResult.total;
  return {
    politica,
    qtdVendas: qtd,
    valorTotalVendido: valorTotal,
    ticketMedio,
    comissao,
    salarioFixo,
    premiacoesTotal: premResult.total,
    premiacoesAtingidas: premResult.atingidas,
    proximaPremiacao: premResult.proxima,
    bonificacoesConfirmadas: 0,
    salarioPrevisto,
    faixaAtual,
    proximaFaixa,
    proxSaltoVendas,
    comissaoProxSalto,
    ganhoAdicionalSalto,
    qtdOportunidades: oportunidades.length,
    comissaoPotencialOport,
  };
}

// Linha do dinheiro: projeta de qtd atual até +5 vendas
export function calcularMoneyTimeline(politica, faixas, qtd, valorTotal, ticketMedio) {
  if (!politica) return [];
  const pontos = [];
  for (let i = 0; i <= 5; i++) {
    const q = qtd + i;
    const v = valorTotal + ticketMedio * i;
    const comissao = calcularComissaoPorFaixa(politica, faixas, q, v) ||
      calcularComissaoSimples(politica, q, v);
    const faixa = getFaixaPorQuantidade(faixas, politica.id, q);
    const novafaixa = i > 0 && faixa !== getFaixaPorQuantidade(faixas, politica.id, q - 1);
    pontos.push({ vendas: q, comissao, faixa, novaFaixa: novafaixa, adicional: comissao - (pontos[0]?.comissao || comissao) });
  }
  return pontos;
}

export function simularGanho(politica, faixas, premiacoes, qtdAtual, valorAtual, ticketMedio, vendasAdicionais, valorMedioInput) {
  if (!politica) return null;
  const vmedio = valorMedioInput > 0 ? valorMedioInput : ticketMedio;
  const novaQtd = qtdAtual + vendasAdicionais;
  const novoValorTotal = valorAtual + vmedio * vendasAdicionais;
  const comissao = calcularComissaoPorFaixa(politica, faixas, novaQtd, novoValorTotal) ||
    calcularComissaoSimples(politica, novaQtd, novoValorTotal);
  const premResult = calcularPremiacoes(premiacoes, politica.id, novaQtd);
  const salario = comissao + premResult.total;
  return { comissao, premiacoes: premResult.total, salario };
}