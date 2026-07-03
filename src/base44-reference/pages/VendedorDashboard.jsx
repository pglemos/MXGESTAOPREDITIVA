import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import moment from "moment";
import { RefreshCw, Info, Zap } from "lucide-react";
import PeriodFilter from "@/components/vendedor/PeriodFilter";
import CommissionHeroCard from "@/components/vendedor/CommissionHeroCard";
import MilestoneCard from "@/components/vendedor/MilestoneCard";
import HotOpportunitiesCard from "@/components/vendedor/HotOpportunitiesCard";
import PerformanceCard from "@/components/vendedor/PerformanceCard";
import PotentialCommissionCard from "@/components/vendedor/PotentialCommissionCard";
import LastSixMonthsCard from "@/components/vendedor/LastSixMonthsCard";
import RecordRoutineCard from "@/components/vendedor/RecordRoutineCard";
import CalculationDetailsDrawer from "@/components/vendedor/CalculationDetailsDrawer";
import { calcularComissao, encontrarPoliticaAtiva, calcularComissaoPorFaixa, calcularComissaoSimples, calcularPremiacoes } from "@/components/vendedor/remuneracaoEngine";
import { formatBRL } from "@/components/vendedor/formatBRL";

const STATUSES_ELEGIVEIS = ["vendida", "confirmada", "concluída", "faturada", "entregue", "venda realizada", "sim", "venda"];
const STATUSES_QUENTES = ["quente", "em negociação", "em negociacao", "proposta enviada", "fechamento próximo", "fechamento proximo", "aguardando aprovação", "aguardando aprovacao", "agendado", "visita realizada", "agendamento criado"];
// Fechamentos com estes status são ignorados no cálculo
const STATUSES_FECHAMENTO_INVALIDO = ["rascunho", "cancelado", "excluido", "excluído", "rejeitado"];

function isVendaElegivel(c) {
  if (c.sale_completed === true) return true;
  if (c.vendido === true) return true;
  const s = (c.sale_status || c.status_comercial || c.status || "").toLowerCase();
  const sit = (c.situacao_atual || "").toLowerCase();
  return STATUSES_ELEGIVEIS.some(e => s.includes(e) || sit.includes(e));
}

function isFechamentoValido(f) {
  // Se não tem status, considera válido (foi salvo)
  if (!f.status_fechamento && !f.status) return true;
  const s = (f.status_fechamento || f.status || "").toLowerCase();
  return !STATUSES_FECHAMENTO_INVALIDO.some(inv => s.includes(inv));
}

function isOportunidadeQuente(c) {
  if (isVendaElegivel(c)) return false;
  if ((c.status_oportunidade || "").toLowerCase() === "encerrada") return false;
  if ((c.status_oportunidade || "").toLowerCase() === "vendida") return false;
  const s = (c.situacao_atual || c.status_comercial || c.status || "").toLowerCase();
  return STATUSES_QUENTES.some(e => s.includes(e));
}

function getPeriodRange(period, customStart, customEnd) {
  const now = moment();
  if (period === "mes_atual") return { start: now.clone().startOf("month"), end: now.clone().endOf("month") };
  if (period === "mes_anterior") return { start: now.clone().subtract(1, "month").startOf("month"), end: now.clone().subtract(1, "month").endOf("month") };
  if (period === "ultimos_30") return { start: now.clone().subtract(29, "days").startOf("day"), end: now.clone().endOf("day") };
  if (period === "personalizado" && customStart && customEnd) return { start: moment(customStart), end: moment(customEnd) };
  return { start: now.clone().startOf("month"), end: now.clone().endOf("month") };
}

