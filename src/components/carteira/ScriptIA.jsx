import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Check, MessageCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import moment from "moment";
import { getInstrucaoScript } from "./proximoPassoLib";
import { gerarScriptLocal } from "./scriptTemplatesLocal";

const TONS = [
  { id: "consultivo", label: "Consultivo", desc: "Perguntativo, orientado a entender a necessidade" },
  { id: "direto",     label: "Direto",      desc: "Objetivo, claro, sem rodeios" },
  { id: "leve",       label: "Leve",        desc: "Descontraído, próximo, não pressiona" },
  { id: "reativacao", label: "Reativação",  desc: "Para clientes frios ou sem resposta" },
  { id: "audio",      label: "Áudio curto", desc: "Breve, natural, como uma mensagem de voz" },
];

function buildPrompt({ cliente, objetivo, proximoPasso, scriptPadrao, tom, historico }) {
  const ultimaInteracao = cliente.ultimo_contato
    ? moment(cliente.ultimo_contato).fromNow()
    : "data não registrada";

  const tomInstrucao = {
    consultivo: "Use tom consultivo: faça perguntas que ajudem o cliente a refletir sobre suas necessidades. Seja curioso, não insistente.",
    direto: "Use tom direto: seja objetivo e vá ao ponto. Sem firulas, sem prolongar. Máximo 4 frases.",
    leve: "Use tom leve e descontraído: como se fosse um amigo próximo. Sem pressão, sem formalidade excessiva.",
    reativacao: "Use tom de reativação: é uma mensagem para um cliente que ficou um tempo sem responder. Não cobre, reacenda o interesse com leveza.",
    audio: "Escreva como se fosse uma mensagem de áudio curta (30 a 45 segundos de fala). Tom natural, sem bullet points, sem parágrafos formais. Máximo 5 frases.",
  }[tom] || "";

  const historicoTexto = historico?.length
    ? historico.slice(-3).map(h => `- ${h.tipo}: ${h.descricao}${h.resultado ? ` (${h.resultado})` : ""}`).join("\n")
    : "Nenhum registro de histórico.";

  return `Você é um assistente de vendas especializado no método MX Performance para concessionárias de veículos.

Sua tarefa é escrever UMA mensagem personalizada de WhatsApp para o vendedor enviar ao cliente.

DADOS DO CLIENTE:
- Nome: ${cliente.nome || "—"}
- Veículo de interesse: ${cliente.veiculo_interesse || "não informado"}
- Canal Comercial: ${cliente.canal_comercial || cliente.canal_origem || "—"}
- Origem: ${cliente.origem_detalhada || "não informada"}
- Situação atual: ${cliente.situacao_atual || cliente.momento || "—"}
- Temperatura: ${cliente.temperatura || "—"}
- Prioridade comercial: ${cliente.prioridade_comercial || "—"}
- Score do cliente: ${cliente.score_cliente ?? "—"}
- Valor negociado: ${cliente.valor_negociado || "não informado"}
- Interesse em troca: ${cliente.interesse_troca ? "Sim" : "Não"}
- Interesse em financiamento: ${cliente.interesse_financiamento ? "Sim" : "Não"}
- Motivo de perda (se houver): ${cliente.motivo_perda || "—"}
- Observações: ${cliente.observacoes || "sem observações"}
- Último contato: ${ultimaInteracao}
- Próxima ação agendada: ${cliente.proxima_acao_data ? moment(cliente.proxima_acao_data).format("DD/MM/YYYY") : "não definida"}

HISTÓRICO RECENTE:
${historicoTexto}

OBJETIVO COMERCIAL: ${objetivo}
PRÓXIMO PASSO: ${proximoPasso}

SCRIPT PADRÃO DE REFERÊNCIA (use como base, mas personalize):
"${scriptPadrao}"

INSTRUÇÃO DE TOM:
${tomInstrucao}

INSTRUÇÃO ESPECÍFICA DO PRÓXIMO PASSO (siga obrigatoriamente):
${getInstrucaoScript(proximoPasso)}

REGRAS OBRIGATÓRIAS:
1. Personalize com o nome e o veículo do cliente.
2. Mantenha o objetivo comercial do próximo passo.
3. Use linguagem natural, profissional e próxima — nunca robótica.
4. Mensagem pronta para WhatsApp — sem marcações, sem asteriscos de formatação markdown.
5. Não invente descontos, promoções ou disponibilidade de veículo.
6. Não prometa aprovação de financiamento.
7. Não crie urgência falsa.
8. Não altere status do cliente.
9. Não use linguagem agressiva.
10. Adapte ao canal (${cliente.canal_comercial || cliente.canal_origem || "—"}), temperatura (${cliente.temperatura || "—"}) e histórico.
11. Se o tom for "áudio curto", escreva como fala natural, sem parágrafos formais.

Responda APENAS com o texto da mensagem, sem explicações adicionais.`;
}

export default function ScriptIA({ cliente, objetivo, proximoPasso, scriptPadrao, historico, waUrlBase, onWhatsAppClick }) {
  const [tomSelecionado, setTomSelecionado] = useState("consultivo");
  const [scriptIA, setScriptIA] = useState("");
  const [gerando, setGerando] = useState(false);
  const [copiado, setCOpiado] = useState(false);
  const [tentativas, setTentativas] = useState(0);

  useEffect(() => {
    if (!cliente) return;
    setScriptIA("");
    setTomSelecionado("consultivo");
    gerarScript("consultivo");
  }, [cliente?.id]);

  async function gerarScript(tomOverride) {
    setGerando(true);
    const tom = tomOverride || tomSelecionado;
    const prompt = buildPrompt({ cliente, objetivo, proximoPasso, scriptPadrao, tom, historico });
    try {
      const { data, error } = await supabase.functions.invoke("openrouter-generate", {
        body: { mode: "crm_whatsapp_script", prompt },
      });
      if (error || !data?.success || !data?.text) {
        throw new Error(error?.message || data?.error || "Integração de IA indisponível.");
      }
      setScriptIA(data.text);
    } catch (error) {
      setScriptIA(atual => gerarScriptLocal({ cliente, proximoPasso, tom, textoAnterior: atual }));
    } finally {
      setTentativas(t => t + 1);
      setGerando(false);
    }
  }

  function copiar() {
    if (!scriptIA) return;
    navigator.clipboard.writeText(scriptIA);
    setCOpiado(true);
    setTimeout(() => setCOpiado(false), 2000);
  }

  const tel = (cliente?.whatsapp || cliente?.telefone || "").replace(/\D/g, "");
  const waUrl = tel && scriptIA ? `https://wa.me/55${tel}?text=${encodeURIComponent(scriptIA)}` : null;

  return (
    <div className="border border-dashed border-violet-200 rounded-2xl bg-violet-50/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
        </div>
        <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Script personalizado com IA</p>
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

      {/* Botão gerar */}
      {!scriptIA && (
        <Button
          onClick={() => gerarScript()}
          disabled={gerando}
          className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 text-sm"
        >
          {gerando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando mensagem...</>
            : <><Sparkles className="w-4 h-4" /> Gerar script com IA</>
          }
        </Button>
      )}

      {/* Script gerado */}
      {scriptIA && (
        <>
          <div>
            <textarea
              value={scriptIA}
              onChange={e => setScriptIA(e.target.value)}
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
            onClick={() => gerarScript()}
            disabled={gerando}
            className="w-full rounded-xl text-violet-600 hover:bg-violet-100 gap-2 text-xs"
          >
            {gerando
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Gerar outra versão</>
            }
          </Button>
        </>
      )}
    </div>
  );
}