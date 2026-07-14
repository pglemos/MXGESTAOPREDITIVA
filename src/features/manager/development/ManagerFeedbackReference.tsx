import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from 'react-router-dom'
import {
  addDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { useStoreFeedback } from "@/features/gerente-feedback/hooks/useStoreFeedback";
import {
  getFeedbackSellerName,
  type FeedbackListItem,
} from "@/features/gerente-feedback/lib/helpers";
import { ManagerFeedbackModal } from './ManagerFeedbackModal'
import { buildManagerFeedbackFormData, type ManagerFeedbackDraft } from './manager-feedback-draft'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ManagerDataErrorState } from './ManagerDataErrorState'

type PeriodFilter = "current" | "previous" | "last30";
type KindFilter = "all" | "positive" | "development";
type StatusFilter = "all" | "pending" | "acknowledged";
const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500";

export default function ManagerFeedbackReference() {
  const vm = useStoreFeedback();
  const [params] = useSearchParams()
  const sellers = useMemo(
    () => vm.sellers.filter((seller) => seller.role === "vendedor"),
    [vm.sellers],
  );
  const [period, setPeriod] = useState<PeriodFilter>("current");
  const [sellerId, setSellerId] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [competency, setCompetency] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [detail, setDetail] = useState<FeedbackListItem | null>(null);
  const preselectedSeller = useMemo(() => {
    const requestedName = params.get('novoFeedback')?.trim().toLocaleLowerCase('pt-BR')
    return requestedName ? sellers.find(seller => seller.name.toLocaleLowerCase('pt-BR') === requestedName)?.id || '' : ''
  }, [params, sellers])

  const competencies = useMemo(
    () =>
      Array.from(
        new Set(vm.filteredFeedbacks.map(feedbackCompetency).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right, "pt-BR")),
    [vm.filteredFeedbacks],
  );
  const feedbacks = useMemo(
    () =>
      vm.filteredFeedbacks.filter((item) => {
        if (!inPeriod(item.created_at, period)) return false;
        if (sellerId && item.seller_id !== sellerId) return false;
        if (kind === "positive" && !item.positives?.trim()) return false;
        if (kind === "development" && !item.attention_points?.trim())
          return false;
        if (competency && feedbackCompetency(item) !== competency) return false;
        if (status === "pending" && item.acknowledged) return false;
        if (status === "acknowledged" && !item.acknowledged) return false;
        return true;
      }),
    [competency, kind, period, sellerId, status, vm.filteredFeedbacks],
  );

  const positiveCount = feedbacks.filter((item) =>
    Boolean(item.positives?.trim()),
  ).length;
  const developmentCount = feedbacks.filter((item) =>
    Boolean(item.attention_points?.trim()),
  ).length;
  const pendingCount = feedbacks.filter((item) => !item.acknowledged).length;

  if (vm.isLoading)
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );

  if (vm.error)
    return <ManagerDataErrorState title="Não foi possível carregar os feedbacks." />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Feedback</h2>
          <p className="text-sm text-gray-500">
            Reconheça boas práticas, oriente mudanças e acompanhe os
            compromissos da equipe.
          </p>
        </div>
        {vm.canCreateFeedback && (
          <button
            type="button"
            onClick={() => vm.setShowForm(true)}
            className="flex h-10 items-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus size={15} />
            Novo Feedback
          </button>
        )}
      </div>

      <section
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        aria-label="Resumo de feedbacks"
      >
        <FeedbackStat
          label="Feedbacks no período"
          value={feedbacks.length}
          icon={MessageSquare}
          tone="emerald"
        />
        <FeedbackStat
          label="Positivos"
          value={positiveCount}
          icon={CheckCircle2}
          tone="blue"
        />
        <FeedbackStat
          label="Desenvolvimento"
          value={developmentCount}
          icon={TrendingUp}
          tone="amber"
        />
        <FeedbackStat
          label="Aguardando ciência"
          value={pendingCount}
          icon={Clock}
          tone="indigo"
        />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Filter label="Período">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as PeriodFilter)
              }
              className={FIELD_CLASS}
            >
              <option value="current">Mês atual</option>
              <option value="previous">Mês anterior</option>
              <option value="last30">Últimos 30 dias</option>
            </select>
          </Filter>
          <Filter label="Vendedor">
            <select
              value={sellerId}
              onChange={(event) => setSellerId(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Todos</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Tipo">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as KindFilter)}
              className={FIELD_CLASS}
            >
              <option value="all">Todos</option>
              <option value="positive">Com reconhecimento</option>
              <option value="development">Com desenvolvimento</option>
            </select>
          </Filter>
          <Filter label="Competência">
            <select
              value={competency}
              onChange={(event) => setCompetency(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Todas</option>
              {competencies.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Status">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
              className={FIELD_CLASS}
            >
              <option value="all">Todos</option>
              <option value="pending">Aguardando ciência</option>
              <option value="acknowledged">Ciência registrada</option>
            </select>
          </Filter>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {feedbacks.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {[
                    "Data",
                    "Vendedor",
                    "Tipo",
                    "Competência",
                    "Situação",
                    "Compromisso",
                    "Semana",
                    "Status",
                    "Ações",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {getFeedbackSellerName(item)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${item.attention_points?.trim() ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {item.attention_points?.trim()
                          ? "Desenvolvimento"
                          : "Positivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {feedbackCompetency(item) || "—"}
                    </td>
                    <td className="max-w-56 truncate px-4 py-3 text-gray-600">
                      {item.attention_points || item.positives || "—"}
                    </td>
                    <td className="max-w-56 truncate px-4 py-3 text-gray-600">
                      {item.action || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(item.week_reference)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${item.acknowledged ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}
                      >
                        {item.acknowledged
                          ? "Ciência registrada"
                          : "Aguardando ciência"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="text-xs font-medium text-blue-600"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => vm.handleShareWhatsApp(item)}
                          className="text-xs font-medium text-emerald-600"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Nenhum feedback registrado no período.
            </p>
          </div>
        )}
      </section>

      <ManagerFeedbackModal
        open={vm.showForm}
        onClose={() => vm.setShowForm(false)}
        saving={vm.saving}
        sellers={sellers}
        initialDate={format(new Date(), 'yyyy-MM-dd')}
        preselectedSeller={preselectedSeller}
        onSubmit={(draft: ManagerFeedbackDraft) => {
          void vm.handleSubmit(buildManagerFeedbackFormData(draft, vm.formData)).then(saved => { if (saved) vm.setShowForm(false) })
        }}
      />
      {detail && (
        <FeedbackDetail feedback={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function FeedbackStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
  tone: "emerald" | "blue" | "amber" | "indigo";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ${styles[tone]}`}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </article>
  );
}
function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs text-gray-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
export function FeedbackDetail({
  feedback,
  onClose,
}: {
  feedback: FeedbackListItem;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useFocusTrap(dialogRef, true)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/30 p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do Feedback"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Detalhes do Feedback
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          <Detail label="Vendedor" value={getFeedbackSellerName(feedback)} />
          <Detail label="Semana" value={formatDate(feedback.week_reference)} />
          <Detail label="Pontos positivos" value={feedback.positives || "—"} />
          <Detail
            label="Pontos de atenção"
            value={feedback.attention_points || "—"}
          />
          <Detail label="Compromisso" value={feedback.action || "—"} />
          <Detail label="Observações" value={feedback.notes || "—"} />
        </dl>
      </section>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 leading-6 text-gray-700">{value}</dd>
    </div>
  );
}
function feedbackCompetency(item: FeedbackListItem) {
  const diagnostic =
    item.diagnostic_json &&
    typeof item.diagnostic_json === "object" &&
    !Array.isArray(item.diagnostic_json)
      ? (item.diagnostic_json as Record<string, unknown>)
      : {};
  const value =
    diagnostic.competencia || diagnostic.gargalo || diagnostic.principal_metric;
  return typeof value === "string" ? value : "";
}
function inPeriod(value: string, period: PeriodFilter) {
  try {
    const date = parseISO(value);
    const today = new Date();
    const interval =
      period === "previous"
        ? {
            start: startOfMonth(subMonths(today, 1)),
            end: endOfMonth(subMonths(today, 1)),
          }
        : period === "last30"
          ? { start: addDays(today, -29), end: addDays(today, 1) }
          : { start: startOfMonth(today), end: addDays(today, 1) };
    return isWithinInterval(date, interval);
  } catch {
    return false;
  }
}
function formatDate(value: string) {
  try {
    return format(parseISO(value), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}
