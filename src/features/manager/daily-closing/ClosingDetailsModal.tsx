import { CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/organisms/Modal";
import type { CheckinWithTotals } from "@/types/database";

type ClosingDetailsModalProps = {
  open: boolean;
  seller: { id: string; name: string };
  checkin?: Partial<CheckinWithTotals> | null;
  status: string;
  onOpenAgenda?: () => void;
  onClose: () => void;
};

export function ClosingDetailsModal({
  open,
  seller,
  checkin,
  status,
  onOpenAgenda,
  onClose,
}: ClosingDetailsModalProps) {
  const referenceDate = checkin?.reference_date || "";
  const delivery = checkin?.submitted_at ? formatDateTime(checkin.submitted_at) : "—";
  const discipline = typeof checkin?.pontuacao_disciplina_final === "number"
    ? `${checkin.pontuacao_disciplina_final}%`
    : "—";
  const appointments = (checkin?.agd_cart_today || 0) + (checkin?.agd_net_today || 0);
  const sales = (checkin?.vnd_porta_prev_day || 0) + (checkin?.vnd_cart_prev_day || 0) + (checkin?.vnd_net_prev_day || 0);
  const leads = (checkin?.leads_prev_day || 0) + (checkin?.leads_net_prev_day || 0);
  const visits = checkin?.visit_prev_day || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      referenceStyle
      title={`Detalhes do Fechamento — ${seller.name}`}
      description={referenceDate ? formatDate(referenceDate) : "—"}
      footer={onOpenAgenda ? (
        <Button type="button" variant="outline" onClick={onOpenAgenda} className="text-emerald-700">
          <CalendarClock size={15} /> Ver Agenda D+1 deste vendedor
        </Button>
      ) : undefined}
    >
      <div className="space-y-5">
        <Section title="Dados Gerais">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vendedor" value={seller.name} />
            <Field label="Data" value={referenceDate ? formatDate(referenceDate) : "—"} />
            <Field label="Status" value={status} />
            <Field label="Horário de entrega" value={delivery} />
            <Field label="Disciplina" value={discipline} />
          </div>
        </Section>

        <Section title="Movimento por Canal">
          <div className="space-y-2">
            <Channel name="Showroom" values={[["Atendimentos", checkin?.visit_prev_day || 0]]} />
            <Channel name="Carteira" values={[["Leads", checkin?.leads_prev_day || 0], ["Agendamentos", checkin?.agd_cart_today || 0]]} />
            <Channel name="Internet" values={[["Leads", checkin?.leads_net_prev_day || 0], ["Agendamentos", checkin?.agd_net_today || 0]]} />
          </div>
        </Section>

        <Section title="Registros do Dia">
          <div className="grid grid-cols-2 gap-3">
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
  return <section><h3 className="mb-2 text-sm font-semibold text-text-secondary">{title}</h3>{children}</section>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-surface-alt p-2.5"><p className="mb-0.5 text-xs text-text-secondary">{label}</p><div className="text-sm font-medium text-text-primary">{value}</div></div>;
}

function Channel({ name, values }: { name: string; values: Array<[string, number]> }) {
  return <div className="rounded-xl bg-surface-alt p-3"><p className="mb-2 text-xs font-semibold text-text-secondary">{name}</p><div className="flex flex-wrap gap-4">{values.map(([label, value]) => <div key={label}><span className="text-xs text-text-secondary">{label}: </span><span className="text-sm font-semibold text-text-primary">{value}</span></div>)}</div></div>;
}

function formatDate(value: string) {
  try { return format(parseISO(value), "dd/MM/yyyy"); } catch { return "—"; }
}

function formatDateTime(value: string) {
  try { return format(parseISO(value), "dd/MM/yyyy HH:mm"); } catch { return "—"; }
}
