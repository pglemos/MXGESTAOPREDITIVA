import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Copy, Check, ChevronRight, SkipForward } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getScriptParaMissao, preencherScript, resultadoParaMomento, calcularProximaAcao, RESULTADOS } from "./carteiraUtils";

export default function ExecucaoMissao({ missao, clientes, onVoltar, onConcluida }) {
  const [indice, setIndice] = useState(0);
  const [enviados, setEnviados] = useState(0);
  const [pulados, setPulados] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [scriptEditado, setScriptEditado] = useState("");
  const [etapa, setEtapa] = useState("enviando"); // "enviando" | "resultado" | "resumo"
  const [resultado, setResultado] = useState("");
  const [salvando, setSalvando] = useState(false);

  const total = clientes.length;
  const clienteAtual = clientes[indice];
  const progresso = total > 0 ? Math.round(((enviados + pulados) / total) * 100) : 0;

  const scriptBase = getScriptParaMissao(missao.id);
  const scriptPreenchido = clienteAtual ? preencherScript(scriptBase, clienteAtual) : scriptBase;
  const script = scriptEditado || scriptPreenchido;
  const tel = (clienteAtual?.whatsapp || "").replace(/\D/g, "");
  const waUrl = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(script)}` : null;

  function copiar() {
    navigator.clipboard.writeText(script);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function avancar() {
    setScriptEditado("");
    setResultado("");
    setEtapa("enviando");
    if (indice + 1 >= total) {
      setEtapa("resumo");
    } else {
      setIndice(i => i + 1);
    }
  }

  function marcarEnviado() {
    setEnviados(e => e + 1);
    setEtapa("resultado");
  }

  function pularCliente() {
    setPulados(p => p + 1);
    avancar();
    if (indice + 1 >= total) setEtapa("resumo");
  }

  async function registrarResultado() {
    if (!resultado || !clienteAtual) return;
    setSalvando(true);
    const { momento, temperatura } = resultadoParaMomento(resultado);
    const update = { ultimo_contato: new Date().toISOString() };
    if (momento) update.momento = momento;
    if (temperatura) update.temperatura = temperatura;
    update.proxima_acao = calcularProximaAcao({ ...clienteAtual, ...update });
    await base44.entities.CarteiraCliente.update(clienteAtual.id, update);
    await base44.entities.CarteiraHistorico.create({
      cliente_id: clienteAtual.id,
      tipo: "Missão: " + missao.nome,
      descricao: `Resultado: ${resultado}`,
      momento_anterior: clienteAtual.momento,
      momento_novo: momento || clienteAtual.momento,
    });
    setSalvando(false);
    avancar();
  }

  if (etapa === "resumo") {
    return (
      <div className="space-y-6">
        <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-[#00A89D] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Plano de Ataque
        </button>
        <div className="bg-white border border-[#DFE0E1] rounded-2xl p-8 text-center space-y-4">
          <span className="text-5xl">🎯</span>
          <h2 className="text-xl font-black text-[#102C37]">Envio concluído!</h2>
          <p className="text-sm text-[#526B7A]">A missão <strong>{missao.nome}</strong> está aguardando respostas.</p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-[#F7F8F8] rounded-xl p-3">
              <p className="text-2xl font-black text-[#102C37]">{total}</p>
              <p className="text-xs text-[#526B7A]">Total</p>
            </div>
            <div className="bg-[#E8F3F2] rounded-xl p-3">
              <p className="text-2xl font-black text-[#00A89D]">{enviados}</p>
              <p className="text-xs text-[#526B7A]">Enviadas</p>
            </div>
            <div className="bg-[#F7F8F8] rounded-xl p-3">
              <p className="text-2xl font-black text-[#526B7A]">{pulados}</p>
              <p className="text-xs text-[#526B7A]">Pulados</p>
            </div>
          </div>
          <div className="bg-[#FFF7E6] border border-[#FFF7E6] rounded-xl p-3 mt-2">
            <p className="text-xs font-bold text-[#F59F0A] uppercase tracking-wide">Status da Missão</p>
            <p className="text-sm font-semibold text-[#F59F0A] mt-0.5">Aguardando respostas</p>
          </div>
          <Button onClick={onVoltar} className="w-full rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white mt-2">
            Voltar ao Plano de Ataque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#526B7A]">
        <button onClick={onVoltar} className="hover:text-[#00A89D] transition-colors">Carteira de Clientes</button>
        <ChevronRight className="w-3 h-3" />
        <span>Plano de Ataque</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#102C37] font-semibold">{missao.nome}</span>
      </div>

      {/* Card de progresso */}
      <div className="bg-white border border-[#DFE0E1] rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black text-[#526B7A] uppercase tracking-wide">Missão</p>
            <p className="text-base font-black text-[#102C37]">{missao.nome}</p>
          </div>
          <span className="text-xs bg-[#FFF7E6] text-[#F59F0A] font-bold px-2.5 py-1 rounded-full border border-[#FFF7E6]">Em execução</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-[#102C37]">{total}</p>
            <p className="text-xs text-[#526B7A]">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-[#00A89D]">{enviados}</p>
            <p className="text-xs text-[#526B7A]">Enviadas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-[#526B7A]">{total - enviados - pulados}</p>
            <p className="text-xs text-[#526B7A]">Pendentes</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#526B7A] mb-1">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <div className="bg-[#DFE0E1] rounded-full h-2">
            <div className="bg-[#00A89D] rounded-full h-2 transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </div>

      {/* Cliente atual */}
      {clienteAtual && etapa === "enviando" && (
        <div className="bg-white border border-[#DFE0E1] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-[#526B7A] uppercase tracking-wide">Cliente {indice + 1} de {total}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F3F2] flex items-center justify-center text-base font-black text-[#00A89D]">
              {(clienteAtual.nome || "?").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-base font-black text-[#102C37]">{clienteAtual.nome}</p>
              <p className="text-sm text-[#526B7A]">{clienteAtual.whatsapp} · {clienteAtual.veiculo_interesse || "Sem veículo"}</p>
              <p className="text-xs text-[#526B7A] mt-0.5">{clienteAtual.momento}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1">Script sugerido</p>
            <textarea value={scriptEditado || scriptPreenchido} onChange={e => setScriptEditado(e.target.value)} rows={6}
              className="w-full rounded-xl border border-[#DFE0E1] bg-[#F7F8F8] px-3 py-2.5 text-sm text-[#071822] resize-none focus:outline-none focus:ring-1 focus:ring-[#00A89D]" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copiar} className="flex-1 rounded-xl gap-1.5 text-sm">
              {copiado ? <Check className="w-4 h-4 text-[#00A89D]" /> : <Copy className="w-4 h-4" />}
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white gap-1.5 text-sm">
                  <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                </Button>
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={pularCliente} className="rounded-xl gap-1.5 text-sm text-[#526B7A]">
              <SkipForward className="w-4 h-4" /> Pular
            </Button>
            <Button onClick={marcarEnviado} className="flex-1 rounded-xl bg-[#E8F3F2] text-[#00A89D] hover:bg-[#E8F3F2] font-bold gap-1.5 text-sm border border-[#E8F3F2]">
              Mensagem enviada →
            </Button>
          </div>
        </div>
      )}

      {/* Registrar resultado */}
      {clienteAtual && etapa === "resultado" && (
        <div className="bg-white border border-[#DFE0E1] rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-black text-[#526B7A] uppercase tracking-wide">Registrar resultado</p>
            <p className="text-sm font-semibold text-[#102C37] mt-0.5">{clienteAtual.nome}</p>
          </div>
          <p className="text-sm text-[#526B7A]">O que aconteceu nesse contato?</p>
          <div className="grid grid-cols-1 gap-1.5">
            {RESULTADOS.map(r => (
              <button key={r} onClick={() => setResultado(r)}
                className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${resultado === r ? "border-[#00A89D] bg-[#E8F3F2] text-[#00A89D] font-semibold" : "border-[#DFE0E1] text-[#526B7A] hover:bg-[#F7F8F8]"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={avancar} className="flex-1 rounded-xl text-sm">Pular resultado</Button>
            <Button onClick={registrarResultado} disabled={!resultado || salvando}
              className="flex-1 rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white text-sm">
              {salvando ? "Salvando..." : "Confirmar e avançar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}