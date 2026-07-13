import type { CheckinFormData } from "@/types/database";
import { Check, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
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
};

export function RegularizationsListModal({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
}: RegularizationsListModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
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
                    onClick={() => void onApprove(request)}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    aria-label={`Aprovar ${name}`}
                  >
                    <Check size={14} /> Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void onReject(request)}
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
