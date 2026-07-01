import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Target, TrendingUp } from "lucide-react";
import moment from "moment/min/moment-with-locales";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import EficienciaCanal from "@/components/funil/EficienciaCanal";
import EsforcoNecessario from "@/components/funil/EsforcoNecessario";
import ProjecaoMes from "@/components/funil/ProjecaoMes";
import BaseEstatistica from "@/components/funil/BaseEstatistica";

moment.locale("pt-br");

// ── Período helper ────────────────────────────────────────────────────────────

function getPeriodo(filtro) {
  const hoje = moment();
  switch (filtro) {
    case "mes_atual":
      return { inicio: hoje.clone().startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().endOf("month").format("YYYY-MM-DD") };
    case "mes_passado": {
      const m = hoje.clone().subtract(1, "month");
      return { inicio: m.startOf("month").format("YYYY-MM-DD"), fim: m.endOf("month").format("YYYY-MM-DD") };
    }
    case "tres_meses":
      return { inicio: hoje.clone().subtract(2, "months").startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().endOf("month").format("YYYY-MM-DD") };
    default:
      return { inicio: hoje.clone().startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().endOf("month").format("YYYY-MM-DD") };
  }
}

function diasUteisRestantes() {
  const hoje = moment();
  const fim = hoje.clone().endOf("month");
  let count = 0;
  let d = hoje.clone();
  while (d.isSameOrBefore(fim, "day")) {
    if (d.day() !== 0) count++;
    d.add(1, "day");
  }
  return count;
}

function diasUteisPassados() {
  const hoje = moment();
  const inicio = hoje.clone().startOf("month");
  let count = 0;
  let d = inicio.clone();
  while (d.isBefore(hoje, "day")) {
    if (d.day() !== 0) count++;
    d.add(1, "day");
  }
  return count;
}

// ── Filtrar eventos por período + canal + tipo ────────────────────────────────

function filtrarEventos(eventos, tipo, canal, inicio, fim) {
  return eventos.filter(e =>
    e.tipo_evento === tipo &&
    e.canal_mx === canal &&
    e.data_evento >= inicio &&
    e.data_evento <= fim
  );
}

function agruparModalidades(eventos) {
  const map = {};
  eventos.forEach(e => {
    const m = e.modalidade || "";
    if (m) map[m] = (map[m] || 0) + 1;
  });
  return Object.entries(map).map(([label, value]) => ({ label, value })).filter(m => m.value > 0);
}

// ── Normalizar canal MX ──────────────────────────────────────────────────────

function normalizarCanal(c) {
  const raw = c.canal_comercial || c.canal_entrada || c.canal_origem || "Carteira";
  if (raw === "Internet") return "Internet";
  if (raw === "Carteira") return "Carteira";
  if (raw === "Indicação") return "Carteira";
  return "Showroom";
}

function dataCadastro(c) {
  if (c.data_cadastro_mx) return c.data_cadastro_mx.slice(0, 10);
  if (c.created_date) return c.created_date.slice(0, 10);
  return null;
}

function clientesNoPeriodo(clientes, canal, inicio, fim, vendedorId) {
  return clientes.filter(c => {
    if (normalizarCanal(c) !== canal) return false;
    if (vendedorId && c.vendedor_id && c.vendedor_id !== vendedorId) return false;
    const inativo = c.status_oportunidade === "Inativa" || c.status_oportunidade === "Encerrada";
    const vendido = c.vendido || c.status_comercial === "Vendido" || c.situacao_atual === "Venda realizada";
    if (inativo && !vendido) return false;
    const dc = dataCadastro(c);
    if (!dc) return true;
    return dc >= inicio && dc <= fim;
  });
}

function clientesComAgendamento(clientes, canal, inicio, fim, vendedorId) {
  return clientes.filter(c => {
    if (normalizarCanal(c) !== canal) return false;
    if (vendedorId && c.vendedor_id && c.vendedor_id !== vendedorId) return false;
    const temAgend =
      c.visita_agendada_em ||
      c.status_comercial === "Agendado" ||
      (c.situacao_atual || "").toLowerCase().includes("agend");
    if (!temAgend) return false;
    const dataRef = c.visita_agendada_em ? c.visita_agendada_em.slice(0, 10) : dataCadastro(c);
    if (!dataRef) return true;
    return dataRef >= inicio && dataRef <= fim;
  });
}

