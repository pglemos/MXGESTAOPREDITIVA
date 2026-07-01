import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  calcularObjetivoEProximoPasso, getScriptParaProximoPasso, getScriptParaMissao,
  preencherScript, resultadoParaSituacao,
} from "./carteiraUtils";
import ScriptIA from "./ScriptIA";

const RESULTADOS_CARDS = [
  { label: "Executado",         emoji: "✅", cor: "green" },
  { label: "Não atendeu",       emoji: "🚫", cor: "red" },
  { label: "Não respondeu",     emoji: "🔕", cor: "slate" },
  { label: "Visita agendada",   emoji: "📅", cor: "blue" },
  { label: "Proposta enviada",  emoji: "📋", cor: "orange" },
  { label: "Remarcar",          emoji: "🔄", cor: "teal" },
  { label: "Perdeu interesse",  emoji: "❌", cor: "red" },
  { label: "Venda realizada",   emoji: "🏆", cor: "yellow" },
  { label: "Outro",             emoji: "💬", cor: "slate" },
];

const COR_MAP = {
  green:  { sel: "bg-green-50 border-green-400 text-green-700",    base: "bg-white border-slate-200 hover:bg-green-50 hover:border-green-300" },
  red:    { sel: "bg-red-50 border-red-400 text-red-700",          base: "bg-white border-slate-200 hover:bg-red-50 hover:border-red-300" },
  slate:  { sel: "bg-slate-100 border-slate-400 text-slate-700",   base: "bg-white border-slate-200 hover:bg-slate-50" },
  blue:   { sel: "bg-blue-50 border-blue-400 text-blue-700",       base: "bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300" },
  orange: { sel: "bg-orange-50 border-orange-400 text-orange-700", base: "bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300" },
  teal:   { sel: "bg-teal-50 border-teal-400 text-teal-700",       base: "bg-white border-slate-200 hover:bg-teal-50 hover:border-teal-300" },
  yellow: { sel: "bg-yellow-50 border-yellow-400 text-yellow-700", base: "bg-white border-slate-200 hover:bg-yellow-50 hover:border-yellow-300" },
};

const RESULTADO_MAP = {
  "Executado":        "Atendeu",
  "Não atendeu":      "Não atendeu",
  "Não respondeu":    "Não respondeu",
  "Visita agendada":  "Agendou visita",
  "Proposta enviada": "Proposta enviada",
  "Remarcar":         "Reagendou visita",
  "Perdeu interesse": "Sem interesse",
  "Venda realizada":  "Comprou",
};

// Chave no sessionStorage para detecção de retorno do WhatsApp
const WA_KEY = "mx_wa_saida";

