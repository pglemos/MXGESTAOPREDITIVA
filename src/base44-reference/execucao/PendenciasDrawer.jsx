import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Phone, ExternalLink, Calendar, AlertTriangle } from "lucide-react";
import moment from "moment/min/moment-with-locales";
import ResolverModal from "./ResolverModal";
import ReagendarPendenciaModal from "./ReagendarPendenciaModal";

moment.locale("pt-br");

const TIPO_COLOR = {
  "Atendimento": "bg-[#00A89D]",
  "Retorno": "bg-[#F59F0A]",
  "Documentação": "bg-[#526B7A]",
  "Entrega": "bg-[#F15BBA]",
  "Pós-venda": "bg-teal-500",
  "Aniversário": "bg-pink-500",
  "Garantia": "bg-[#F59F0A]",
  "Outra atividade comercial": "bg-[#DFE0E1]",
};

function getDataExecucao(op) {
  if (op.data_hora_execucao) return op.data_hora_execucao;
  if (op.appointment_datetime) return op.appointment_datetime;
  if (op.data && op.horario) return `${op.data}T${op.horario}:00`;
  return op.data || op.created_date || null;
}

export default function PendenciasDrawer({ open, onClose, pendencias, onResolvida, onReagendada, onAbrirCliente }) {
  const [resolverTarget, setResolverTarget] = useState(null);
  const [reagendarTarget, setReagendarTarget] = useState(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#071822] font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F59F0A]" />
              Pendências anteriores ({pendencias.length})
            </DialogTitle>
          </DialogHeader>

          {pendencias.length === 0 ? (
            <p className="text-[13px] text-[#526B7A] text-center py-8">Nenhuma pendência anterior.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {pendencias.map(op => {
                const dataExecucao = getDataExecucao(op);
                const dataMoment = moment(dataExecucao);
                const atraso = dataMoment.isValid() ? moment().diff(dataMoment, "days") : null;
                return (
                  <div key={op.id} className="bg-white border border-[#DFE0E1] rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${TIPO_COLOR[op.tipo] || "bg-[#526B7A]"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold text-[#526B7A] uppercase tracking-wider">{op.tipo}</span>
                          <span className="text-[10px] font-bold text-[#EF4343] bg-[#FEECEC] px-2 py-0.5 rounded-full">
                            {atraso == null ? "Atrasada" : atraso === 0 ? "Hoje" : `${Math.max(atraso, 1)}d atraso`}
                          </span>
                        </div>
                        <p className="font-bold text-[13px] text-[#071822] truncate">{op.nome_cliente_snapshot || "—"}</p>
                        {op.veiculo_snapshot && <p className="text-[12px] text-[#526B7A] truncate">{op.veiculo_snapshot}</p>}
                        <p className="text-[12px] text-[#526B7A] mt-0.5">{op.descricao}</p>
                        {dataMoment.isValid() && (
                          <p className="text-[11px] text-[#E0EBEA] mt-0.5">{dataMoment.format("DD/MM/YYYY HH:mm")}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {op.telefone_snapshot && (
                        <>
                          <a
                            href={`https://wa.me/55${(op.telefone_snapshot || "").replace(/\D/g, "")}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${(op.telefone_snapshot || "").replace(/\D/g, "")}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#526B7A] border border-[#DFE0E1] hover:bg-[#F7F8F8] px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Phone className="w-3 h-3" /> Ligar
                          </a>
                        </>
                      )}
                      {op.cliente_id && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[11px] font-bold text-[#00A89D] border border-[#00A89D] hover:bg-[#E8F3F2] px-2.5 py-1.5 rounded-lg transition-colors"
                          onClick={() => {
                            onClose();
                            onAbrirCliente?.(op);
                          }}
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir cliente
                        </button>
                      )}
                      <button onClick={() => setReagendarTarget(op)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#526B7A] border border-[#DFE0E1] hover:bg-[#F7F8F8] px-2.5 py-1.5 rounded-lg transition-colors">
                        <Calendar className="w-3 h-3" /> Reagendar
                      </button>
                      <button onClick={() => setResolverTarget(op)}
                        className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] px-2.5 py-1.5 rounded-lg transition-colors ml-auto">
                        Resolver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {resolverTarget && (
        <ResolverModal
          oportunidade={resolverTarget}
          open
          onClose={() => setResolverTarget(null)}
          onResolvida={(id, status, novaData) => {
            setResolverTarget(null);
            onResolvida(id, status, novaData);
          }}
        />
      )}

      {reagendarTarget && (
        <ReagendarPendenciaModal
          oportunidade={reagendarTarget}
          open
          onClose={() => setReagendarTarget(null)}
          onReagendada={(id, novaData) => {
            setReagendarTarget(null);
            onReagendada(id, novaData);
          }}
        />
      )}
    </>
  );
}