// Agrega vendas reais (CarteiraCliente) + fallback do Fechamento Diário.
// Evita duplicidade: usa vendas reais quando existem; só usa FechamentoDiário
// para os dias que NÃO possuem venda individual registrada.
function agregarVendasComFechamento(carteiraVendas, fechamentos, start, end) {
  // Datas com venda real registrada (YYYY-MM-DD)
  const datasComVendaReal = new Set(
    carteiraVendas.map(v => {
      const d = v.data_venda || v._data_competencia_fechamento;
      return d ? d.slice(0, 10) : null;
    }).filter(Boolean)
  );

  // Fechamentos válidos no período sem venda real correspondente
  const fechamentosNoperiodo = fechamentos.filter(f => {
    if (!isFechamentoValido(f)) return false;
    const data = f.date || f.data_referencia || "";
    return data >= start.format("YYYY-MM-DD") && data <= end.format("YYYY-MM-DD");
  });

  // Vendas extras do fechamento (dias sem venda real)
  let qtdFechamento = 0;
  fechamentosNoperiodo.forEach(f => {
    const data = (f.date || f.data_referencia || "").slice(0, 10);
    // Só usa o fechamento se não há venda real nesse dia
    if (!datasComVendaReal.has(data)) {
      const qtdDia = f.vendas || f.veiculos_vendidos || f.quantidade_vendas || 0;
      qtdFechamento += Number(qtdDia) || 0;
    }
  });

  return {
    vendasReais: carteiraVendas,
    qtdFechamento,
    qtdTotal: carteiraVendas.length + qtdFechamento,
    // Valor total apenas das vendas reais (fechamento não tem valor confiável)
    valorTotal: carteiraVendas.reduce((sum, v) => sum + (parseFloat(v.valor_venda || v.valor_negociado || 0) || 0), 0),
  };
}

function calcularHistorico6Meses(todaCarteira, fechamentos, politica, faixas, premiacoes) {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const m = moment().subtract(i, "months");
    const start = m.clone().startOf("month");
    const end = m.clone().endOf("month");
    const vendasReaisMes = todaCarteira.filter(c => {
      if (!isVendaElegivel(c)) return false;
      const dataRef = c.data_venda || c._data_competencia_fechamento || c.updated_date || c.created_date;
      if (!dataRef) return false; // no histórico, sem data descarta
      return moment(dataRef).isBetween(start, end, "day", "[]");
    });
    const agregado = agregarVendasComFechamento(vendasReaisMes, fechamentos, start, end);
    const qtd = agregado.qtdTotal;
    const valorTotal = agregado.valorTotal;
    let comissao = 0;
    if (politica) {
      comissao = calcularComissaoPorFaixa(politica, faixas, qtd, valorTotal) || calcularComissaoSimples(politica, qtd, valorTotal);
      const prem = calcularPremiacoes(premiacoes, politica.id, qtd);
      comissao += prem.total;
    }
    meses.push({ label: m.format("MMMM"), mes: m.format("YYYY-MM"), comissao, qtd, isAtual: i === 0 });
  }
  return meses;
}

