import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, CheckCircle, Clock, User } from "lucide-react";
import moment from "moment/min/moment-with-locales";
import { useToast } from "@/components/ui/use-toast";

moment.locale("pt-br");

export default function LiberacaoFechamentoPage() {
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const solicitacaoId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [solicitacao, setSolicitacao] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [liberando, setLiberando] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (!solicitacaoId) { setError("Link inválido."); setLoading(false); return; }
        const s = await base44.entities.LiberacaoFechamento.get(solicitacaoId);
        setSolicitacao(s);
      } catch (e) {
        setError("Erro ao carregar solicitação.");
      }
      setLoading(false);
    };
    init();
  }, [solicitacaoId]);

  const podeLiberar = user && ["admin", "gerente", "supervisor", "dono"].includes(user.role);

  const handleLiberar = async () => {
    setLiberando(true);
    await base44.entities.LiberacaoFechamento.update(solicitacao.id, {
      status_solicitacao: "Liberado",
      liberado_por_id: user.id,
      liberado_por_nome: user.full_name,
      data_hora_liberacao: new Date().toISOString(),
      motivo_liberacao: motivo,
    });
    setSolicitacao(s => ({ ...s, status_solicitacao: "Liberado" }));
    setLiberando(false);
    setDone(true);
    toast({ title: "Fechamento liberado com sucesso!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F8F8]">
        <div className="w-8 h-8 border-4 border-[#DFE0E1] border-t-[#00A89D] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !solicitacao) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F8F8]">
        <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-8 text-center max-w-sm">
          <p className="text-[15px] font-bold text-[#EF4343]">{error || "Solicitação não encontrada."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F8] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3F2] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#00A89D]" />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-[#071822]">Liberação de Fechamento</h1>
            <p className="text-[12px] text-[#526B7A]">Solicitação de liberação com atraso</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 p-3 bg-[#F7F8F8] rounded-xl">
            <User className="w-4 h-4 text-[#526B7A] flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#526B7A] font-bold uppercase tracking-wider">Vendedor</p>
              <p className="text-[13px] font-semibold text-[#071822]">{solicitacao.vendedor_nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#F7F8F8] rounded-xl">
            <CalendarDays className="w-4 h-4 text-[#526B7A] flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#526B7A] font-bold uppercase tracking-wider">Data do Fechamento</p>
              <p className="text-[13px] font-semibold text-[#071822]">{moment(solicitacao.data_fechamento).format("DD/MM/YYYY")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#F7F8F8] rounded-xl">
            <Clock className="w-4 h-4 text-[#526B7A] flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#526B7A] font-bold uppercase tracking-wider">Solicitado em</p>
              <p className="text-[13px] font-semibold text-[#071822]">{moment(solicitacao.data_hora_solicitacao).format("DD/MM/YYYY [às] HH:mm")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#F7F8F8] rounded-xl">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${solicitacao.status_solicitacao === "Liberado" ? "bg-[#00A89D]" : "bg-[#F59F0A]"}`} />
            <div>
              <p className="text-[10px] text-[#526B7A] font-bold uppercase tracking-wider">Status</p>
              <p className={`text-[13px] font-semibold ${solicitacao.status_solicitacao === "Liberado" ? "text-[#00A89D]" : "text-[#F59F0A]"}`}>{solicitacao.status_solicitacao}</p>
            </div>
          </div>
        </div>

        {done || solicitacao.status_solicitacao === "Liberado" ? (
          <div className="flex items-center gap-2 p-4 bg-[#E8F3F2] border border-[#00A89D] rounded-xl">
            <CheckCircle className="w-5 h-5 text-[#00A89D] flex-shrink-0" />
            <p className="text-[13px] font-semibold text-[#00A89D]">Fechamento liberado com sucesso.</p>
          </div>
        ) : !podeLiberar ? (
          <div className="p-4 bg-[#FEECEC] border border-[#EF4343] rounded-xl">
            <p className="text-[13px] font-semibold text-[#EF4343]">Você não tem permissão para liberar fechamentos.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider block mb-1.5">Motivo da liberação (opcional)</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Vendedor teve problema técnico no sistema."
                rows={3}
                className="w-full border border-[#DFE0E1] rounded-xl px-3 py-2 text-[13px] text-[#071822] resize-none focus:outline-none focus:border-[#00A89D] focus:ring-1 focus:ring-[#00A89D]"
              />
            </div>
            <button
              onClick={handleLiberar}
              disabled={liberando}
              className="w-full flex items-center justify-center gap-2 bg-[#00A89D] hover:bg-[#00A89D] disabled:opacity-60 text-white font-black text-[14px] h-[48px] rounded-xl transition-colors shadow-sm shadow-[0_8px_24px_rgba(0,168,157,0.14)]"
            >
              <CheckCircle className="w-4 h-4" />
              {liberando ? "Liberando..." : "Liberar Fechamento"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}