import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Copy, Check, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarScriptLocal } from "./scriptTemplatesLocal";

const TONS = [
  { id: "consultivo", label: "Consultivo", desc: "Perguntativo, orientado a entender a necessidade" },
  { id: "direto",     label: "Direto",      desc: "Objetivo, claro, sem rodeios" },
  { id: "leve",       label: "Leve",        desc: "Descontraído, próximo, não pressiona" },
  { id: "reativacao", label: "Reativação",  desc: "Para clientes frios ou sem resposta" },
  { id: "audio",      label: "Áudio curto", desc: "Breve, natural, como uma mensagem de voz" },
];

export default function ScriptIA({ cliente, proximoPasso, onWhatsAppClick }) {
  const [tomSelecionado, setTomSelecionado] = useState("consultivo");
  const [script, setScript] = useState("");
  const [copiado, setCopiado] = useState(false);

  const gerarScript = useCallback((tom) => {
    if (!cliente) return;
    const texto = gerarScriptLocal({ cliente, proximoPasso, tom });
    setScript(texto);
  }, [cliente, proximoPasso]);

  useEffect(() => {
    if (!cliente) return;
    gerarScript("consultivo");
  }, [cliente?.id, gerarScript]);

  const copiar = useCallback(async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = script;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }, [script]);

  const tel = (cliente?.whatsapp || cliente?.telefone || "").replace(/\D/g, "");
  const waUrl = tel && script ? `https://wa.me/55${tel}?text=${encodeURIComponent(script)}` : null;

  return (
    <div className="border border-dashed border-violet-200 rounded-2xl bg-violet-50/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
        </div>
        <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Script personalizado</p>
      </div>

      {/* Seletor de tom */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Tom da mensagem</p>
        <div className="flex flex-wrap gap-1.5">
          {TONS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTomSelecionado(t.id); gerarScript(t.id); }}
              title={t.desc}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                tomSelecionado === t.id
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Script gerado */}
      {script && (
        <>
          <div>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              rows={7}
              className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Edite antes de enviar se necessário.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copiar} className="flex-1 rounded-xl gap-2 text-xs border-violet-200 text-violet-700 hover:bg-violet-50">
              {copiado ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
            </Button>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={onWhatsAppClick}>
                <Button className="w-full rounded-xl bg-[#25D366] hover:bg-green-600 text-white gap-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </Button>
              </a>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={() => gerarScript(tomSelecionado)}
            className="w-full rounded-xl text-violet-600 hover:bg-violet-100 gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Gerar outra versão
          </Button>
        </>
      )}
    </div>
  );
}
