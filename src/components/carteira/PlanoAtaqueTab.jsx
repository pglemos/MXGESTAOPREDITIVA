import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Users, ArrowLeft, AlertTriangle } from "lucide-react";
import { MISSOES, prioridadeColor, calcularPrioridade } from "./carteiraUtils";
import { base44 } from "@/api/base44Client";
import VeiculosChegaram from "./VeiculosChegaram";

// ─── VERIFICAR BLOQUEIO DE MISSÃO ────────────────────────────────────────────
function useBloqueioMissao(missaoAtiva) {
  return useMemo(() => {
    if (!missaoAtiva) return null;

    const enviados = missaoAtiva.mensagens_enviadas || 0;
    const total = missaoAtiva.total_clientes || 0;
    const aguardandoVendedor = missaoAtiva.aguardando_sua_resposta || 0;
    const status = missaoAtiva.status || "";

    if (["Preparando", "Enviando mensagens"].includes(status) && enviados < total) {
      return {
        tipo: "envio_incompleto",
        msg: "Finalize o envio das mensagens da missão atual antes de iniciar uma nova.",
      };
    }
    if (aguardandoVendedor > 0) {
      return {
        tipo: "clientes_esperando",
        msg: `Você possui ${aguardandoVendedor} cliente${aguardandoVendedor !== 1 ? "s" : ""} que responderam e aguardam sua ação. Resolva esses retornos antes de iniciar uma nova missão.`,
      };
    }
    const criadaEm = missaoAtiva.iniciada_em ? new Date(missaoAtiva.iniciada_em) : null;
    const horasDesde = criadaEm ? (Date.now() - criadaEm.getTime()) / 3600000 : 0;
    if (horasDesde > 24 && ["Preparando", "Enviando mensagens"].includes(status)) {
      return {
        tipo: "pendente_24h",
        msg: "Antes de iniciar uma nova missão, registre o resultado dos contatos pendentes.",
      };
    }
    return null;
  }, [missaoAtiva]);
}

