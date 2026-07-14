import { CalendarClock, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/organisms/Modal";
import type { CheckinWithTotals } from "@/types/database";

export type ClosingDetailsModalProps = {
  open: boolean;
  seller: { id: string; name: string };
  checkin?: Partial<CheckinWithTotals> | null;
  status: string;
  storeName?: string;
  onOpenAgenda?: () => void;
  onCorrectLeads?: () => void;
  onClose: () => void;
};

export function ClosingDetailsModal({
  open,
  seller,
  checkin,
  status,
  storeName,
  onOpenAgenda,
  onCorrectLeads,
  onClose,
}: ClosingDetailsModalProps) {
  const { membership } = useAuth();
  const unit = storeName || membership?.store?.name || "Unidade atual";
  const referenceDate = checkin?.reference_date || "";
  const delivery = checkin?.submitted_at
    ? formatDateTime(checkin.submitted_at)
    : "—";
  const discipline =
    typeof checkin?.pontuacao_disciplina_final === "number"
      ? Math.round(checkin.pontuacao_disciplina_final)
      : null;
  const appointments = sumMetrics(
    checkin?.agd_cart_today,
    checkin?.agd_net_today,
  );
  const sales = sumMetrics(
    checkin?.vnd_porta_prev_day,
    checkin?.vnd_cart_prev_day,
    checkin?.vnd_net_prev_day,
  );
  const leads = sumMetrics(
    checkin?.leads_prev_day,
    checkin?.leads_net_prev_day,
  );
  const visits = metric(checkin?.visit_prev_day);

  const footer = onOpenAgenda || onCorrectLeads ? (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      {onCorrectLeads ? (
        <button
          type="button"
          onClick={onCorrectLeads}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          <Pencil size={15} /> Corrigir leads
        </button>
      ) : (
        <span />
      )}
      {onOpenAgenda && (
        <button
          type="button"
          onClick={onOpenAgenda}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <CalendarClock size={16} /> Ver Agenda D+1 deste vendedor
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      referenceStyle
      title={`Detalhes do Fechamento — ${seller.name}`}
      description={referenceDate ? formatDate(referenceDate) : "—"}
      footer={footer}
    >
      <div className="space-y-5">
        <Section title="Dados Gerais">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Vendedor" value={seller.name} />
            <Field label="Unidade" value={unit} />
            <Field
              label="Data"
              value={referenceDate ? formatDate(referenceDate) : "—"}
            />
            <Field label="Status" value={<StatusBadge status={status} />} />
            <Field label="Horário de entrega" value={delivery} />
            <Field
              label="Disciplina"
              value={<DisciplineRing value={discipline} />}
            />
          </div>
        </Section>

        <Section title="Movimento por Canal">
          <div className="space-y-2">
            <Channel
              name="Showroom"
              values={[["Atendimentos", metric(checkin?.visit_prev_day)]]}
            />
            <Channel
              name="Carteira"
              values={[
                ["Leads", metric(checkin?.leads_prev_day)],
                ["Atendimentos", metric(checkin?.visitas_cart_prev_day)],
                ["Agendamentos", metric(checkin?.agd_cart_today)],
              ]}
            />
            <Channel
              name="Internet"
              values={[
                ["Leads", metric(checkin?.leads_net_prev_day)],
                ["Atendimentos", metric(checkin?.visitas_net_prev_day)],
                ["Agendamentos", metric(checkin?.agd_net_today)],
              ]}
            />
          </div>
        </Section>

        <Section title="Registros do Dia">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Leads cadastrados" value={leads} />
            <Field label="Agendamentos cadastrados" value={appointments} />
            <Field label="Vendas cadastradas" value={sales} />
            <Field label="Atendimentos cadastrados" value={visits} />
          </div>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-base font-semibold text-gray-700">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-h-[88px] rounded-xl bg-gray-50 p-3">
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <div className="text-base font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function Channel({
  name,
  values,
}: {
  name: string;
  values: Array<[string, number | string]>;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-700">{name}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {values.map(([label, value]) => (
          <div key={label}>
            <span className="text-sm text-gray-500">{label}: </span>
            <span className="text-sm font-semibold text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = status.toLocaleLowerCase("pt-BR").includes("fora")
    ? "bg-red-100 text-red-700"
    : status.toLocaleLowerCase("pt-BR").includes("aguardando")
      ? "bg-blue-100 text-blue-700"
      : status.toLocaleLowerCase("pt-BR").includes("recus")
        ? "bg-red-100 text-red-700"
        : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

function DisciplineRing({ value }: { value: number | null }) {
  const normalized = value === null ? 0 : Math.max(0, Math.min(100, value));
  const color =
    normalized >= 90
      ? "#10b981"
      : normalized >= 70
        ? "#3b82f6"
        : normalized >= 40
          ? "#f97316"
          : "#ef4444";
  return (
    <div
      aria-label={`Disciplina ${value === null ? "indisponível" : `${value}%`}`}
      className="grid h-12 w-12 place-items-center rounded-full p-1"
      style={{
        background: `conic-gradient(${color} ${normalized * 3.6}deg, #e5e7eb 0deg)`,
      }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-gray-50">
        <span className="text-[11px] font-bold" style={{ color }}>
          {value === null ? "—" : `${value}%`}
        </span>
      </div>
    </div>
  );
}

function metric(value: number | null | undefined): number | string {
  return typeof value === "number" && Number.isFinite(value) ? value : "—";
}

function sumMetrics(
  ...values: Array<number | null | undefined>
): number | string {
  return values.every(
    (value) => typeof value === "number" && Number.isFinite(value),
  )
    ? values.reduce<number>(
        (sum, value) => sum + (typeof value === "number" ? value : 0),
        0,
      )
    : "—";
}

function formatDate(value: string) {
  try {
    return format(parseISO(value), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function formatDateTime(value: string) {
  try {
    return format(parseISO(value), "dd/MM/yyyy HH:mm");
  } catch {
    return "—";
  }
}