function clientesComAtendimento(clientes, canal, inicio, fim, vendedorId) {
  return clientes.filter(c => {
    if (normalizarCanal(c) !== canal) return false;
    if (vendedorId && c.vendedor_id && c.vendedor_id !== vendedorId) return false;
    const sit = c.situacao_atual || "";
    const temAtend =
      sit === "Visita realizada" ||
      sit === "Em negociação ativa" ||
      sit === "Proposta enviada" ||
      sit === "Financiamento em análise" ||
      sit === "Financiamento aprovado sem compra" ||
      sit === "Venda realizada" ||
      sit === "Vai pensar" ||
      c.status_comercial === "Vendido";
    if (!temAtend) return false;
    const dataRef = c.visita_agendada_em ? c.visita_agendada_em.slice(0, 10) : dataCadastro(c);
    if (!dataRef) return true;
    return dataRef >= inicio && dataRef <= fim;
  });
}

function vendasBackup(clientes, canal, inicio, fim, eventoVendaIds) {
  return clientes.filter(c => {
    if (normalizarCanal(c) !== canal) return false;
    const isVendido = c.vendido || c.status_comercial === "Vendido" || c.situacao_atual === "Venda realizada";
    if (!isVendido) return false;
    if (eventoVendaIds.has(c.id)) return false;
    const dataRef = c.data_venda || dataCadastro(c);
    if (!dataRef) return true;
    return dataRef >= inicio && dataRef <= fim;
  }).length;
}

// ── Cálculo do funil para um período ─────────────────────────────────────────

function calcFunis(eventos, clientes, inicio, fim, vid) {
  const evIdsQual  = new Set([
    ...filtrarEventos(eventos, "cliente_qualificado", "Internet", inicio, fim).map(e => e.cliente_id),
    ...filtrarEventos(eventos, "cliente_qualificado", "Carteira", inicio, fim).map(e => e.cliente_id),
  ]);
  const evIdsAgend = new Set([
    ...filtrarEventos(eventos, "agendamento_criado", "Internet", inicio, fim).map(e => e.cliente_id),
    ...filtrarEventos(eventos, "agendamento_criado", "Carteira", inicio, fim).map(e => e.cliente_id),
  ]);
  const evIdsAtend = new Set([
    ...filtrarEventos(eventos, "atendimento_comercial_realizado", "Internet", inicio, fim).map(e => e.cliente_id),
    ...filtrarEventos(eventos, "atendimento_comercial_realizado", "Carteira", inicio, fim).map(e => e.cliente_id),
    ...filtrarEventos(eventos, "atendimento_comercial_realizado", "Showroom", inicio, fim).map(e => e.cliente_id),
  ]);

  // SHOWROOM
  const showAtendEvts = filtrarEventos(eventos, "atendimento_comercial_realizado", "Showroom", inicio, fim);
  const showVendaEvts = filtrarEventos(eventos, "venda_realizada", "Showroom", inicio, fim);
  const showVendaIds  = new Set(showVendaEvts.map(e => e.cliente_id));
  const showroom = {
    atendimento: showAtendEvts.length + clientesComAtendimento(clientes, "Showroom", inicio, fim, vid).filter(c => !evIdsAtend.has(c.id)).length,
    atendimentoModal: agruparModalidades(showAtendEvts),
    venda: showVendaEvts.length + vendasBackup(clientes, "Showroom", inicio, fim, showVendaIds),
  };

  // INTERNET
  const inetOppEvts   = filtrarEventos(eventos, "oportunidade_registrada",             "Internet", inicio, fim);
  const inetQualEvts  = filtrarEventos(eventos, "cliente_qualificado",                 "Internet", inicio, fim);
  const inetAgendEvts = filtrarEventos(eventos, "agendamento_criado",                  "Internet", inicio, fim);
  const inetAtendEvts = filtrarEventos(eventos, "atendimento_comercial_realizado",     "Internet", inicio, fim);
  const inetVendaEvts = filtrarEventos(eventos, "venda_realizada",                     "Internet", inicio, fim);
  const inetVendaIds  = new Set(inetVendaEvts.map(e => e.cliente_id));
  const inetClientesPeriodo = clientesNoPeriodo(clientes, "Internet", inicio, fim, vid);
  const inetQualFallback  = inetClientesPeriodo.filter(c => !evIdsQual.has(c.id)).length;
  const inetAgendFallback = clientesComAgendamento(clientes, "Internet", inicio, fim, vid).filter(c => !evIdsAgend.has(c.id)).length;
  const inetAtendFallback = clientesComAtendimento(clientes, "Internet", inicio, fim, vid).filter(c => !evIdsAtend.has(c.id)).length;
  const inetQualTotal = inetQualEvts.length + inetQualFallback;
  const internet = {
    oportunidades: Math.max(inetOppEvts.length, inetQualTotal),
    qualificados:  inetQualTotal,
    agendamento:   inetAgendEvts.length + inetAgendFallback,
    agendamentoModal: agruparModalidades(inetAgendEvts),
    atendimento:   inetAtendEvts.length + inetAtendFallback,
    atendimentoModal: agruparModalidades(inetAtendEvts),
    venda:         inetVendaEvts.length + vendasBackup(clientes, "Internet", inicio, fim, inetVendaIds),
  };

  // CARTEIRA
  const cartQualEvts  = filtrarEventos(eventos, "cliente_qualificado",                 "Carteira", inicio, fim);
  const cartAgendEvts = filtrarEventos(eventos, "agendamento_criado",                  "Carteira", inicio, fim);
  const cartAtendEvts = filtrarEventos(eventos, "atendimento_comercial_realizado",     "Carteira", inicio, fim);
  const cartVendaEvts = filtrarEventos(eventos, "venda_realizada",                     "Carteira", inicio, fim);
  const cartVendaIds  = new Set(cartVendaEvts.map(e => e.cliente_id));
  const cartClientesPeriodo = clientesNoPeriodo(clientes, "Carteira", inicio, fim, vid);
  const cartQualFallback  = cartClientesPeriodo.filter(c => !evIdsQual.has(c.id)).length;
  const cartAgendFallback = clientesComAgendamento(clientes, "Carteira", inicio, fim, vid).filter(c => !evIdsAgend.has(c.id)).length;
  const cartAtendFallback = clientesComAtendimento(clientes, "Carteira", inicio, fim, vid).filter(c => !evIdsAtend.has(c.id)).length;
  const carteira = {
    qualificados: cartQualEvts.length + cartQualFallback,
    agendamento:  cartAgendEvts.length + cartAgendFallback,
    agendamentoModal: agruparModalidades(cartAgendEvts),
    atendimento:  cartAtendEvts.length + cartAtendFallback,
    atendimentoModal: agruparModalidades(cartAtendEvts),
    venda:        cartVendaEvts.length + vendasBackup(clientes, "Carteira", inicio, fim, cartVendaIds),
  };

  return { showroom, internet, carteira };
}