// ─── CARD DE MISSÃO ───────────────────────────────────────────────────────────
function CardMissao({ missao, count, onClick }) {
  return (
    <button onClick={() => count > 0 && onClick(missao)}
      className={`text-left p-4 rounded-2xl border bg-white transition-all ${count > 0 ? "hover:border-[#005BFF] hover:shadow-sm cursor-pointer" : "opacity-40 cursor-not-allowed"} border-slate-100`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-2xl">{missao.icone}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prioridadeColor(missao.prioridade)}`}>{missao.prioridade}</span>
      </div>
      <p className="text-sm font-bold text-[#031B3D] leading-tight">{missao.nome}</p>
      <p className="text-xs text-slate-400 mt-1 leading-snug">{missao.objetivo}</p>
      {missao.porqueAgora && (
        <p className="text-[10px] text-slate-300 mt-1 leading-snug italic">{missao.porqueAgora}</p>
      )}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{count} cliente{count !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-[11px] text-[#005BFF] font-semibold">{missao.potencial}</span>
      </div>
    </button>
  );
}

// ─── DETALHES DA MISSÃO ───────────────────────────────────────────────────────
function DetalhesMissao({ missao, clientes, onIniciar, onVoltar, bloqueio }) {
  const clientesMissao = clientes.filter(missao.filtro);
  const [iniciando, setIniciando] = useState(false);

  async function handleIniciar() {
    setIniciando(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const registro = await base44.entities.CarteiraMissao.create({
        vendedor_id: me?.id,
        tipo_missao: missao.nome,
        status: "Preparando",
        total_clientes: clientesMissao.length,
        clientes_ids: clientesMissao.map(c => c.id),
        mensagens_enviadas: 0,
        iniciada_em: new Date().toISOString(),
      });
      onIniciar(registro, clientesMissao);
    } catch (e) {
      console.error(e);
      setIniciando(false);
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-[#005BFF] hover:underline">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Plano de Ataque
      </button>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{missao.icone}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-[#031B3D]">{missao.nome}</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${prioridadeColor(missao.prioridade)}`}>{missao.prioridade}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{missao.objetivo}</p>
            {missao.porqueAgora && (
              <p className="text-xs text-slate-400 mt-1 italic">{missao.porqueAgora}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-50">
          <div className="text-center">
            <p className="text-2xl font-black text-[#031B3D]">{clientesMissao.length}</p>
            <p className="text-xs text-slate-400">Clientes</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#005BFF]">{missao.potencial}</p>
            <p className="text-xs text-slate-400">Potencial</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600">{missao.prioridade}</p>
            <p className="text-xs text-slate-400">Prioridade</p>
          </div>
        </div>
      </div>

      {/* Bloqueio */}
      {bloqueio && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{bloqueio.msg}</p>
        </div>
      )}

      {/* Clientes */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Clientes da missão</p>
        <div className="space-y-2">
          {clientesMissao.map(c => (
            <div key={c.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-black text-[#005BFF] shrink-0">
                {(c.nome || "?").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#031B3D] truncate">{c.nome}</p>
                <p className="text-xs text-slate-400">{c.situacao_atual || c.momento || "—"}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.temperatura === "Quente" ? "bg-red-50 text-red-600" : c.temperatura === "Morno" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                {c.temperatura || "Morno"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleIniciar}
        disabled={clientesMissao.length === 0 || !!bloqueio || iniciando}
        className="w-full rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white gap-2 h-12 text-base font-bold disabled:opacity-50"
      >
        <Zap className="w-5 h-5" /> {iniciando ? "Preparando missão..." : "Iniciar missão"}
      </Button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PlanoAtaqueTab({ clientes, perfil, onIniciarMissao, missaoAtiva, onWhatsApp, onFicha }) {
  const [missaoSelecionada, setMissaoSelecionada] = useState(null);
  const bloqueio = useBloqueioMissao(missaoAtiva);
  const nomeVendedor = perfil?.full_name?.split(" ")[0] || perfil?.full_name || "Vendedor";

  // Calcular missões com contagem
  const missoesComContagem = useMemo(() =>
    MISSOES.map(m => ({ ...m, count: clientes.filter(m.filtro).length })),
    [clientes]
  );

  const totalOportunidades = missoesComContagem.reduce((acc, m) => acc + m.count, 0);

  const missoesOrdenadas = [...missoesComContagem].sort((a, b) => {
    const ordP = { "Máxima": 0, "Alta": 1, "Média": 2, "Baixa": 3 };
    const pa = ordP[a.prioridade] ?? 3, pb = ordP[b.prioridade] ?? 3;
    if (pa !== pb) return pa - pb;
    return b.count - a.count;
  });

  if (missaoSelecionada) {
    return (
      <DetalhesMissao
        missao={missaoSelecionada}
        clientes={clientes}
        bloqueio={bloqueio}
        onIniciar={(missao, clientesMissao) => { setMissaoSelecionada(null); onIniciarMissao(missao, clientesMissao); }}
        onVoltar={() => setMissaoSelecionada(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#031B3D]">Plano de Ataque</h1>
        <p className="text-sm text-slate-400 mt-1">Missões calculadas a partir das situações reais da sua carteira.</p>
      </div>

      {/* Veículos que chegaram — primeira seção */}
      <div className="border border-slate-100 rounded-2xl p-5 bg-white">
        <VeiculosChegaram
          clientes={clientes}
          onExecutar={(c) => onWhatsApp && onWhatsApp(c, null)}
          onFicha={onFicha}
        />
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#005BFF] to-blue-600 rounded-2xl p-5 text-white">
        <p className="text-base font-bold leading-snug">
          Olá, {nomeVendedor}! Hoje existem <span className="text-blue-200 font-black">{totalOportunidades} oportunidades</span> na sua carteira.
        </p>
        <p className="text-sm text-blue-100 mt-1">Comece pelas missões com maior prioridade.</p>

        {missaoAtiva && (
          <div className="mt-3 bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-wide">Missão em andamento</p>
            <p className="text-sm font-bold">{missaoAtiva.tipo_missao}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-blue-200">{missaoAtiva.mensagens_enviadas}/{missaoAtiva.total_clientes} enviados</span>
              <div className="flex-1 bg-white/20 rounded-full h-1.5">
                <div className="bg-white rounded-full h-1.5" style={{
                  width: `${missaoAtiva.total_clientes > 0 ? (missaoAtiva.mensagens_enviadas / missaoAtiva.total_clientes) * 100 : 0}%`
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aviso de bloqueio */}
      {bloqueio && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Missão anterior pendente</p>
            <p className="text-sm text-amber-700 mt-0.5">{bloqueio.msg}</p>
          </div>
        </div>
      )}

      {/* Missões */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Missões recomendadas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {missoesOrdenadas.map(m => (
            <CardMissao key={m.id} missao={m} count={m.count} onClick={setMissaoSelecionada} />
          ))}
        </div>
      </div>
    </div>
  );
}