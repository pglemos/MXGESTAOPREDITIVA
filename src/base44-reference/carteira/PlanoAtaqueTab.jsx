import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Users, Zap, ArrowLeft } from "lucide-react";
import { MISSOES, prioridadeColor } from "./carteiraUtils";

function CardMissao({ missao, clientes, onClick }) {
  const count = clientes.filter(missao.filtro).length;
  return (
    <button onClick={() => count > 0 && onClick(missao)}
      className={`text-left p-4 rounded-2xl border bg-white transition-all ${count > 0 ? "hover:border-[#00A89D] hover:shadow-sm cursor-pointer" : "opacity-50 cursor-not-allowed"} border-[#DFE0E1]`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-2xl">{missao.icone}</span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${prioridadeColor(missao.prioridade)}`}>{missao.prioridade}</span>
      </div>
      <p className="text-sm font-bold text-[#102C37] leading-tight">{missao.nome}</p>
      <p className="text-xs text-[#526B7A] mt-1">{missao.objetivo}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#526B7A]" />
          <span className="text-xs font-bold text-[#526B7A]">{count} cliente{count !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-xs text-[#00A89D] font-semibold">{missao.potencial}</span>
      </div>
    </button>
  );
}

function DetalhesMissao({ missao, clientes, perfil, onIniciar, onVoltar }) {
  const clientesMissao = clientes.filter(missao.filtro);
  return (
    <div className="space-y-6">
      <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-[#00A89D] hover:underline">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Plano de Ataque
      </button>

      <div className="bg-white border border-[#DFE0E1] rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{missao.icone}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-[#102C37]">{missao.nome}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${prioridadeColor(missao.prioridade)}`}>{missao.prioridade}</span>
            </div>
            <p className="text-sm text-[#526B7A] mt-1">{missao.objetivo}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#F7F8F8]">
          <div className="text-center">
            <p className="text-2xl font-black text-[#102C37]">{clientesMissao.length}</p>
            <p className="text-xs text-[#526B7A]">Clientes</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#00A89D]">{missao.potencial}</p>
            <p className="text-xs text-[#526B7A]">Potencial</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#526B7A]">{missao.prioridade}</p>
            <p className="text-xs text-[#526B7A]">Prioridade</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-black text-[#526B7A] uppercase tracking-wider mb-3">Clientes da missão</p>
        <div className="space-y-2">
          {clientesMissao.map(c => (
            <div key={c.id} className="bg-white border border-[#DFE0E1] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E8F3F2] flex items-center justify-center text-xs font-black text-[#00A89D] shrink-0">
                {(c.nome || "?").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#102C37] truncate">{c.nome}</p>
                <p className="text-xs text-[#526B7A]">{c.momento}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.temperatura === "Quente" ? "bg-[#FEECEC] text-[#EF4343]" : c.temperatura === "Morno" ? "bg-[#FFF7E6] text-[#F59F0A]" : "bg-[#DFE0E1] text-[#526B7A]"}`}>
                {c.temperatura}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => onIniciar(missao, clientesMissao)}
        disabled={clientesMissao.length === 0}
        className="w-full rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white gap-2 h-12 text-base font-bold">
        <Zap className="w-5 h-5" /> Iniciar missão
      </Button>
    </div>
  );
}

export default function PlanoAtaqueTab({ clientes, perfil, onIniciarMissao, missaoAtiva }) {
  const [missaoSelecionada, setMissaoSelecionada] = useState(null);

  const nomeVendedor = perfil?.full_name?.split(" ")[0] || "Vendedor";
  const totalOpcs = useMemo(() => MISSOES.reduce((acc, m) => acc + clientes.filter(m.filtro).length, 0), [clientes]);

  if (missaoSelecionada) {
    return (
      <DetalhesMissao
        missao={missaoSelecionada}
        clientes={clientes}
        perfil={perfil}
        onIniciar={(missao, clientesMissao) => { setMissaoSelecionada(null); onIniciarMissao(missao, clientesMissao); }}
        onVoltar={() => setMissaoSelecionada(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#102C37]">Plano de Ataque</h1>
        <p className="text-sm text-[#526B7A] mt-1">Escolha uma missão e trabalhe grupos de clientes com alto potencial de venda.</p>
      </div>

      {/* Mensagem personalizada */}
      <div className="bg-gradient-to-r from-[#00A89D] to-[#00A89D] rounded-2xl p-5 text-white">
        <p className="text-base font-bold leading-snug">
          Olá, {nomeVendedor}! Hoje existem <span className="text-[#E0EBEA] font-black">{totalOpcs} oportunidades</span> na sua carteira.
        </p>
        <p className="text-sm text-[#E0EBEA] mt-1">Comece pelas que possuem maior probabilidade de virar venda.</p>

        {missaoAtiva && (
          <div className="mt-3 bg-white/10 rounded-xl p-3">
            <p className="text-xs text-[#E0EBEA] font-semibold uppercase tracking-wide">Missão em andamento</p>
            <p className="text-sm font-bold">{missaoAtiva.tipo_missao}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-[#E0EBEA]">{missaoAtiva.mensagens_enviadas}/{missaoAtiva.total_clientes} enviados</span>
              <div className="flex-1 bg-white/20 rounded-full h-1.5">
                <div className="bg-white rounded-full h-1.5" style={{ width: `${missaoAtiva.total_clientes > 0 ? (missaoAtiva.mensagens_enviadas / missaoAtiva.total_clientes) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Missões */}
      <div>
        <p className="text-xs font-black text-[#526B7A] uppercase tracking-wider mb-3">Missões recomendadas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MISSOES.map(m => (
            <CardMissao key={m.id} missao={m} clientes={clientes} onClick={setMissaoSelecionada} />
          ))}
        </div>
      </div>
    </div>
  );
}