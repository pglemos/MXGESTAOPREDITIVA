import { useState } from "react";
import type { CheckinFormData } from "@/types/database";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/organisms/Modal";
import { format, parseISO } from "date-fns";
import {
  RegularizationDecisionModal,
  type RegularizationDecision,
} from "./RegularizationDecisionModal";

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
  onApprove: (
    request: RegularizationRequest,
    comment: string,
  ) => void | Promise<void>;
  onReject: (
    request: RegularizationRequest,
    reason: string,
  ) => void | Promise<void>;
};

type PendingDecision = {
  request: RegularizationRequest;
  action: RegularizationDecision;
};

export function RegularizationsListModal({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
}: RegularizationsListModalProps) {
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [saving, setSaving] = useState(false);

  const confirmDecision = async (comment: string) => {
    if (!decision) return;
    setSaving(true);
    try {
      if (decision.action === "approve") {
        await onApprove(decision.request, comment);
      } else {
        await onReject(decision.request, comment);
      }
      setDecision(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        referenceStyle
        title="Regularizações Aguardando Aprovação"
        description={`${requests.length} regularização(ões) pendente(s)`}
      >
        {requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhuma regularização aguardando aprovação.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const name = request.seller?.name || request.seller_id;
              const metrics = getRequestedMetrics(request.requested_values);
              return (
                <article key={request.id} className="rounded-xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Entrega: {formatRequestDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="grid h-9 w-9 place-items-center rounded-full border-4 border-blue-100 text-xs font-bold text-blue-700"
                      aria-label={`Disciplina ${metrics.discipline}%`}
                    >
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
                    <button
                      type="button"
                      onClick={() => setDecision({ request, action: "approve" })}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                      aria-label={`Aprovar ${name}`}
                    >
                      <Check size={14} /> Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision({ request, action: "reject" })}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                      aria-label={`Recusar ${name}`}
                    >
                      <X size={14} /> Recusar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Modal>

      <RegularizationDecisionModal
        open={Boolean(decision)}
        action={decision?.action || "approve"}
        request={decision?.request || null}
        saving={saving}
        onClose={() => {
          if (!saving) setDecision(null);
        }}
        onConfirm={confirmDecision}
      />
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function formatRequestDate(createdAt: string) {
  try {
    return format(parseISO(createdAt), "dd/MM HH:mm");
  } catch {
    return "—";
  }
}

function getRequestedMetrics(values: CheckinFormData) {
  const data = values as CheckinFormData & Record<string, number | undefined>;
  const leads = data.leads ?? (data.leads_cart || 0) + (data.leads_net || 0);
  const appointments =
    data.agd_total ?? (data.agd_cart_today || 0) + (data.agd_net_today || 0);
  const sales =
    data.vnd_total ??
    (data.vnd_porta_prev_day || 0) +
      (data.vnd_cart_prev_day || 0) +
      (data.vnd_net_prev_day || 0);
  const visits =
    data.visitas ??
    data.visit_prev_day ??
    (data.visitas_porta_prev_day || 0) +
      (data.visitas_cart_prev_day || 0) +
      (data.visitas_net_prev_day || 0);
  const discipline = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        data.pontuacao_disciplina_final ??
          data.pontuacao_disciplina_base ??
          0,
      ),
    ),
  );
  return { leads, appointments, sales, visits, discipline };
}
