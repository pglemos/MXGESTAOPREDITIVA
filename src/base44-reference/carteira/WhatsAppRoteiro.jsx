import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getScriptParaMissao, preencherScript, resultadoParaMomento, calcularProximaAcao, RESULTADOS } from "./carteiraUtils";

export default function WhatsAppRoteiro({ open, onClose, cliente, missaoId, onResultadoRegistrado }) {
  const [copiado, setCopiado] = useState(false);
  const [scriptEditado, setScriptEditado] = useState("");
  const [resultado, setResultado] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState("script"); // "script" | "resultado"

  const scriptBase = getScriptParaMissao(missaoId || "padrao");
  const scriptPreenchido = cliente ? preencherScript(scriptBase, cliente) : scriptBase;
  const script = scriptEditado || scriptPreenchido;

  const tel = (cliente?.whatsapp || "").replace(/\D/g, "");
  const waUrl = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(script)}` : null;

  function copiar() {
    navigator.clipboard.writeText(script);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function registrar() {
    if (!resultado || !cliente) return;
    setSalvando(true);
    const { momento, temperatura } = resultadoParaMomento(resultado);
    const update = { ultimo_contato: new Date().toISOString() };
    if (momento) update.momento = momento;
    if (temperatura) update.temperatura = temperatura;
    update.proxima_acao = calcularProximaAcao({ ...cliente, ...update });

    await base44.entities.CarteiraCliente.update(cliente.id, update);
    await base44.entities.CarteiraHistorico.create({
      cliente_id: cliente.id,
      tipo: "Resultado registrado",
      descricao: `Resultado: ${resultado}`,
      momento_anterior: cliente.momento,
      momento_novo: momento || cliente.momento,
    });
    setSalvando(false);
    onResultadoRegistrado({ ...cliente, ...update });
    onClose();
  }

  function handleOpen() {
    setEtapa("script");
    setScriptEditado("");
    setResultado("");
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#031B3D] font-black">
            {etapa === "script" ? "WhatsApp com Roteiro" : "Registrar Resultado"}
          </DialogTitle>
          {cliente && <p className="text-sm text-slate-400">{cliente.nome} · {cliente.veiculo_interesse || "Sem veículo"}</p>}
        </DialogHeader>

        {etapa === "script" && (
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Objetivo</p>
              <p className="text-sm text-slate-600">{missaoId ? "Abordar o cliente com roteiro personalizado e registrar o resultado." : "Entrar em contato com o cliente."}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Script sugerido</p>
              <textarea
                value={scriptEditado || scriptPreenchido}
                onChange={e => setScriptEditado(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#005BFF] focus:border-[#005BFF]"
              />
              <p className="text-xs text-slate-400 mt-1">Você pode editar o script antes de enviar.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copiar} className="flex-1 rounded-xl gap-2">
                {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiado ? "Copiado!" : "Copiar script"}
              </Button>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white gap-2">
                    <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                  </Button>
                </a>
              )}
            </div>
            <Button variant="ghost" onClick={() => setEtapa("resultado")} className="w-full rounded-xl text-[#005BFF] hover:bg-blue-50">
              Registrar resultado do contato →
            </Button>
          </div>
        )}

        {etapa === "resultado" && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-500">O que aconteceu nesse contato?</p>
            <div className="grid grid-cols-1 gap-1.5">
              {RESULTADOS.map(r => (
                <button key={r} onClick={() => setResultado(r)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${resultado === r ? "border-[#005BFF] bg-blue-50 text-[#005BFF] font-semibold" : "border-slate-100 text-slate-600 hover:bg-slate-50"}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEtapa("script")} className="flex-1 rounded-xl">Voltar</Button>
              <Button onClick={registrar} disabled={!resultado || salvando} className="flex-1 rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white">
                {salvando ? "Salvando..." : "Confirmar resultado"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}