export default function VendedorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("mes_atual");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [showCalcDrawer, setShowCalcDrawer] = useState(false);

  const [politicas, setPoliticas] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [premiacoes, setPremiacoes] = useState([]);
  const [bonificacoes, setBonificacoes] = useState([]);
  const [todaCarteira, setTodaCarteira] = useState([]);
  const [fechamentos, setFechamentos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [historico, setHistorico] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      setUser(me);

      const [pols, fxs, prems, bons, carteira, profiles, fechs] = await Promise.all([
        base44.entities.PoliticaRemuneracao.filter({ status: "Ativa" }).catch(() => []),
        base44.entities.FaixaComissao.filter({ status: "Ativa" }).catch(() => []),
        base44.entities.PremiacaoRemuneracao.filter({ status: "Ativa" }).catch(() => []),
        base44.entities.BonificacaoRemuneracao.filter({ status: "Ativa" }).catch(() => []),
        base44.entities.CarteiraCliente.filter({ vendedor_id: me.id }).catch(() => []),
        base44.entities.UserProfile.list().catch(() => []),
        base44.entities.DailyClose.filter({ vendedor_id: me.id }, "-date", 200).catch(() => []),
      ]);

      const prof = profiles[0] || null;
      setPoliticas(pols);
      setFaixas(fxs);
      setPremiacoes(prems);
      setBonificacoes(bons);
      setTodaCarteira(carteira);
      setFechamentos(fechs);
      setProfile(prof);

    } catch (e) {
      console.error("Dashboard Load Error:", e);
      setError("Não foi possível carregar seu Dashboard financeiro: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Recalcular quando mudar período ou dados
  useEffect(() => {
    if (!user || loading || todaCarteira === null) return;
    const { start, end } = getPeriodRange(period, customStart, customEnd);
    const politicaAtiva = encontrarPoliticaAtiva(politicas, faixas, user, profile);

    const vendasReaisPeriodo = todaCarteira.filter(c => {
      if (!isVendaElegivel(c)) return false;
      // Prioriza data_venda > data de competência do fechamento > updated_date > created_date
      const dataRef = c.data_venda || c._data_competencia_fechamento || c.updated_date || c.created_date;
      if (!dataRef) return true; // sem data: inclui
      return moment(dataRef).isBetween(start, end, "day", "[]");
    });

    // Agrega vendas reais + fallback do Fechamento Diário (sem duplicar)
    const agregado = agregarVendasComFechamento(vendasReaisPeriodo, fechamentos, start, end);

    const oportunidadesQuentes = todaCarteira.filter(isOportunidadeQuente);

    // Passa qtdTotal ao engine via objeto sintético de vendas
    // Para comissão por faixa/fixa, o engine usa vendas.length — preenchemos com objetos vazios
    const vendasParaEngine = agregado.qtdTotal > agregado.vendasReais.length
      ? [...agregado.vendasReais, ...Array(agregado.qtdFechamento).fill({ valor_venda: "0", _fromFechamento: true })]
      : agregado.vendasReais;

    const result = calcularComissao(politicaAtiva, faixas, premiacoes, vendasParaEngine, oportunidadesQuentes, { start, end });
    // Sobrescreve valorTotalVendido com o valor real (sem os R$ 0 sintéticos do fechamento)
    result.valorTotalVendido = agregado.valorTotal;
    result.qtdVendasReais = agregado.vendasReais.length;
    result.qtdVendasFechamento = agregado.qtdFechamento;
    setCalcResult(result);

    const hist = calcularHistorico6Meses(todaCarteira, fechamentos, politicaAtiva, faixas, premiacoes);
    setHistorico(hist);
  }, [user, politicas, faixas, premiacoes, todaCarteira, fechamentos, loading, profile, period, customStart, customEnd]);

  const { start, end } = getPeriodRange(period, customStart, customEnd);
  const userName = profile?.full_name?.split(" ")[0] || user?.full_name?.split(" ")[0] || "Vendedor";
  const userFullName = profile?.full_name || user?.full_name || "Vendedor";
  const userAvatar = profile?.avatar_url || null;
  const userInitials = userFullName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const hora = moment().hour();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const melhorMes = historico.length > 0 ? Math.max(...historico.map(h => h.comissao)) : 0;
  const comissaoAtual = calcResult?.comissao || 0;
  const premiacoesAtual = calcResult?.premiacoesTotal || 0;
  const comissaoEstimada = comissaoAtual + premiacoesAtual + (calcResult?.bonificacoesConfirmadas || 0);

  // Card milestone: próximo marco (premiação ou faixa)
  let marcoVeiculosFaltam = 0;
  let marcoValorProjetado = 0;
  let marcoPercentual = 0;
  const qtdAtual = calcResult?.qtdVendas || 0;

  if (calcResult?.proximaPremiacao) {
    const faltam = (calcResult.proximaPremiacao.quantidade_vendas_necessarias || 0) - qtdAtual;
    const qtdMarco = calcResult.proximaPremiacao.quantidade_vendas_necessarias || 0;
    const valorTotalProj = (calcResult.valorTotalVendido || 0) + (calcResult.ticketMedio || 0) * faltam;
    const comissaoMarco = calcularComissaoPorFaixa(calcResult.politica, faixas, qtdMarco, valorTotalProj) ||
      calcularComissaoSimples(calcResult.politica, qtdMarco, valorTotalProj);
    const premMarco = calcularPremiacoes(premiacoes, calcResult.politica?.id, qtdMarco);
    marcoVeiculosFaltam = Math.max(0, faltam);
    marcoValorProjetado = comissaoMarco + premMarco.total;
    marcoPercentual = Math.min(100, Math.round((qtdAtual / (qtdMarco || 1)) * 100));
  } else if (calcResult?.proximaFaixa) {
    marcoVeiculosFaltam = calcResult.proxSaltoVendas || 1;
    marcoValorProjetado = calcResult.comissaoProxSalto || 0;
    marcoPercentual = calcResult.proximaFaixa
      ? Math.min(100, Math.round((qtdAtual / ((calcResult.proximaFaixa.quantidade_inicial || 1))) * 100))
      : 0;
  } else if (qtdAtual > 0) {
    marcoVeiculosFaltam = 1;
    const novaComissao = calcularComissaoPorFaixa(calcResult?.politica, faixas, qtdAtual + 1, (calcResult?.valorTotalVendido || 0) + (calcResult?.ticketMedio || 0)) ||
      calcularComissaoSimples(calcResult?.politica, qtdAtual + 1, (calcResult?.valorTotalVendido || 0) + (calcResult?.ticketMedio || 0));
    marcoValorProjetado = novaComissao;
    marcoPercentual = 50;
  }

  // Potencial com oportunidades
  const qtdOport = calcResult?.qtdOportunidades || 0;
  const comissaoPotencial = comissaoEstimada + (calcResult?.comissaoPotencialOport || 0);
  const ganhoPotencial = comissaoPotencial - comissaoEstimada;

  if (loading) {
    return (
      <div className="-m-6 lg:-m-8 min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#030B14" }}>
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Calculando sua comissão do mês...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-m-6 lg:-m-8 min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#030B14" }}>
        <p className="text-slate-400 font-medium">{error}</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="pb-10 -m-6 lg:-m-8 min-h-screen" style={{ background: "#030B14" }}>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-5">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {saudacao}, {userName}! 🚀
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Foque no que importa. Venda mais e ganhe mais.</p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodFilter
              value={period} onChange={setPeriod}
              customStart={customStart} customEnd={customEnd}
              onCustomStart={setCustomStart} onCustomEnd={setCustomEnd}
              dark
            />
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              {userAvatar ? (
                <img src={userAvatar} alt={userFullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{userInitials}</div>
              )}
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium leading-tight">{userFullName.split(" ")[0]} {userFullName.split(" ").slice(-1)[0]}</p>
                <p className="text-slate-400 text-xs">Vendedor</p>
              </div>
            </div>
          </div>
        </div>

        {/* HERO */}
        <CommissionHeroCard
          comissaoEstimada={comissaoEstimada}
          qtdVendas={qtdAtual}
          onVerCalculo={() => setShowCalcDrawer(true)}
          semPolitica={!calcResult?.politica}
        />

        {/* ROW 2: Milestone + Hot Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MilestoneCard
            veiculosFaltam={marcoVeiculosFaltam}
            valorProjetado={marcoValorProjetado}
            percentual={marcoPercentual}
            semDados={qtdAtual === 0 && !calcResult?.politica}
          />
          <HotOpportunitiesCard
            qtdOportunidades={qtdOport}
            comissaoPotencial={calcResult?.comissaoPotencialOport || 0}
          />
        </div>

        {/* ROW 3: Performance + Potential */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PerformanceCard
            melhorMes={melhorMes}
            comissaoAtual={comissaoEstimada}
          />
          <PotentialCommissionCard
            comissaoProjetada={comissaoPotencial}
            ganhoPotencial={ganhoPotencial}
          />
        </div>

        {/* ROW 4: Last 6 months + Record */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LastSixMonthsCard historico={historico} />
          <RecordRoutineCard melhorMes={melhorMes} />
        </div>

        {/* FOOTER */}
        <div className="text-center pt-4 pb-2">
          <p className="text-slate-500 text-sm">
            <span className="text-emerald-500">⚡</span> Disciplina hoje, liberdade amanhã. Você no controle dos seus resultados.
          </p>
        </div>
      </div>

      {/* Calculation Drawer */}
      <CalculationDetailsDrawer
        open={showCalcDrawer}
        onClose={() => setShowCalcDrawer(false)}
        calcResult={calcResult}
        period={{ start, end }}
        vendas={todaCarteira.filter(c => {
          if (!isVendaElegivel(c)) return false;
          const dataRef = c.data_venda || c._data_competencia_fechamento || c.updated_date || c.created_date;
          if (!dataRef) return true;
          return moment(dataRef).isBetween(start, end, "day", "[]");
        })}
        bonificacoes={bonificacoes}
      />
    </div>
  );
}