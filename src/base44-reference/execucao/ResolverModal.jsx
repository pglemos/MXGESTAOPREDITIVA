import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const OPCOES_POR_TIPO = {
  "Atendimento": ["Cliente atendido", "Venda registrada", "Reagendado", "Não compareceu", "Continuar negociação", "Registrar perda"],
  "Retorno": ["Falei com o cliente", "Cliente não respondeu", "Reagendar retorno", "Avançou para negociação", "Registrar perda"],
  "Documentação": ["Documentação recebida", "Cliente ainda vai enviar", "Reagendar cobrança", "Encaminhar para administrativo", "Encerrar pendência"],
  "Entrega": ["Entrega realizada", "Reagendar entrega", "Cliente não compareceu", "Pendência antes da entrega", "Encerrar"],
  "Pós-venda": ["Cliente satisfeito", "Pedi indicação", "Cliente precisa de suporte", "Reagendar contato", "Encerrar etapa"],
  "Aniversário": ["Mensagem enviada", "Cliente respondeu", "Reagendar contato", "Encerrar lembrete"],
  "Garantia": ["Garantia resolvida", "Cliente em atendimento", "Reagendar acompanhamento", "Encaminhar responsável", "Cliente insatisfeito"],
  "Outra atividade comercial": ["Resolvida", "Reagendada", "Cancelada", "Converter em retorno", "Abrir cliente"],
};

const REAGENDAR_OPCOES = new Set([
  "Reagendado", "Reagendar retorno", "Reagendar cobrança", "Reagendar entrega",
  "Reagendar contato", "Reagendar acompanhamento", "Reagendada", "Cliente não respondeu",
]);

const VENDA_OPCOES = new Set(["Venda registrada"]);
const PERDA_OPCOES = new Set(["Registrar perda"]);

const LOSS_REASONS = [
  "Cliente parou de responder", "Avaliação do usado não agradou",
  "Parcela acima da expectativa", "Comprou na concorrência",
  "Irá comprar em outro momento", "Não gostou do carro", "Outros",
];

function formatCurrency(raw) {
  const num = (raw || "").replace(/\D/g, "");
  if (!num) return "";
  const val = (parseInt(num, 10) / 100).toFixed(2);
  return "R$ " + parseFloat(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function ResolverModal({ oportunidade, open, onClose, onResolvida }) {
  const { toast } = useToast();
  const [resultado, setResultado] = useState("");
  const [obs, setObs] = useState("");
  const [novaData, setNovaData] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [valorNegociado, setValorNegociado] = useState(oportunidade?.veiculo_snapshot ? "" : "");
  const [saving, setSaving] = useState(false);

  if (!oportunidade) return null;

  const opcoes = OPCOES_POR_TIPO[oportunidade.tipo] || ["Resolvida", "Reagendada", "Cancelada"];
  const precisaReagendar = REAGENDAR_OPCOES.has(resultado);
  const ehVenda = VENDA_OPCOES.has(resultado);
  const ehPerda = PERDA_OPCOES.has(resultado);

  const podeConfirmar = resultado && (!precisaReagendar || novaData) && (!ehPerda || lossReason);

  const ehFromClient = oportunidade._fromClient === true;

  const handleConfirmar = async () => {
    setSaving(true);
    try {
      const agora = new Date().toISOString();
      let novoStatus = "Resolvida";

      if (precisaReagendar && novaData) {
        novoStatus = "Reagendada";
      }

      // Atualizar entidade Client quando necessário
      if (oportunidade.cliente_id && (ehVenda || ehPerda || precisaReagendar)) {
        const patch = {};
        if (ehVenda) {
          patch.sale_completed = true;
          patch.sale_status = "Sim";
          patch.status = "Vendido";
          if (valorNegociado) patch.negotiated_value = valorNegociado;
        } else if (ehPerda) {
          patch.sale_completed = false;
          patch.sale_status = "Não";
          patch.status = "Perdido";
          patch.loss_reason = lossReason;
          if (obs) patch.notes = obs;
        } else if (precisaReagendar && novaData) {
          patch.appointment_datetime = novaData;
        }
        if (Object.keys(patch).length > 0) {
          await base44.entities.Client.update(oportunidade.cliente_id, patch);
        }
      }

      // Só tentar atualizar a entidade ExecutionOpportunity se ela realmente existe no banco
      if (!ehFromClient) {
        await base44.entities.ExecutionOpportunity.update(oportunidade.id, {
          status: novoStatus,
          status_detalhe: resultado,
          resultado_resolucao: resultado,
          observacao_resolucao: obs,
          resolvido_em: novoStatus === "Resolvida" ? agora : undefined,
          data_hora_execucao: novaData || oportunidade.data_hora_execucao,
          ativo: novoStatus === "Reagendada",
        });
      }

      toast({ title: ehVenda ? "Venda registrada!" : "Oportunidade resolvida." });
      onResolvida(oportunidade.id, novoStatus, novaData || null);
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao resolver. Tente novamente." });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A] font-bold text-[17px]">Resolver oportunidade</DialogTitle>
        </DialogHeader>

        <div className="mt-1 space-y-1">
          <p className="text-[13px] font-semibold text-[#0F172A]">{oportunidade.nome_cliente_snapshot || "—"}</p>
          <p className="text-[12px] text-slate-400">{oportunidade.tipo} · {oportunidade.descricao}</p>
          {oportunidade.veiculo_snapshot && <p className="text-[12px] text-slate-500">{oportunidade.veiculo_snapshot}</p>}
          <p className="text-[11px] text-slate-400">{moment(oportunidade.data_hora_execucao).format("DD/MM/YYYY HH:mm")}</p>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Como foi resolvido?</label>
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar resultado" /></SelectTrigger>
              <SelectContent>
                {opcoes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {ehVenda && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Negociado (opcional)</label>
              <Input
                value={valorNegociado}
                onChange={e => setValorNegociado(formatCurrency(e.target.value))}
                className="mt-1.5" placeholder="R$ 0,00"
              />
            </div>
          )}

          {ehPerda && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Motivo da Perda</label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar motivo" /></SelectTrigger>
                <SelectContent>
                  {LOSS_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {precisaReagendar && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nova data e horário</label>
              <Input type="datetime-local" value={novaData} onChange={e => setNovaData(e.target.value)} className="mt-1.5" />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Observação (opcional)</label>
            <Input value={obs} onChange={e => setObs(e.target.value)} className="mt-1.5" placeholder="Ex: cliente vai pensar até amanhã..." />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving}
            className="px-5 py-2.5 text-[13px] font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirmar} disabled={!podeConfirmar || saving}
            className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#005BFF] hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors">
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}