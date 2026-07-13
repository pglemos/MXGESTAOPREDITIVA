import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  CalendarDays,
  CalendarClock,
  BarChart3,
  Clock3,
  Eye,
  Globe2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trophy,
  TrendingUp,
  UserRoundCheck,
  WalletCards,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCheckinsByDateRange } from "@/hooks/useCheckins";
import { useSellersByStore } from "@/hooks/useStores";
import { useCheckinAuditor } from "@/hooks/useCheckinAuditor";
import { useNotifications } from "@/hooks/useData";
import { calculateReferenceDate } from "@/hooks/checkins/types";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Typography } from "@/components/atoms/Typography";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/organisms/Modal";
import {
  classifyDiscipline,
  getClosingStatus,
} from "@/features/manager/shared/manager-metrics";
import { AgendaD1Panel } from "@/features/manager/daily-closing/AgendaD1Panel";
import { LeadConferenceModal } from "@/features/manager/daily-closing/LeadConferenceModal";
import { ClosingDetailsModal } from "@/features/manager/daily-closing/ClosingDetailsModal";
import { ManagerHomeReturnLink } from "@/features/manager/home/ManagerHomeReturnLink";
import {
  RegularizationsListModal,
  type RegularizationRequest,
} from "@/features/manager/daily-closing/RegularizationsListModal";
import {
  ManagerSectionCard,
} from "@/features/manager/shared/ManagerVisualPrimitives";
import type {
  CheckinCorrectionRequest,
  CheckinWithTotals,
} from "@/types/database";
import { toast } from "@/lib/toast";
import {
  averageDiscipline,
  buildClosingSummary,
  buildDisciplineTrend,
} from "./manager-closing-metrics";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type PendingRequest = CheckinCorrectionRequest & {
  seller?: { name?: string | null; avatar_url?: string | null } | null;
};

export const PENDING_CLOSING_MESSAGE =
  "Seu Fechamento Diário está pendente. Finalize o registro do dia para que a gestão acompanhe corretamente o movimento comercial.";