// ── Gráfico dos últimos 6 meses ───────────────────────────────────────────────

function buildChartData(eventos, clientes) {
  return Array.from({ length: 6 }, (_, i) => {
    const m   = moment().subtract(5 - i, "months");
    const ini = m.clone().startOf("month").format("YYYY-MM-DD");
    const fim = m.clone().endOf("month").format("YYYY-MM-DD");
    const evtQualIds = new Set(
      eventos.filter(e => (e.tipo_evento === "oportunidade_registrada" || e.tipo_evento === "cliente_qualificado") && e.data_evento >= ini && e.data_evento <= fim).map(e => e.cliente_id || e.id)
    );
    const clientesFallbackOpp = clientes.filter(c => { const dc = dataCadastro(c); return dc && dc >= ini && dc <= fim && !evtQualIds.has(c.id); }).length;
    const vendaEvts = eventos.filter(e => e.tipo_evento === "venda_realizada" && e.data_evento >= ini && e.data_evento <= fim);
    const vendaIds  = new Set(vendaEvts.map(e => e.cliente_id));
    const vendaBack = clientes.filter(c => {
      const v = c.vendido || c.status_comercial === "Vendido" || c.situacao_atual === "Venda realizada";
      if (!v || vendaIds.has(c.id)) return false;
      const d = c.data_venda || dataCadastro(c);
      return d && d >= ini && d <= fim;
    }).length;
    return {
      label: m.format("MMM/YY"),
      oportunidades: evtQualIds.size + clientesFallbackOpp,
      atendimento: eventos.filter(e => e.tipo_evento === "atendimento_comercial_realizado" && e.data_evento >= ini && e.data_evento <= fim).length,
      vendas: vendaEvts.length + vendaBack,
    };
  });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ titulo, valor, subtitulo, cor }) {
  const corMap = { blue: "text-[#005BFF]", green: "text-[#22C55E]", red: "text-[#EF4444]", amber: "text-[#F59E0B]", slate: "text-slate-500" };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{titulo}</p>
      <p className={`text-[28px] font-black tabular-nums leading-none ${corMap[cor] || "text-[#0F172A]"}`}>{valor}</p>
      {subtitulo && <p className="text-[12px] text-slate-400 mt-1">{subtitulo}</p>}
    </div>
  );
}