export default function WhatsAppRoteiro({ open, onClose, cliente, missaoId, onResultadoRegistrado, autoExpandirRegistro }) {
  const [resultado, setResultado] = useState("");
  const [motivoPerda, setMotivoPerda] = useState("");
  const [novaDataVisita, setNovaDataVisita] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const { objetivo, proximoPasso } = cliente ? calcularObjetivoEProximoPasso(cliente) : { objetivo: "", proximoPasso: "" };
  const situacao = cliente?.situacao_atual || cliente?.momento || "—";

  const scriptBase = missaoId
    ? getScriptParaMissao(missaoId)
    : getScriptParaProximoPasso(proximoPasso);
  const scriptPreenchido = cliente ? preencherScript(scriptBase, cliente) : scriptBase;

  useEffect(() => {
    if (open) {
      setResultado("");
      setMotivoPerda("");
      setNovaDataVisita("");
      setObservacao("");
      // Se autoExpandirRegistro, abre direto os cards de resultado
      setMostrarRegistro(!!autoExpandirRegistro);
      setHistorico([]);
      if (cliente?.id) {
        base44.entities.CarteiraHistorico.filter({ cliente_id: cliente.id }, "-created_date", 5)
          .then(h => setHistorico(h || []))
          .catch(() => {});
      }
    }
  }, [open, cliente?.id, autoExpandirRegistro]);

  const precisaMotivo = resultado === "Perdeu interesse";
  const precisaDataVisita = ["Visita agendada", "Remarcar"].includes(resultado);

  // Registra saída para WhatsApp no sessionStorage para detecção de retorno
  function registrarSaidaWhatsApp() {
    if (!cliente) return;
    sessionStorage.setItem(WA_KEY, JSON.stringify({
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      proximoPasso,
      ts: Date.now(),
      origem: "script_ia_whatsapp",
    }));
  }

  async function registrar() {
    if (!resultado || !cliente) return;
    setSalvando(true);

    const resultadoMapeado = RESULTADO_MAP[resultado] || resultado;
    const { situacao: novaSituacao, temperatura, objetivo: novoObjetivo, proximoPasso: novoProximoPasso, statusComercial } = resultadoParaSituacao(resultadoMapeado);

    const update = {
      ultimo_contato: new Date().toISOString(),
      canal_comercial: cliente.canal_comercial || "Internet",
    };
    if (novaSituacao) update.situacao_atual = novaSituacao;
    if (temperatura) update.temperatura = temperatura;
    if (novoObjetivo) update.objetivo_atual = novoObjetivo;
    if (novoProximoPasso) update.proximo_passo = novoProximoPasso;
    if (statusComercial) update.status_comercial = statusComercial;
    if (motivoPerda) update.motivo_perda = motivoPerda;
    if (novaDataVisita) update.visita_agendada_em = novaDataVisita;
    if (resultado === "Venda realizada") update.ativo = true;

    await base44.entities.CarteiraCliente.update(cliente.id, update);
    await base44.entities.CarteiraHistorico.create({
      cliente_id: cliente.id,
      vendedor_id: cliente.vendedor_id,
      tipo: "Resultado registrado",
      descricao: `Próximo passo executado: ${proximoPasso}. Resultado: ${resultado}.${observacao ? " " + observacao : ""}`,
      resultado,
      momento_anterior: situacao,
      momento_novo: novaSituacao || situacao,
    });

    // Limpa a marcação de saída para WhatsApp se existir
    sessionStorage.removeItem(WA_KEY);

    setSalvando(false);
    onResultadoRegistrado({ ...cliente, ...update });
    onClose();
  }

  const tel = (cliente?.whatsapp || cliente?.telefone || "").replace(/\D/g, "");

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#031B3D] font-black flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#005BFF]" />
            Executar próximo passo
          </DialogTitle>
          {cliente && (
            <div className="space-y-1 pt-1">
              <p className="text-sm font-bold text-slate-700">{cliente.nome}</p>
              {cliente.veiculo_interesse && (
                <p className="text-xs text-slate-400">{cliente.veiculo_interesse}</p>
              )}
              <div className="flex gap-4 pt-1">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Objetivo</p>
                  <p className="text-xs font-semibold text-slate-700">{objetivo}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#005BFF] font-bold uppercase tracking-wide">Próximo Passo</p>
                  <p className="text-xs font-bold text-[#031B3D]">{proximoPasso}</p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Script IA — recolhe ao abrir registro */}
          {!mostrarRegistro && (
            <ScriptIA
              cliente={cliente}
              objetivo={objetivo}
              proximoPasso={proximoPasso}
              scriptPadrao={scriptPreenchido}
              historico={historico}
              onWhatsAppClick={registrarSaidaWhatsApp}
            />
          )}

          {/* Toggle Registrar Resultado */}
          <button
            onClick={() => setMostrarRegistro(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
              mostrarRegistro
                ? "bg-[#005BFF] text-white border-[#005BFF]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
            }`}
          >
            <span className="text-sm font-semibold">
              {resultado ? `Resultado: ${resultado}` : "Registrar resultado do contato"}
            </span>
            {mostrarRegistro
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </button>

          {/* Painel de Registro */}
          {mostrarRegistro && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Registrar Resultado</p>
                <div className="grid grid-cols-3 gap-2">
                  {RESULTADOS_CARDS.map(r => {
                    const selecionado = resultado === r.label;
                    const cores = COR_MAP[r.cor] || COR_MAP.slate;
                    return (
                      <button
                        key={r.label}
                        onClick={() => setResultado(selecionado ? "" : r.label)}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border-2 transition-all ${
                          selecionado ? cores.sel : cores.base
                        }`}
                      >
                        <span className="text-2xl leading-none">{r.emoji}</span>
                        <span className="text-[10px] font-semibold text-center leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {precisaMotivo && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Motivo da perda</p>
                  <input
                    value={motivoPerda}
                    onChange={e => setMotivoPerda(e.target.value)}
                    placeholder="Descreva o motivo..."
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#005BFF]"
                  />
                </div>
              )}
              {precisaDataVisita && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Data e hora da visita</p>
                  <input
                    type="datetime-local"
                    value={novaDataVisita}
                    onChange={e => setNovaDataVisita(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#005BFF]"
                  />
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Observação (opcional)</p>
                <textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Detalhes do contato..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#005BFF]"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
                <Button
                  onClick={registrar}
                  disabled={!resultado || salvando || (precisaMotivo && !motivoPerda)}
                  className="flex-1 rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white"
                >
                  {salvando ? "Salvando..." : "Registrar resultado"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { WA_KEY };