export default function ManagerDailyClosing() {
  const { storeId, membership } = useAuth();
  const [date, setDate] = useState(calculateReferenceDate);
  const [historyRange, setHistoryRange] = useState<7 | 15 | 30>(7);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [agenda, setAgenda] = useState<{ open: boolean; sellerId?: string }>({
    open: false,
  });
  const [leadConferenceOpen, setLeadConferenceOpen] = useState(false);
  const [regularizationsOpen, setRegularizationsOpen] = useState(false);
  const [closingDetail, setClosingDetail] = useState<{
    seller: { id: string; name: string };
    checkin?: CheckinWithTotals;
    status: string;
  } | null>(null);
  const [reminding, setReminding] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const historyStart = format(
    subDays(parseISO(date), historyRange - 1),
    "yyyy-MM-dd",
  );
  const {
    sellers,
    loading: sellersLoading,
    refetch: refetchSellers,
  } = useSellersByStore(storeId);
  const {
    checkins,
    loading: checkinsLoading,
    error,
    refetch,
  } = useCheckinsByDateRange(storeId, date, date);
  const { checkins: historyCheckins, refetch: refetchHistory } =
    useCheckinsByDateRange(storeId, historyStart, date);
  const auditor = useCheckinAuditor(storeId || undefined);
  const { sendNotification } = useNotifications();

  const loadRequests = useCallback(async () => {
    setRequestError(null);
    try {
      setRequests((await auditor.fetchPendingRequests()) as PendingRequest[]);
    } catch (loadError) {
      setRequests([]);
      setRequestError(
        loadError instanceof Error
          ? loadError.message
          : "Falha ao carregar regularizações.",
      );
    }
  }, [auditor.fetchPendingRequests]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const rows = useMemo(
    () => getClosingRows(sellers, checkins, requests),
    [sellers, checkins, requests],
  );
  const submitted = rows.filter((row) => row.checkin).length;
  const pending = rows.length - submitted;
  const pendingRows = rows.filter((row) => !row.checkin);
  const movementState = getMovementState(rows.length, submitted);
  const appointments = checkins.reduce(
    (sum, item) => sum + item.agd_cart_today + item.agd_net_today,
    0,
  );
  const disciplineValues = checkins
    .map((item) => item.pontuacao_disciplina_final)
    .filter((value): value is number => typeof value === "number");
  const discipline = disciplineValues.length
    ? Math.round(
        disciplineValues.reduce((a, b) => a + b, 0) / disciplineValues.length,
      )
    : 0;
  const trend = useMemo(
    () => buildDisciplineTrend(historyCheckins, historyStart, date),
    [historyCheckins, historyStart, date],
  );
  const historicalAverage = averageDiscipline(
    trend
      .map((point) => point.value)
      .filter((value): value is number => value !== null),
  );
  const summary = useMemo(() => buildClosingSummary(checkins), [checkins]);

  const refreshAll = async () => {
    await Promise.all([
      refetch(),
      refetchHistory(),
      refetchSellers(),
      loadRequests(),
    ]);
    toast.success("Fechamento da equipe atualizado.");
  };

  const remindPending = async () => {
    if (!pendingRows.length) return;
    setReminding(true);
    const results = await Promise.all(
      pendingRows.map(({ seller }) =>
        sendNotification({
          recipient_id: seller.id,
          title: "Fechamento Diário pendente",
          message: PENDING_CLOSING_MESSAGE,
          type: "checkin",
          priority: "high",
          link: "/fechamento-diario",
        }),
      ),
    );
    const failures = results.filter((result) => result.error).length;
    if (failures)
      toast.error(`${failures} cobrança(s) não puderam ser registradas.`);
    else
      toast.success(
        `Cobrança enviada para ${pendingRows.length} vendedor(es).`,
      );
    setReminding(false);
    setReminderOpen(false);
  };

  const decide = async (
    request: PendingRequest,
    action: "approve" | "reject",
  ) => {
    const result =
      action === "approve"
        ? await auditor.approveRequest(request)
        : await auditor.rejectRequest(
            request.id,
            "Recusado pelo gerente na central de fechamento.",
          );
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      action === "approve"
        ? "Regularização aprovada."
        : "Regularização recusada.",
    );
    await Promise.all([loadRequests(), refetch(), refetchHistory()]);
  };

  if (sellersLoading || checkinsLoading) return <ManagerClosingSkeleton />;

  return (
    <main className="min-h-full bg-surface-alt px-4 py-6" id="main-content">
      <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-5 pb-20">
        <ManagerHomeReturnLink />
        <section className="flex min-h-[148px] items-center rounded-mx-xl border border-border-subtle bg-white p-5 shadow-mx-sm">
          <div className="flex flex-col gap-mx-sm xl:flex-row xl:items-center xl:justify-between xl:gap-mx-lg">
            <div className="max-w-3xl">
              <h1 className="text-xl font-bold leading-7 text-text-primary">
                Fechamento Diário
              </h1>
              <p className="mt-mx-2xs text-[14px] leading-5 text-text-secondary">
                Acompanhe o movimento comercial informado pelos vendedores,
                regularize fechamentos fora do horário e corrija volumes
                oficiais de leads.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-mx-xs xl:w-[320px] xl:grid-cols-[148px_164px] xl:gap-mx-sm">
              <Field label="Data">
                <input
                  id="manager-closing-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-mx-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary xl:h-mx-11"
                />
              </Field>
              <Field label="Unidade">
                <select
                  aria-label="Unidade"
                  value={storeId || ""}
                  onChange={() => undefined}
                  className="h-mx-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold xl:h-mx-11"
                >
                  <option value={storeId || ""}>
                    {membership?.store?.name || "Unidade atual"}
                  </option>
                </select>
              </Field>
              <Button
                variant="success"
                size="sm"
                className="w-fit self-end rounded-xl bg-emerald-600 px-2.5 text-xs font-semibold hover:bg-emerald-700"
                onClick={refreshAll}
              >
                <RefreshCw size={16} />
                Atualizar
              </Button>
            </div>
          </div>
        </section>

        {(error || requestError) && (
          <Card className="border border-status-error/30 bg-status-error-surface p-mx-md">
            <Typography variant="p" tone="error">
              {error ||
                `Não foi possível carregar as regularizações: ${requestError}`}{" "}
              Use Atualizar para tentar novamente.
            </Typography>
          </Card>
        )}

        <section
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumo do fechamento"
        >
          <SummaryCard
            title="Agendamentos"
            value={appointments}
            detail="agendamentos gerados hoje"
            icon={CalendarDays}
            tone="danger"
            status={
              appointments === 0 ? "Ruim" : appointments < 2 ? "Atenção" : "Bom"
            }
            action="Ver Agenda D+1"
            onAction={() => setAgenda({ open: true })}
          />
          <SummaryCard
            title="Pendentes Hoje"
            value={pending}
            detail="fechamentos pendentes do dia"
            icon={Clock3}
            tone="warning"
            status="—"
            action="Cobrar Pendentes"
            actionDisabled={!pendingRows.length || reminding}
            onAction={() => setReminderOpen(true)}
          />
          <SummaryCard
            title="Regularizações"
            value={requests.length}
            detail={
              requests.length ? "aguardando decisão" : "nenhuma pendência"
            }
            icon={ShieldCheck}
            tone="neutral"
            status="—"
            action="Ver Regularizações"
            actionDisabled={!requests.length}
            onAction={() =>
              setRegularizationsOpen(true)
            }
          />
          <DisciplineCard value={discipline} />
        </section>

        <ManagerSectionCard>
          <div id="manager-closing-movement" />
          <div className="flex flex-col gap-mx-sm border-b border-border-subtle px-5 py-[14px] sm:flex-row sm:items-center sm:justify-between">
            <Typography variant="h2" className="!text-base !font-semibold">
              Movimento da Equipe — {format(parseISO(date), "dd/MM/yyyy")}
            </Typography>
            <div className="flex flex-wrap items-center gap-mx-sm">
              <Typography
                variant="tiny"
                tone="muted"
                className="inline-flex items-center gap-1"
              >
                <RefreshCw size={13} />
                Ordenado por entrega (mais recente)
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadConferenceOpen(true)}
                className="border-purple-200 px-3 text-sm font-medium text-purple-700 hover:bg-purple-50"
              >
                <Wrench size={16} />
                Corrigir Leads
              </Button>
            </div>
          </div>
          {movementState === "no-sellers" ? (
            <Empty text="Nenhum vendedor vinculado a este gerente." />
          ) : movementState === "empty" ? (
            <Empty text="Ainda não há fechamentos enviados para a data selecionada." />
          ) : (
            <ClosingTable
              rows={rows}
              requests={requests}
              onDecide={decide}
              onOpenAgenda={(sellerId) => setAgenda({ open: true, sellerId })}
              onOpenDetails={(detail) => setClosingDetail(detail)}
            />
          )}
        </ManagerSectionCard>

        <DisciplineTrendCard
          trend={trend}
          range={historyRange}
          onRange={setHistoryRange}
        />

        <ManagerSectionCard className="p-mx-lg">
          <h2 className="flex items-center gap-mx-xs text-base font-bold text-text-primary">
            <BarChart3 size={18} className="text-status-success" />
            Comparativo de Disciplina do Fechamento
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Comparação com equipes da rede da consultoria
          </p>
          <div className="mt-mx-lg space-y-mx-sm">
            <ComparisonRow
              label="Sua Equipe"
              value={historicalAverage}
              tone="team"
            />
            <ComparisonRow label="Média da Rede" value={null} tone="network" />
            <ComparisonRow label="Top 25% da Rede" value={null} tone="top" />
          </div>
          <p className="mt-mx-md text-center text-xs italic text-text-tertiary">
            Comparativos de rede aparecem quando houver snapshots oficiais
            disponíveis.
          </p>
        </ManagerSectionCard>

        <ManagerSectionCard className="p-mx-lg">
          <h2 className="text-base font-bold text-text-primary">
            Resumo do Fechamento
          </h2>
          <div className="mt-mx-lg grid grid-cols-2 gap-3 xl:grid-cols-6">
            <SummaryGroup
              label="Showroom"
              icon={Store}
              tone="blue"
              items={[["Atendimentos", summary.showroomVisits]]}
            />
            <SummaryGroup
              label="Carteira"
              icon={WalletCards}
              tone="emerald"
              items={[
                ["Leads", summary.carteiraLeads],
                ["Atendimentos", summary.carteiraVisits],
              ]}
            />
            <SummaryGroup
              label="Internet"
              icon={Globe2}
              tone="purple"
              items={[
                ["Leads", summary.internetLeads],
                ["Atendimentos", summary.internetVisits],
              ]}
            />
            <SummaryGroup
              label="Vendas"
              icon={ShoppingCart}
              tone="emerald"
              items={[["Total", summary.sales]]}
            />
            <SummaryGroup
              label="Qualificados"
              icon={UserRoundCheck}
              tone="amber"
              items={[["Total", 0]]}
            />
            <SummaryGroup
              label="Garantia"
              icon={ShieldCheck}
              tone="slate"
              items={[["Total", 0]]}
            />
          </div>
          <p className="mt-mx-md text-center text-xs text-text-tertiary">
            Os leads podem ser corrigidos pelo gerente com registro em
            auditoria. Demais dados permanecem sob responsabilidade do vendedor.
          </p>
        </ManagerSectionCard>

        <AgendaD1Panel
          open={agenda.open}
          onClose={() => setAgenda({ open: false })}
          referenceDate={date}
          sellers={sellers.map((seller) => ({
            id: seller.id,
            name: seller.name,
          }))}
          initialSellerId={agenda.sellerId}
        />
        <PendingReminderModal
          open={reminderOpen}
          pendingRows={pendingRows}
          reminding={reminding}
          onClose={() => setReminderOpen(false)}
          onConfirm={() => void remindPending()}
        />
        <LeadConferenceModal
          open={leadConferenceOpen}
          onClose={() => setLeadConferenceOpen(false)}
          storeId={storeId}
          storeName={membership?.store?.name || "Unidade atual"}
          referenceDate={date}
          sellers={sellers.map((seller) => ({
            id: seller.id,
            name: seller.name,
          }))}
        />
        <RegularizationsListModal
          open={regularizationsOpen}
          requests={requests as RegularizationRequest[]}
          onClose={() => setRegularizationsOpen(false)}
          onApprove={async (request) => {
            setRegularizationsOpen(false);
            await decide(request as PendingRequest, "approve");
          }}
          onReject={async (request) => {
            setRegularizationsOpen(false);
            await decide(request as PendingRequest, "reject");
          }}
        />
        <ClosingDetailsModal
          open={Boolean(closingDetail)}
          seller={closingDetail?.seller || { id: "", name: "" }}
          checkin={closingDetail?.checkin}
          status={closingDetail?.status || "—"}
          onClose={() => setClosingDetail(null)}
          onOpenAgenda={closingDetail ? () => {
            setClosingDetail(null);
            setAgenda({ open: true, sellerId: closingDetail.seller.id });
          } : undefined}
        />
      </div>
    </main>
  );
}