const FILTROS = [
  { value: "mes_atual",   label: "Este mês" },
  { value: "mes_passado", label: "Mês passado" },
  { value: "tres_meses",  label: "Últimos 3 meses" },
];

// ── Base suficiente por canal (para confiança) ────────────────────────────────

function calcConfianca(funis, funis90) {
  const showOk = funis.showroom.atendimento >= 5 || funis.showroom.venda >= 1;
  const inetOk = funis.internet.oportunidades >= 5 && funis.internet.atendimento >= 1;
  const cartOk = funis.carteira.qualificados  >= 5 && funis.carteira.atendimento  >= 1;
  if (showOk || inetOk || cartOk) return "Alta";
  const s90Ok = funis90.showroom.atendimento >= 5 || funis90.showroom.venda >= 1;
  const i90Ok = funis90.internet.oportunidades >= 5 && funis90.internet.atendimento >= 1;
  const c90Ok = funis90.carteira.qualificados  >= 5 && funis90.carteira.atendimento  >= 1;
  if (s90Ok || i90Ok || c90Ok) return "Média";
  return "Baixa";
}

// ── Componente Principal ──────────────────────────────────────────────────────

export default function FunilVendas() {
  const [filtro, setFiltro] = useState("mes_atual");
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const periodo = getPeriodo(filtro);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.UserProfile.list().catch(() => []),
    ]).then(async ([usuario, profiles]) => {
      setMe(usuario);
      setProfile(profiles[0] || null);
      if (usuario) {
        const [evs, clis] = await Promise.all([
          base44.entities.EventoComercial.filter({ vendedor_id: usuario.id }, "-data_evento", 500).catch(() => []),
          base44.entities.CarteiraCliente.filter({ vendedor_id: usuario.id, ativo: true }, "-created_date", 500).catch(() => []),
        ]);
        setEventos(evs);
        setClientes(clis);
      }
      setLoading(false);
    });
  }, []);

  const { inicio, fim } = periodo;

  // Período de 90 dias para fallback estatístico
  const inicio90 = useMemo(() => moment().subtract(90, "days").format("YYYY-MM-DD"), []);
  const fim90    = useMemo(() => moment().format("YYYY-MM-DD"), []);

  const funis = useMemo(() => calcFunis(eventos, clientes, inicio, fim, me?.id || null), [eventos, clientes, inicio, fim, me]);
  const funis90 = useMemo(() => calcFunis(eventos, clientes, inicio90, fim90, me?.id || null), [eventos, clientes, inicio90, fim90, me]);

  // Verificar se o período tem base suficiente; se não, usar 90 dias para esforço
  const baseSufPeriodo =
    funis.showroom.atendimento >= 5 || funis.showroom.venda >= 1 ||
    funis.internet.oportunidades >= 5 ||
    funis.carteira.qualificados >= 5;
  const usou90 = !baseSufPeriodo;
  const confianca = calcConfianca(funis, funis90);

  // ── Indicadores ──────────────────────────────────────────────────────────

  const indicadores = useMemo(() => {
    const meta = profile?.monthly_goal || null;
    const realizadoSimples = funis.showroom.venda + funis.internet.venda + funis.carteira.venda;
    const faltam = meta ? Math.max(0, meta - realizadoSimples) : null;
    const diasRestantes = filtro === "mes_atual" ? diasUteisRestantes() : null;
    const diasPassados  = filtro === "mes_atual" ? diasUteisPassados()  : null;
    const mediaDia   = diasPassados > 0 ? realizadoSimples / diasPassados : 0;
    const projetadas = realizadoSimples + mediaDia * (diasRestantes || 0);
    const probabilidade = meta && meta > 0 ? Math.min(100, Math.round((projetadas / meta) * 100)) : null;
    const necessarioPorDia = faltam !== null && diasRestantes > 0 ? (faltam / diasRestantes).toFixed(2) : null;
    return { meta, realizado: realizadoSimples, faltam, diasRestantes, diasPassados, necessarioPorDia, probabilidade };
  }, [funis, filtro, profile]);

  const chartData = useMemo(() => buildChartData(eventos, clientes), [eventos, clientes]);
  const temDado   = eventos.length > 0 || clientes.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      {/* Topbar + Filtro */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 h-[64px] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#005BFF]" />
          <h1 className="text-[18px] sm:text-[22px] font-black text-[#0F172A] uppercase tracking-tight">Funil de Vendas</h1>
        </div>
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                filtro === f.value ? "bg-white text-[#0F172A] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">

        {/* BLOCO 2 — Indicadores da meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {indicadores.meta ? (
            <KpiCard titulo="Meta do mês" valor={indicadores.meta} subtitulo="unidades" cor="blue" />
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm p-5 flex flex-col items-center justify-center text-center gap-1">
              <Target className="w-5 h-5 text-slate-300" />
              <p className="text-[11px] text-slate-400 font-semibold">Meta não configurada</p>
              <Link to="/perfil" className="text-[11px] font-bold text-[#005BFF] hover:underline">Definir meta</Link>
            </div>
          )}
          <KpiCard titulo="Realizado" valor={indicadores.realizado} subtitulo="no período" cor="green" />
          <KpiCard
            titulo="Faltam"
            valor={indicadores.faltam !== null ? (indicadores.faltam === 0 ? "✓" : indicadores.faltam) : "—"}
            subtitulo={indicadores.faltam === 0 ? "Meta batida!" : indicadores.faltam !== null ? "para a meta" : "Sem meta"}
            cor={indicadores.faltam === 0 ? "green" : "red"}
          />
          <KpiCard
            titulo="Dias úteis restantes"
            valor={filtro === "mes_atual" ? (indicadores.diasRestantes ?? "—") : "—"}
            subtitulo="seg–sab"
            cor="slate"
          />
          <KpiCard
            titulo="Necessário por dia"
            valor={indicadores.necessarioPorDia !== null && filtro === "mes_atual"
              ? (indicadores.faltam === 0 ? "Meta batida" : indicadores.necessarioPorDia)
              : "—"}
            subtitulo="vendas/dia útil"
            cor="amber"
          />
          <KpiCard
            titulo="Probabilidade de meta"
            valor={indicadores.probabilidade !== null ? `${indicadores.probabilidade}%` : "—"}
            subtitulo="com ritmo atual"
            cor={indicadores.probabilidade !== null ? (indicadores.probabilidade >= 80 ? "green" : indicadores.probabilidade >= 50 ? "amber" : "red") : "slate"}
          />
        </div>

        {/* Estado vazio */}
        {!temDado && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-[15px] font-bold text-[#0F172A] mb-1">Sem dados suficientes neste período.</p>
            <p className="text-[13px] text-slate-400 mb-4">Registre atendimentos na Carteira ou no Fechamento Diário para alimentar o Funil.</p>
            <Link to="/fechamento" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#005BFF] hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl transition-colors">
              Ver Fechamento Diário
            </Link>
          </div>
        )}

        {temDado && (
          <>
            {/* BLOCO 3 — Projeção do mês */}
            <ProjecaoMes indicadores={indicadores} filtro={filtro} />

            {/* BLOCO 4 — Esforço necessário */}
            <EsforcoNecessario
              funis={funis}
              faltam={indicadores.faltam ?? 0}
              funisBase90={funis90}
              usou90={usou90}
            />

            {/* BLOCO 5 — Eficiência por canal */}
            <EficienciaCanal funis={funis} />

            {/* BLOCO 6 — Gráfico 6 meses (apoio discreto) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evolução dos últimos 6 meses</p>
              {chartData.every(d => d.oportunidades === 0 && d.atendimento === 0 && d.vendas === 0) ? (
                <p className="text-center py-6 text-[12px] text-slate-300">Sem registros nos últimos 6 meses.</p>
              ) : (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="oportunidades"  name="Oportunidades"     stroke="#6D28D9" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="atendimento"    name="Atend. Comercial"  stroke="#005BFF" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="vendas"         name="Vendas"            stroke="#22C55E" strokeWidth={2}   dot={{ r: 2, fill: "#22C55E" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* BLOCO 7 — Base estatística */}
            <BaseEstatistica
              filtro={filtro}
              usou90={usou90}
              confianca={confianca}
              periodoCalculo={usou90 ? "Últimos 90 dias" : null}
            />
          </>
        )}

      </div>
    </div>
  );
}