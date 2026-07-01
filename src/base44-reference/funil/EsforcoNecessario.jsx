import React from "react";

function ceil(n) { return Math.ceil(n); }
function pct(a, b) { return b > 0 ? a / b : 0; }
function fmtPct(v) { return `${Math.round(v * 100)}%`; }

// Verifica se há base suficiente
function baseSufShowroom(f) { return f.atendimento >= 5 || f.venda >= 1; }
function baseSufInternet(f) { return f.oportunidades >= 5 && f.atendimento >= 1; }
function baseSufCarteira(f) { return f.qualificados >= 5 && f.atendimento >= 1; }

function EsforcoCard({ titulo, cor, children }) {
  const COR = {
    orange: "border-orange-200 bg-orange-50",
    blue:   "border-blue-200 bg-blue-50",
    green:  "border-green-200 bg-green-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${COR[cor] || "border-slate-200 bg-white"}`}>
      <p className="text-[12px] font-black text-[#0F172A] uppercase tracking-wide mb-3">{titulo}</p>
      {children}
    </div>
  );
}

function Linha({ label, valor, destaque }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/60 last:border-0">
      <span className="text-[12px] text-slate-600">{label}</span>
      <span className={`text-[14px] font-black tabular-nums ${destaque ? "text-[#0F172A]" : "text-slate-500"}`}>{valor}</span>
    </div>
  );
}

function SemBase({ texto }) {
  return <p className="text-[12px] text-slate-400 italic">{texto}</p>;
}

export default function EsforcoNecessario({ funis, faltam, funisBase90, usou90 }) {
  if (faltam <= 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Esforço necessário para bater a meta</p>
        <p className="text-[14px] font-bold text-green-600">Meta batida. Continue mantendo o ritmo.</p>
      </div>
    );
  }

  // Escolhe fonte: período ou 90 dias
  const fs = usou90 ? funisBase90 : funis;
  const show = fs?.showroom || funis.showroom;
  const inet = fs?.internet || funis.internet;
  const cart = fs?.carteira || funis.carteira;

  // Showroom
  const convShow = pct(show.venda, show.atendimento);
  const showOk = baseSufShowroom(show) && convShow > 0;
  const showAtendNec = showOk ? ceil(faltam / convShow) : null;

  // Internet
  const convInetVenda  = pct(inet.venda, inet.atendimento);
  const convInetAtend  = pct(inet.atendimento, inet.agendamento);
  const convInetAgend  = pct(inet.agendamento, inet.qualificados);
  const convInetQual   = pct(inet.qualificados, inet.oportunidades);
  const inetOk = baseSufInternet(inet) && convInetVenda > 0 && convInetAtend > 0 && convInetAgend > 0 && convInetQual > 0;
  let inetAtendNec, inetAgendNec, inetQualNec, inetOppNec;
  if (inetOk) {
    inetAtendNec = ceil(faltam / convInetVenda);
    inetAgendNec = ceil(inetAtendNec / convInetAtend);
    inetQualNec  = ceil(inetAgendNec / convInetAgend);
    inetOppNec   = ceil(inetQualNec / convInetQual);
  }

  // Carteira
  const convCartVenda = pct(cart.venda, cart.atendimento);
  const convCartAtend = pct(cart.atendimento, cart.agendamento);
  const convCartAgend = pct(cart.agendamento, cart.qualificados);
  const cartOk = baseSufCarteira(cart) && convCartVenda > 0 && convCartAtend > 0 && convCartAgend > 0;
  let cartAtendNec, cartAgendNec, cartQualNec;
  if (cartOk) {
    cartAtendNec = ceil(faltam / convCartVenda);
    cartAgendNec = ceil(cartAtendNec / convCartAtend);
    cartQualNec  = ceil(cartAgendNec / convCartAgend);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Esforço necessário para bater a meta</p>
      <p className="text-[12px] text-slate-400 mb-4">Com base na sua conversão atual, esta é a produção necessária para buscar as {faltam} venda{faltam !== 1 ? "s" : ""} que faltam.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Showroom */}
        <EsforcoCard titulo="Showroom" cor="orange">
          {showOk ? (
            <>
              <p className="text-[11px] text-slate-500 mb-2">Para buscar as vendas que faltam, você precisa de aproximadamente:</p>
              <Linha label="Atendimentos Comerciais" valor={showAtendNec} destaque />
              <Linha label="Conversão atual" valor={fmtPct(convShow)} />
            </>
          ) : (
            <SemBase texto="Sem base suficiente para calcular o esforço no Showroom." />
          )}
        </EsforcoCard>

        {/* Internet */}
        <EsforcoCard titulo="Internet" cor="blue">
          {inetOk ? (
            <>
              <p className="text-[11px] text-slate-500 mb-2">Para buscar as vendas que faltam, você precisa gerar aproximadamente:</p>
              <Linha label="Atendimentos Comerciais" valor={inetAtendNec} destaque />
              <Linha label="Agendamentos" valor={inetAgendNec} />
              <Linha label="Qualificados" valor={inetQualNec} />
              <Linha label="Oportunidades" valor={inetOppNec} />
              <Linha label="Conversão geral" valor={fmtPct(pct(inet.venda, inet.oportunidades))} />
            </>
          ) : (
            <SemBase texto="Sem base suficiente para calcular uma projeção confiável neste canal." />
          )}
        </EsforcoCard>

        {/* Carteira */}
        <EsforcoCard titulo="Carteira" cor="green">
          {cartOk ? (
            <>
              <p className="text-[11px] text-slate-500 mb-2">Para buscar as vendas que faltam, você precisa gerar aproximadamente:</p>
              <Linha label="Atendimentos Comerciais" valor={cartAtendNec} destaque />
              <Linha label="Agendamentos" valor={cartAgendNec} />
              <Linha label="Qualificados" valor={cartQualNec} />
              <Linha label="Conversão geral" valor={fmtPct(pct(cart.venda, cart.qualificados))} />
            </>
          ) : (
            <SemBase texto="Sem base suficiente para calcular uma projeção confiável neste canal." />
          )}
        </EsforcoCard>
      </div>
    </div>
  );
}