function getClosingRows(
  sellers: Array<{ id: string; name: string }>,
  checkins: CheckinWithTotals[],
  requests: PendingRequest[],
) {
  const requestsBySeller = new Set(
    requests.map((request) => request.seller_id),
  );
  const checkinBySeller = new Map(
    checkins.map((checkin) => [checkin.seller_user_id, checkin]),
  );
  return sellers.map((seller) => ({
    seller,
    checkin: checkinBySeller.get(seller.id),
    status: getClosingStatus(
      checkinBySeller.get(seller.id),
      requestsBySeller.has(seller.id),
    ),
  }));
}

export function PendingReminderModal({
  open,
  pendingRows,
  reminding,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pendingRows: ReturnType<typeof getClosingRows>;
  reminding: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const footer = (
    <div className="grid w-full grid-cols-2 gap-mx-sm">
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        className="bg-amber-600 hover:bg-amber-700"
        disabled={reminding}
        onClick={onConfirm}
      >
        {reminding ? "Enviando…" : "Confirmar Cobrança"}
      </Button>
    </div>
  );
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      referenceStyle
      title="Cobrar Fechamentos Pendentes"
      description={`${pendingRows.length} vendedor(es) pendente(s)`}
      footer={footer}
    >
      <div className="space-y-mx-md">
        <div className="rounded-xl bg-surface-alt p-mx-md">
          <p className="mb-mx-sm text-xs text-text-secondary">
            Vendedores que serão cobrados:
          </p>
          <ul className="space-y-mx-xs">
            {pendingRows.map(({ seller }) => (
              <li
                key={seller.id}
                className="flex items-center gap-mx-xs text-sm text-text-secondary"
              >
                <Megaphone size={14} className="text-amber-500" />
                {seller.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-mx-md">
          <p className="text-xs font-semibold text-amber-700">
            Mensagem padrão enviada:
          </p>
          <p className="mt-mx-xs text-sm italic text-text-primary">
            “{PENDING_CLOSING_MESSAGE}”
          </p>
        </div>
      </div>
    </Modal>
  );
}

export function getMovementState(
  sellerCount: number,
  submittedCount: number,
): "no-sellers" | "empty" | "table" {
  if (sellerCount === 0) return "no-sellers";
  if (submittedCount === 0) return "empty";
  return "table";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 text-mx-tiny font-bold text-text-secondary">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
  status,
  action,
  actionDisabled,
  onAction,
}: {
  title: string;
  value: number;
  detail: string;
  icon: typeof CalendarDays;
  tone: "warning" | "danger" | "neutral";
  status: string;
  action: string;
  actionDisabled?: boolean;
  onAction: () => void;
}) {
  const colors = {
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    danger: "border-red-200 bg-red-50 text-red-600",
    neutral: "border-border-subtle bg-white text-text-secondary",
  }[tone];
  const actionColor =
    tone === "danger"
      ? "border-emerald-200 text-emerald-700"
      : tone === "warning"
        ? "border-amber-300 text-amber-700"
        : "border-indigo-100 text-indigo-300";
  return (
    <Card
      className={`flex h-[164px] flex-col !rounded-[16px] border p-3 shadow-mx-sm ${colors}`}
    >
      <div className="flex items-center justify-between gap-mx-sm">
        <h2 className="flex items-center gap-mx-xs text-xs font-semibold text-text-secondary">
          <Icon size={16} className="shrink-0" />
          {title}
        </h2>
        {status !== "—" && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            {status}
          </span>
        )}
      </div>
      <strong className="mt-2 text-3xl text-text-primary">{value}</strong>
      <p className="mt-1 text-xs text-text-secondary">{detail}</p>
      <button
        type="button"
        disabled={actionDisabled}
        onClick={onAction}
        className={`mt-auto inline-flex h-[30px] items-center justify-center gap-1.5 rounded-[8px] border bg-white px-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${actionColor}`}
      >
        {action === "Ver Agenda D+1" && <CalendarClock size={14} />}
        {action === "Cobrar Pendentes" && <Megaphone size={14} />}
        {action === "Ver Regularizações" && <Eye size={14} />}
        {action}
      </button>
    </Card>
  );
}

function DisciplineCard({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const label = classifyDiscipline(value)
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
    .join(" ");
  return (
    <Card className="flex h-[164px] flex-col !rounded-[16px] border border-red-100 bg-red-50 p-3 shadow-mx-sm">
      <div className="flex items-center justify-between gap-mx-xs">
        <h2 className="text-xs font-semibold text-text-secondary">
          Disciplina Média
        </h2>
        <span className="whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          {label}
        </span>
      </div>
      <div className="mx-auto mt-mx-xs">
        <div
          role="progressbar"
          aria-label="Disciplina média da equipe"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalized}
          className="grid h-24 w-24 place-items-center rounded-full p-2"
          style={{ background: `conic-gradient(rgb(239 68 68) ${normalized * 3.6}deg, white 0deg)` }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-red-100">
            <strong className="text-2xl font-bold text-red-500">{normalized}%</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ClosingTable({
  rows,
  requests,
  onDecide,
  onOpenAgenda,
  onOpenDetails,
}: {
  rows: ReturnType<typeof getClosingRows>;
  requests: PendingRequest[];
  onDecide: (
    request: PendingRequest,
    action: "approve" | "reject",
  ) => Promise<void>;
  onOpenAgenda: (sellerId: string) => void;
  onOpenDetails: (detail: { seller: { id: string; name: string }; checkin?: CheckinWithTotals; status: string }) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px]">
        <thead className="bg-surface-alt">
          <tr>
            {[
              "Vendedor",
              "Status",
              "Entrega",
              "Leads",
              "Qualif.",
              "Agend.",
              "Atendi.",
              "Venda",
              "Disc.",
              "Ações",
            ].map((label) => (
              <th
                key={label}
                className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-wider text-text-tertiary"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map(({ seller, checkin, status }) => (
            <ClosingRow
              key={seller.id}
              name={seller.name}
              checkin={checkin}
              status={status}
              request={requests.find(
                (request) => request.seller_id === seller.id,
              )}
              onDecide={onDecide}
              onOpenAgenda={() => onOpenAgenda(seller.id)}
              onOpenDetails={() => onOpenDetails({ seller, checkin, status })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisciplineTrendCard({
  trend,
  range,
  onRange,
}: {
  trend: Array<{ date: string; label: string; value: number | null }>;
  range: 7 | 15 | 30;
  onRange: (range: 7 | 15 | 30) => void;
}) {
  const hasData = trend.some((point) => point.value !== null);
  return (
    <ManagerSectionCard className="p-mx-lg">
      <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
              <h2 className="flex items-center gap-mx-xs text-base font-bold text-text-primary">
            <TrendingUp size={19} className="text-status-success" />
            Evolução da Disciplina do Fechamento
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Acompanhe se a equipe está mantendo consistência na prestação de
            contas diária.
          </p>
        </div>
        <div className="flex rounded-xl bg-surface-alt p-1">
          {([7, 15, 30] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onRange(option)}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${range === option ? "bg-brand-primary text-white" : "text-text-secondary"}`}
            >
              {option} dias
            </button>
          ))}
        </div>
      </div>
      <div className="mt-mx-md h-[236px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{ top: 18, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="var(--color-border-subtle)"
              />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "var(--color-border-subtle)" }}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                width={42}
              />
              <Line
                type="monotone"
                dataKey="value"
                connectNulls
                  stroke="oklch(0.627 0.194 149.214)"
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                    fill: "oklch(0.627 0.194 149.214)",
                  strokeWidth: 0,
                }}
                label={{
                  position: "top",
                  formatter: (value) =>
                    typeof value === 'number' ? `${value}%` : '',
                  fontSize: 10,
                    fill: "oklch(0.627 0.194 149.214)",
                  fontWeight: 700,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-center text-sm text-text-secondary">
            Ainda não há histórico de disciplina no período selecionado.
          </div>
        )}
      </div>
      <p className="mt-mx-sm text-center text-xs italic text-text-tertiary">
        O dia atual pode aparecer como parcial enquanto houver fechamentos
        pendentes ou regularizações em aberto.
      </p>
    </ManagerSectionCard>
  );
}

function ComparisonRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "team" | "network" | "top";
}) {
  const color =
    tone === "team"
      ? "bg-emerald-500"
      : tone === "top"
        ? "bg-emerald-700"
        : "bg-slate-400";
  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-mx-sm">
      <span className="flex items-center gap-mx-xs text-sm font-semibold text-text-secondary">
        {tone === "top" && <Trophy size={14} />}
        {label}
      </span>
      <div className="relative h-6 overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`flex h-full items-center justify-end rounded-full pr-2 text-xs font-black text-white ${color}`}
          style={{ width: `${value || 0}%` }}
        >
          {value === null ? "" : `${value}%`}
        </div>
        {value === null && (
          <span className="absolute inset-y-0 right-2 grid place-items-center text-xs font-bold text-text-tertiary">
            —
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryGroup({
  label,
  icon: Icon,
  tone,
  items,
}: {
  label: string;
  icon: typeof Store;
  tone: "blue" | "emerald" | "purple" | "amber" | "slate";
  items: Array<[string, number]>;
}) {
  const iconTone = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600",
  }[tone];
  return (
    <div className="min-h-[88px] rounded-xl bg-surface-alt p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${iconTone}`}
        >
          <Icon size={15} />
        </span>
        {label}
      </h3>
      {items.map(([item, value]) => (
        <div key={item} className="mt-2 flex justify-between gap-mx-xs text-xs">
          <span className="text-text-secondary">{item}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ClosingRow({
  name,
  checkin,
  status,
  request,
  onDecide,
  onOpenAgenda,
  onOpenDetails,
}: {
  name: string;
  checkin?: CheckinWithTotals;
  status: string;
  request?: PendingRequest;
  onDecide: (
    request: PendingRequest,
    action: "approve" | "reject",
  ) => Promise<void>;
  onOpenAgenda: () => void;
  onOpenDetails: () => void;
}) {
  const appointments = checkin
    ? checkin.agd_cart_today + checkin.agd_net_today
    : 0;
  const sales = checkin
    ? checkin.vnd_porta_prev_day +
      checkin.vnd_cart_prev_day +
      checkin.vnd_net_prev_day
    : 0;
  const visits = checkin?.visit_prev_day || 0;
  const discipline = checkin?.pontuacao_disciplina_final;
  return (
    <tr>
      <td className="px-mx-md py-mx-sm font-bold text-text-primary">{name}</td>
      <td className="px-mx-md py-mx-sm">
        <Badge
          variant={
            status === "Finalizado"
              ? "success"
              : status === "Pendente"
                ? "danger"
                : "warning"
          }
        >
          {status}
        </Badge>
      </td>
      <td className="px-mx-md py-mx-sm text-sm">
        {checkin?.submitted_at
          ? format(parseISO(checkin.submitted_at), "HH:mm")
          : "—"}
      </td>
      <NumberCell
        value={
          checkin ? checkin.leads_prev_day + checkin.leads_net_prev_day : 0
        }
      />
      <NumberCell value={0} muted />
      <td className="px-mx-md py-mx-sm">
        <button
          type="button"
          className={`rounded-mx-sm px-mx-xs font-black underline decoration-dotted underline-offset-4 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action ${appointments === 0 ? "text-status-error" : appointments === 1 ? "text-status-warning" : "text-status-success"}`}
          aria-label={`Abrir Agenda D+1 de ${name}`}
          onClick={onOpenAgenda}
        >
          {appointments}
        </button>
      </td>
      <NumberCell value={visits} />
      <NumberCell value={sales} />
      <td className="px-mx-md py-mx-sm font-black">
        {typeof discipline === "number" ? `${discipline}%` : "—"}
      </td>
      <td className="px-mx-md py-mx-sm">
        <div className="flex flex-wrap gap-mx-xs">
          <button
            type="button"
            className="inline-flex items-center rounded-mx-sm px-mx-xs text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action"
            aria-label={`Detalhes ${name}`}
            onClick={onOpenDetails}
          >
            <Eye size={13} /> Detalhes
          </button>
          {request ? (
            <>
            <Button
              size="xs"
              variant="success"
              onClick={() => onDecide(request, "approve")}
            >
              Aprovar
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => onDecide(request, "reject")}
            >
              Recusar
            </Button>
            </>
          ) : <Typography variant="tiny" tone="muted">Somente consulta</Typography>}
        </div>
      </td>
    </tr>
  );
}

function NumberCell({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <td
      className={`px-mx-md py-mx-sm font-black ${muted ? "text-text-tertiary" : "text-text-primary"}`}
    >
      {value}
    </td>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="grid min-h-[150px] place-items-center p-mx-xl text-center">
      <Typography variant="p" tone="muted" className="font-semibold">
        {text}
      </Typography>
    </div>
  );
}
function ManagerClosingSkeleton() {
  return (
    <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true">
      <Skeleton className="h-mx-20" />
      <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-mx-32" />
        ))}
      </div>
      <Skeleton className="h-[420px]" />
    </main>
  );
}
