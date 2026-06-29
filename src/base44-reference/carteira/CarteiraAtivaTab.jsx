import React, { useState, useMemo } from "react";
import { MessageCircle, FileText, ChevronRight, Search, Filter } from "lucide-react";
import moment from "moment";
import { calcularProximaAcao, tempColor, prioridadeColor } from "./carteiraUtils";

const CARDS_DIRECIONADORES = [
  { id: "agendar", label: "Agendar visita", desc: "Transforme interesse em compromisso.", filtro: c => c.temperatura === "Quente" && c.momento === "Cliente quente sem visita" },
  { id: "confirmar", label: "Confirmar visita", desc: "Garanta a presença do cliente.", filtro: c => c.momento === "Visita a confirmar" || (c.momento === "Visita agendada" && c.visita_agendada_em && moment(c.visita_agendada_em).diff(moment(), "days") <= 2) },
  { id: "mornos", label: "Aquecer mornos", desc: "Entenda o prazo e as barreiras.", filtro: c => c.temperatura === "Morno" || c.momento === "Cliente morno em aquecimento" },
  { id: "retomar", label: "Retomar contato", desc: "Reative clientes sem resposta.", filtro: c => c.temperatura === "Frio" || c.momento === "Cliente frio em nutrição" },
  { id: "propostas", label: "Propostas sem retorno", desc: "Recupere propostas abertas.", filtro: c => c.momento === "Proposta enviada" },
  { id: "todos", label: "Clientes ativos", desc: "Todos em desenvolvimento.", filtro: c => c.ativo },
];

function CardDirecionador({ card, clientes, ativo, onClick }) {
  const count = clientes.filter(card.filtro).length;
  return (
    <button onClick={() => onClick(card.id)}
      className={`text-left p-4 rounded-2xl border transition-all ${ativo ? "border-[#00A89D] bg-[#E8F3F2]" : "border-[#DFE0E1] bg-white hover:border-[#DFE0E1] hover:bg-[#F7F8F8]"}`}>
      <p className={`text-2xl font-black mb-0.5 ${ativo ? "text-[#00A89D]" : "text-[#102C37]"}`}>{count}</p>
      <p className={`text-sm font-bold ${ativo ? "text-[#00A89D]" : "text-[#071822]"}`}>{card.label}</p>
      <p className="text-xs text-[#526B7A] mt-0.5 leading-snug">{card.desc}</p>
    </button>
  );
}

function ClienteRow({ cliente, onWhatsApp, onFicha }) {
  const proxAcao = calcularProximaAcao(cliente);
  const tel = (cliente.whatsapp || "").replace(/\D/g, "");

  const prioridade = cliente.temperatura === "Quente" ? "Alta"
    : cliente.temperatura === "Morno" ? "Média" : "Baixa";

  return (
    <div className="bg-white border border-[#DFE0E1] rounded-2xl p-4 hover:border-[#E8F3F2] hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E8F3F2] flex items-center justify-center text-sm font-black text-[#00A89D] shrink-0">
          {(cliente.nome || "?").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#102C37] truncate">{cliente.nome}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tempColor(cliente.temperatura)}`}>{cliente.temperatura}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${prioridadeColor(prioridade)}`}>{prioridade}</span>
          </div>
          <p className="text-xs text-[#526B7A] mt-0.5">{cliente.canal_origem} · {cliente.veiculo_interesse || "Sem veículo"}</p>
          <div className="mt-2 bg-[#F7F8F8] rounded-xl px-3 py-2">
            <p className="text-[11px] text-[#526B7A] font-semibold uppercase tracking-wide">Momento</p>
            <p className="text-xs font-semibold text-[#526B7A] mt-0.5">{cliente.momento}</p>
          </div>
          <div className="mt-1.5 bg-[#E8F3F2] rounded-xl px-3 py-2">
            <p className="text-[11px] text-[#00A89D] font-semibold uppercase tracking-wide">Próximo passo</p>
            <p className="text-xs font-semibold text-[#102C37] mt-0.5">{proxAcao}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onWhatsApp(cliente)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#00A89D] border border-[#00A89D] hover:bg-[#E8F3F2] px-3 py-1.5 rounded-xl transition-colors flex-1 justify-center">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        <button onClick={() => onFicha(cliente.id)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#526B7A] border border-[#DFE0E1] hover:bg-[#F7F8F8] px-3 py-1.5 rounded-xl transition-colors flex-1 justify-center">
          <FileText className="w-3.5 h-3.5" /> Abrir ficha
        </button>
      </div>
    </div>
  );
}

export default function CarteiraAtivaTab({ clientes, onNovoCliente, onWhatsApp, onFicha, onResultadoAtualizado }) {
  const [filtroAtivo, setFiltroAtivo] = useState("todos");
  const [busca, setBusca] = useState("");

  const clientesAtivos = useMemo(() => clientes.filter(c => c.ativo !== false && c.momento !== "Venda realizada" && c.momento !== "Perda registrada"), [clientes]);

  const clientesFiltrados = useMemo(() => {
    const card = CARDS_DIRECIONADORES.find(c => c.id === filtroAtivo);
    let lista = card ? clientesAtivos.filter(card.filtro) : clientesAtivos;
    if (busca) lista = lista.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.whatsapp?.includes(busca));
    return lista.sort((a, b) => {
      const ord = { "Quente": 0, "Morno": 1, "Frio": 2 };
      return (ord[a.temperatura] || 2) - (ord[b.temperatura] || 2);
    });
  }, [clientesAtivos, filtroAtivo, busca]);

  return (
    <div className="space-y-6">
{/* Busca */}
<div className="flex items-center justify-between gap-4">
<div className="relative w-full max-w-sm">
<Search className="w-4 h-4 text-[#526B7A] absolute left-3 top-1/2 -translate-y-1/2" />
<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
className="h-10 w-full rounded-xl border border-[#DFE0E1] bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00A89D]" />
</div>
</div>

      {/* Cards direcionadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARDS_DIRECIONADORES.map(card => (
          <CardDirecionador key={card.id} card={card} clientes={clientesAtivos}
            ativo={filtroAtivo === card.id} onClick={setFiltroAtivo} />
        ))}
      </div>

      {/* Lista */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#526B7A]">{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}</p>
          {filtroAtivo !== "todos" && (
            <button onClick={() => setFiltroAtivo("todos")} className="text-xs text-[#00A89D] hover:underline">Ver todos</button>
          )}
        </div>
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white border border-[#DFE0E1] rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-semibold text-[#526B7A]">Nenhum cliente nesse filtro.</p>
            <p className="text-xs text-[#526B7A] mt-1">Adicione clientes ou mude o filtro acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {clientesFiltrados.map(c => (
              <ClienteRow key={c.id} cliente={c} onWhatsApp={onWhatsApp} onFicha={onFicha} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
