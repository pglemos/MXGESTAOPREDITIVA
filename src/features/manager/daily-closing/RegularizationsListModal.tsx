import type { CheckinFormData } from "@/types/database";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Textarea } from "@/components/atoms/Textarea";
import { Modal } from "@/components/organisms/Modal";
import { format, parseISO } from "date-fns";

export type RegularizationRequest = {
  id: string;
  seller_id: string;
  created_at: string;
  requested_values: CheckinFormData;
  seller?: { name?: string | null; avatar_url?: string | null } | null;
};

type RegularizationsListModalProps = {
  open: boolean;
  requests: RegularizationRequest[];
  onClose: () => void;
  onApprove: (request: RegularizationRequest) => void | Promise<void>;
  onReject: (request: RegularizationRequest) => void | Promise<void>;
  externalDecision?: {
    request: RegularizationRequest;
    action: "approve" | "reject";
  } | null;
  onExternalDecisionHandled?: () => void;
};

export function RegularizationsListModal({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
  externalDecision = null,
  onExternalDecisionHandled,
}: RegularizationsListModalProps) {
  const [decision, setDecision] = useState<{
    request: RegularizationRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setDecision(null);
      setConfirmed(false);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!externalDecision) return;
    setDecision(externalDecision);
    setConfirmed(false);
    onExternalDecisionHandled?.();
  }, [externalDecision, onExternalDecisionHandled]);

  const closeDecision = () => {
    if (saving) return;
    setDecision(null);
    setConfirmed(false);
  };

  const submitDecision = async () => {
    if (!decision || !confirmed) return;
    setSaving(true);
    try {
      if (decision.action === "approve") await onApprove(decision.request);
      else await onReject(decision.request);
      closeDecision();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="2xl"
        referenceStyle
        title="Regularizações Aguardando Aprovação"
        description={`${requests.length} regularização(ões) pendente(s)`}
      >
      {requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Nenhuma regularização aguardando aprovação.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const name = request.seller?.name || request.seller_id;
            const metrics = getRequestedMetrics(request.requested_values);
            return (
              <article key={request.id} className="rounded-xl bg-surface-alt p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {initials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                      <p className="text-xs text-text-secondary">
                        Enviado: {formatRequestDate(request.created_at, request.requested_values.reference_date)}
                      </p>
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full border-4 border-blue-100 text-xs font-bold text-blue-700" aria-label={`Disciplina ${metrics.discipline}%`}>
                    {metrics.discipline}%
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <Metric label="Leads" value={metrics.leads} />
                  <Metric label="Agend." value={metrics.appointments} />
                  <Metric label="Vendas" value={metrics.sales} />
                  <Metric label="Atend." value={metrics.visits} />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => {
                      setDecision({ request, action: "approve" });
                      setConfirmed(false);
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    aria-label={`Aprovar ${name}`}
                  >
                    <Check size={14} /> Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDecision({ request, action: "reject" });
                      setConfirmed(false);
                    }}
                    className="flex-1 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                    aria-label={`Recusar ${name}`}
                  >
                    <X size={14} /> Recusar
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </Modal>
      <RegularizationDecisionModal
        decision={decision}
        confirmed={confirmed}
        saving={saving}
        onClose={closeDecision}
        onConfirmedChange={setConfirmed}
        onSwitchAction={() => {
          setDecision((current) => current ? {
            ...current,
            action: current.action === "approve" ? "reject" : "approve",
          } : current);
          setConfirmed(false);
        }}
        onSubmit={() => void submitDecision()}
      />
    </>
  );
}

function RegularizationDecisionModal({
  decision,
  confirmed,
  saving,
  onClose,
  onConfirmedChange,
  onSwitchAction,
  onSubmit,
}: {
  decision: { request: RegularizationRequest; action: "approve" | "reject" } | null;
  confirmed: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirmedChange: (value: boolean) => void;
  onSwitchAction: () => void;
  onSubmit: () => void;
}) {
  const approve = decision?.action === "approve";
  const sellerName = decision?.request.seller?.name || decision?.request.seller_id || "Vendedor";
  const referenceDate = decision?.request.requested_values.reference_date;
  const actionLabel = approve ? "Aprovar" : "Recusar";
  const confirmationLabel = approve
    ? "Confirmo a aprovação da regularização."
    : "Confirmo a recusa da regularização.";
  const description = approve
    ? "Confirme a aprovação da regularização deste fechamento. Após aprovada, ela passará a contar nos indicadores oficiais conforme as regras da loja."
    : "Confirme a recusa da regularização deste fechamento. O fechamento permanecerá fora dos indicadores oficiais.";

  return (
    <Modal
      open={Boolean(decision)}
      onClose={onClose}
      size="md"
      referenceStyle
      title={`${actionLabel} regularização?`}
      description={`${sellerName} — ${referenceDate ? formatRequestDate("", referenceDate) : "—"}`}
      footer={
        <div className="grid w-full grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={onSwitchAction}
            disabled={saving}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            {approve ? "Recusar" : "Aprovar"}
          </Button>
          <Button
            variant={approve ? "success" : "danger"}
            onClick={onSubmit}
            disabled={!confirmed || saving}
            className={approve ? "disabled:!bg-emerald-600 disabled:!text-white disabled:opacity-40" : "disabled:!bg-red-600 disabled:!text-white disabled:opacity-40"}
          >
            {saving ? "Processando..." : actionLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-7 text-slate-600">
        <p className="text-[20px] leading-8">{description}</p>
        <div>
          <label className="mb-2 block text-[18px] font-semibold text-slate-600" htmlFor="regularization-comment">
            Comentário (opcional)
          </label>
          <Textarea
            id="regularization-comment"
            rows={2}
            placeholder={`Adicione um comentário sobre a ${approve ? "aprovação" : "recusa"}...`}
            className="min-h-[116px] !rounded-[24px] !border-slate-200 !px-6 !py-4 !text-[18px]"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-[20px] leading-7 text-slate-600">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="h-8 w-8 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          {confirmationLabel}
        </label>
      </div>
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><span className="text-text-secondary">{label}: </span><span className="font-semibold text-text-primary">{value}</span></div>;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] || ""}` : parts[0]?.[0] || "?";
}

function formatRequestDate(createdAt: string, referenceDate?: string) {
  const date = referenceDate ? `${referenceDate}T12:00:00` : createdAt;
  try {
    return format(parseISO(date), referenceDate ? "dd/MM/yyyy" : "dd/MM HH:mm");
  } catch {
    return "—";
  }
}

function getRequestedMetrics(values: CheckinFormData) {
  const data = values as CheckinFormData & Record<string, number | undefined>;
  const leads = data.leads ?? (data.leads_cart || 0) + (data.leads_net || 0);
  const appointments = data.agd_total ?? (data.agd_cart_today || 0) + (data.agd_net_today || 0);
  const sales = data.vnd_total ?? (data.vnd_porta_prev_day || 0) + (data.vnd_cart_prev_day || 0) + (data.vnd_net_prev_day || 0);
  const visits = data.visitas ?? data.visit_prev_day ?? (data.visitas_porta_prev_day || 0) + (data.visitas_cart_prev_day || 0) + (data.visitas_net_prev_day || 0);
  const discipline = Math.max(0, Math.min(100, Math.round(data.pontuacao_disciplina_final ?? data.pontuacao_disciplina_base ?? 0)));
  return { leads, appointments, sales, visits, discipline };
}
