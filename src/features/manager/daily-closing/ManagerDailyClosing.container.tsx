import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  CalendarDays,
  CalendarClock,
  BarChart3,
  Check,
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
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCheckinsByDateRange } from "@/hooks/useCheckins";
import { useSellersByStore } from "@/hooks/useStores";
import { useCheckinAuditor } from "@/hooks/useCheckinAuditor";
import { useStoreMetaRules } from "@/hooks/useGoals";
import { useNotifications } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";
import { calculateReferenceDate } from "@/hooks/checkins/types";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Typography } from "@/components/atoms/Typography";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/organisms/Modal";
import {
  classifyDiscipline,
  classifyAppointmentCoverage,
  getClosingStatus,
} from "@/features/manager/shared/manager-metrics";
import { getDiasInfo } from "@/lib/calculations";
import { AgendaD1Panel } from "@/features/manager/daily-closing/AgendaD1Panel";
import { LeadConferenceModal } from "@/features/manager/daily-closing/LeadConferenceModal";
import { ClosingDetailsModal } from "@/features/manager/daily-closing/ClosingDetailsModal";
import { CorrigirLeadsModal } from "@/features/manager/daily-closing/CorrigirLeadsModal";
import type { buildLeadCorrectionPayload } from "@/features/manager/daily-closing/corrigir-leads";
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
  formatClosingMetric,
  sumNumericMetrics,
} from "./manager-closing-metrics";
import { subscribeToManagerClosingRealtime } from "./manager-closing-realtime";
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
  const [regularizationDecision, setRegularizationDecision] = useState<{
    request: RegularizationRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [closingDetail, setClosingDetail] = useState<{
    seller: { id: string; name: string };
    checkin?: CheckinWithTotals;
    status: string;
  } | null>(null);
  const [reminding, setReminding] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [correctingLeads, setCorrectingLeads] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyStart = format(
    subDays(parseISO(date), historyRange - 1),
    "yyyy-MM-dd",
  );
  const metricHistoryStart = format(
    subDays(parseISO(date), 29),
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
  const {
    checkins: metricHistoryCheckins,
    refetch: refetchMetricHistory,
  } = useCheckinsByDateRange(storeId, metricHistoryStart, date);
  const { metaRules } = useStoreMetaRules(storeId || undefined);
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
  const appointments = checkins.length
    ? checkins.reduce((sum, item) => sum + sumNumericMetrics(item.agd_cart_today, item.agd_net_today), 0)
    : null;
  const appointmentNeed = useMemo(() => {
    const goal = Number(metaRules?.monthly_goal || 0);
    if (!Number.isFinite(goal) || goal <= 0) return null;
    const days = getDiasInfo(date, metaRules?.projection_mode || "calendar");
    if (days.total <= 0) return null;
    const sales = metricHistoryCheckins.reduce(
      (sum, item) => sum + sumNumericMetrics(item.vnd_porta_prev_day, item.vnd_cart_prev_day, item.vnd_net_prev_day),
      0,
    );
    if (sales <= 0) return null;
    const appointmentsInBase = metricHistoryCheckins.reduce(
      (sum, item) => sum + sumNumericMetrics(item.agd_cart_today, item.agd_net_today),
      0,
    );
    const appointmentsPerSale = appointmentsInBase / sales;
    if (!Number.isFinite(appointmentsPerSale) || appointmentsPerSale <= 0) return null;
    return Math.ceil((goal / days.total) * appointmentsPerSale);
  }, [date, metaRules, metricHistoryCheckins]);
  const appointmentStatus = classifyAppointmentCoverage(appointments, appointmentNeed);
  const disciplineValues = checkins
    .map((item) => item.pontuacao_disciplina_final)
    .filter((value): value is number => typeof value === "number");
  const discipline = disciplineValues.length
    ? Math.round(
        disciplineValues.reduce((a, b) => a + b, 0) / disciplineValues.length,
      )
    : null;
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

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetch(),
      refetchHistory(),
      refetchMetricHistory(),
      refetchSellers(),
      loadRequests(),
    ]);
    toast.success("Fechamento da equipe atualizado.");
  }, [loadRequests, refetch, refetchHistory, refetchMetricHistory, refetchSellers]);

  useEffect(() => {
    if (!storeId) return;

    const cleanup = subscribeToManagerClosingRealtime({
      client: {
        channel: (name) => supabase.channel(name),
        removeChannel: (channel) => supabase.removeChannel(channel as Parameters<typeof supabase.removeChannel>[0]),
      },
      storeId,
      onChange: () => {
        if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
        realtimeTimerRef.current = setTimeout(() => {
          void Promise.all([
            refetch(),
            refetchHistory(),
            refetchMetricHistory(),
            refetchSellers(),
            loadRequests(),
          ])
            .then(() => setSyncWarning(null))
            .catch(() => setSyncWarning("Falha ao sincronizar automaticamente. Use Atualizar."));
        }, 500);
      },
      onStatus: (status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSyncWarning("Realtime indisponível. Use Atualizar para confirmar os dados.");
          return;
        }
        if (status === "SUBSCRIBED") setSyncWarning(null);
      },
    });

    return () => {
      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current);
        realtimeTimerRef.current = null;
      }
      cleanup();
    };
  }, [loadRequests, refetch, refetchHistory, refetchMetricHistory, refetchSellers, storeId]);

  const remindPending = async () => {
    if (!pendingRows.length) return;
    setReminding(true);
    const results = await Promise.all(
      pendingRows.map(({ seller }) =>
        sendNotification({
          recipient_id: seller.id,
          store_id: storeId || undefined,
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

  const handleCorrectLeads = async (
    payload: ReturnType<typeof buildLeadCorrectionPayload>,
    reason: string,
  ): Promise<{ error: string | null }> => {
    if (!closingDetail?.checkin?.id) {
      return { error: "Fechamento não encontrado para este vendedor." };
    }
    const solicited = await auditor.requestCorrection(
      closingDetail.checkin.id,
      payload,
      reason,
    );
    if (solicited.error || !solicited.id) {
      return { error: solicited.error || "Não foi possível registrar a correção de leads." };
    }
    const applied = await auditor.approveRequest({
      id: solicited.id,
    } as CheckinCorrectionRequest);
    if (applied.error) {
      return { error: applied.error };
    }
    toast.success("Leads corrigidos e auditados.");
    setCorrectingLeads(false);
    setClosingDetail(null);
    await Promise.all([loadRequests(), refetch(), refetchHistory()]);
    return { error: null };
  };

  if (sellersLoading || checkinsLoading) return <ManagerClosingSkeleton />;

  return (
    <main className="min-h-full bg-surface-alt px-3 py-6 sm:px-6" id="main-content">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-20">
        <ManagerHomeReturnLink />
        <section className="flex min-h-[148px] items-center rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-mx-sm xl:flex-row xl:items-center xl:justify-between xl:gap-mx-lg">
            <div className="max-w-3xl">
              <h1 className="text-[22px] font-bold leading-7 text-slate-800">
                Fechamento Diário
              </h1>
              <p className="mt-1 text-[15px] leading-6 text-slate-500">
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

        {syncWarning && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
            {syncWarning}
          </p>
        )}

        <section
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumo do fechamento"
        >
          <SummaryCard
            title="Agendamentos"
            value={formatClosingMetric(appointments, appointments !== null)}
            detail="agendamentos gerados hoje"
            icon={CalendarDays}
            tone={
              appointmentStatus === "Bom" || appointmentStatus === "Excelente"
                ? "success"
                : appointmentStatus === "Regular"
                  ? "warning"
                  : appointmentStatus === "Ruim"
                    ? "danger"
                    : "neutral"
            }
            status={appointmentStatus || "—"}
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
            tone="info"
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
          <div className="flex flex-col gap-mx-sm border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Typography variant="h2" className="!text-[22px] !font-bold">
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
              onReview={(request, action) => {
                setRegularizationsOpen(false);
                setRegularizationDecision({ request, action });
              }}
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

        <ManagerSectionCard className="p-6">
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

        <ManagerSectionCard className="p-6">
          <h2 className="text-base font-bold text-text-primary">
            Resumo do Fechamento
          </h2>
          <div className="mt-mx-lg grid grid-cols-2 gap-3 xl:grid-cols-6">
            <SummaryGroup
              label="Showroom"
              icon={Store}
              tone="blue"
                items={[["Atendimentos", formatClosingMetric(summary.showroomVisits, summary.showroomVisits !== null)]]}
            />
            <SummaryGroup
              label="Carteira"
              icon={WalletCards}
              tone="emerald"
              items={[
                ["Leads", formatClosingMetric(summary.carteiraLeads, summary.carteiraLeads !== null)],
                ["Atendimentos", formatClosingMetric(summary.carteiraVisits, summary.carteiraVisits !== null)],
              ]}
            />
            <SummaryGroup
              label="Internet"
              icon={Globe2}
              tone="purple"
              items={[
                ["Leads", formatClosingMetric(summary.internetLeads, summary.internetLeads !== null)],
                ["Atendimentos", formatClosingMetric(summary.internetVisits, summary.internetVisits !== null)],
              ]}
            />
            <SummaryGroup
              label="Vendas"
              icon={ShoppingCart}
              tone="emerald"
              items={[["Total", formatClosingMetric(summary.sales, summary.sales !== null)]]}
            />
            <SummaryGroup
              label="Qualificados"
              icon={UserRoundCheck}
              tone="amber"
              items={[["Total", "—"]]}
            />
            <SummaryGroup
              label="Garantia"
              icon={ShieldCheck}
              tone="slate"
              items={[["Total", "—"]]}
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
          externalDecision={regularizationDecision}
          onExternalDecisionHandled={() => setRegularizationDecision(null)}
        />
        <ClosingDetailsModal
          open={Boolean(closingDetail)}
          seller={closingDetail?.seller || { id: "", name: "" }}
          checkin={closingDetail?.checkin}
          status={closingDetail?.status || "—"}
          storeName={membership?.store?.name || "—"}
          onClose={() => setClosingDetail(null)}
          onOpenAgenda={closingDetail ? () => {
            setClosingDetail(null);
            setAgenda({ open: true, sellerId: closingDetail.seller.id });
          } : undefined}
          onCorrectLeads={closingDetail?.checkin ? () => setCorrectingLeads(true) : undefined}
        />
        <CorrigirLeadsModal
          open={correctingLeads}
          onClose={() => setCorrectingLeads(false)}
          sellerName={closingDetail?.seller.name || ""}
          checkin={closingDetail?.checkin || null}
          onSubmit={handleCorrectLeads}
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
    <div className="grid w-full grid-cols-2 gap-4">
      <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-950">
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
      <div className="space-y-8">
        <div className="rounded-[24px] bg-slate-50 p-6">
          <p className="mb-4 text-[18px] text-slate-500">
            Vendedores que serão cobrados:
          </p>
          <ul className="space-y-3">
            {pendingRows.map(({ seller }) => (
              <li
                key={seller.id}
                className="flex items-center gap-3 text-[18px] font-medium text-slate-700"
              >
                <Megaphone size={18} className="text-amber-500" />
                {seller.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <p className="text-[18px] font-semibold text-amber-700">
            Mensagem padrão enviada:
          </p>
          <p className="mt-3 text-[20px] italic leading-8 text-slate-700">
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
  value: number | string;
  detail: string;
  icon: typeof CalendarDays;
  tone: "warning" | "danger" | "success" | "info" | "neutral";
  status: string;
  action: string;
  actionDisabled?: boolean;
  onAction: () => void;
}) {
  const colors = {
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    danger: "border-red-200 bg-red-50 text-red-600",
    success: "border-emerald-300 bg-emerald-100 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-600",
    neutral: "border-slate-200 bg-white text-text-secondary",
  }[tone];
  const actionColor =
    tone === "danger" || tone === "success"
      ? "border-emerald-200 text-emerald-700"
      : tone === "warning"
        ? "border-amber-300 text-amber-700"
        : tone === "info"
          ? "border-blue-200 text-blue-600"
          : "border-slate-200 text-slate-500";
  return (
    <Card
      className={`flex min-h-[178px] flex-col !rounded-[20px] border p-5 shadow-sm ${colors}`}
    >
      <div className="flex items-center justify-between gap-mx-sm">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-slate-600">
          <Icon size={19} className="shrink-0" />
          {title}
        </h2>
        {status !== "—" && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "Excelente" || status === "Bom"
              ? "bg-emerald-100 text-emerald-700"
              : status === "Regular"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
          }`}>
            {status}
          </span>
        )}
      </div>
      <strong className="mt-3 text-[42px] leading-none text-slate-800">{value}</strong>
      <p className="mt-2 text-[16px] text-slate-500">{detail}</p>
      <button
        type="button"
        disabled={actionDisabled}
        onClick={onAction}
        className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-[16px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${actionColor}`}
      >
        {action === "Ver Agenda D+1" && <CalendarClock size={14} />}
        {action === "Cobrar Pendentes" && <Megaphone size={14} />}
        {action === "Ver Regularizações" && <Eye size={14} />}
        {action}
      </button>
    </Card>
  );
}

function DisciplineCard({ value }: { value: number | null }) {
  const normalized = value === null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  const label = value === null ? "Sem dados oficiais" : classifyDiscipline(value)
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
    .join(" ");
  return (
    <Card className="flex min-h-[178px] flex-col !rounded-[20px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-mx-xs">
        <h2 className="text-[16px] font-semibold text-slate-600">
          Disciplina Média
        </h2>
        <span className="whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
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
          style={{ background: `conic-gradient(rgb(59 130 246) ${normalized * 3.6}deg, rgb(219 234 254) 0deg)` }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-blue-50">
            <strong className="text-2xl font-bold text-blue-500">{value === null ? "—" : `${normalized}%`}</strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ClosingTable({
  rows,
  requests,
  onReview,
  onOpenAgenda,
  onOpenDetails,
}: {
  rows: ReturnType<typeof getClosingRows>;
  requests: PendingRequest[];
  onReview: (
    request: PendingRequest,
    action: "approve" | "reject",
  ) => void;
  onOpenAgenda: (sellerId: string) => void;
  onOpenDetails: (detail: { seller: { id: string; name: string }; checkin?: CheckinWithTotals; status: string }) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1440px] table-fixed">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[18%]" />
          <col className="w-[8%]" />
          <col className="w-[6%]" />
          <col className="w-[7%]" />
          <col className="w-[7%]" />
          <col className="w-[8%]" />
          <col className="w-[7%]" />
          <col className="w-[8%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead className="bg-slate-50">
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
                className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ seller, checkin, status }) => (
            <ClosingRow
              key={seller.id}
              name={seller.name}
              checkin={checkin}
              status={status}
              request={requests.find(
                (request) => request.seller_id === seller.id,
              )}
              onReview={onReview}
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
  items: Array<[string, number | string]>;
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

function DisciplineRing({ value }: { value: number | null | undefined }) {
  if (typeof value !== "number") return <span className="text-slate-400">—</span>;
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const color = normalized < 70 ? "rgb(249 115 22)" : normalized < 90 ? "rgb(59 130 246)" : "rgb(16 185 129)";
  return <span className="grid h-11 w-11 place-items-center rounded-full p-1 text-[11px] font-bold" style={{ background: `conic-gradient(${color} ${normalized * 3.6}deg, rgb(241 245 249) 0deg)`, color }}><span className="grid h-full w-full place-items-center rounded-full bg-white">{normalized}%</span></span>;
}

function ClosingRow({
  name,
  checkin,
  status,
  request,
  onReview,
  onOpenAgenda,
  onOpenDetails,
}: {
  name: string;
  checkin?: CheckinWithTotals;
  status: string;
  request?: PendingRequest;
  onReview: (
    request: PendingRequest,
    action: "approve" | "reject",
  ) => void;
  onOpenAgenda: () => void;
  onOpenDetails: () => void;
}) {
  const appointments = checkin
    ? sumNumericMetrics(checkin.agd_cart_today, checkin.agd_net_today)
    : null;
  const sales = checkin
    ? sumNumericMetrics(checkin.vnd_porta_prev_day, checkin.vnd_cart_prev_day, checkin.vnd_net_prev_day)
    : null;
  const visits = checkin ? sumNumericMetrics(checkin.visit_prev_day) : null;
  const discipline = checkin?.pontuacao_disciplina_final;
  return (
    <tr className="bg-white">
      <td className="px-5 py-5 text-[16px] font-bold text-slate-800">
        <span className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">{initials(name)}</span>{name}</span>
      </td>
      <td className="px-5 py-5">
        <Badge
          variant="outline"
          className={`w-fit whitespace-nowrap border-0 px-3 py-1.5 shadow-none ${status === "Finalizado" ? "bg-emerald-100 text-emerald-700" : status === "Pendente" ? "bg-amber-100 text-amber-700" : status === "Fora do horário" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
        >
          {status}
        </Badge>
      </td>
      <td className="px-5 py-5 text-[16px] text-slate-600">
        {checkin?.submitted_at
          ? format(parseISO(checkin.submitted_at), "HH:mm")
          : "—"}
      </td>
      <NumberCell
        value={
          checkin ? sumNumericMetrics(checkin.leads_prev_day, checkin.leads_net_prev_day) : null
        }
      />
      <NumberCell value="—" muted />
      <td className="px-5 py-5">
        <button
          type="button"
          className={`rounded-mx-sm px-mx-xs font-black underline decoration-dotted underline-offset-4 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus:ring-mx-action ${appointments === null ? "text-text-tertiary" : appointments === 0 ? "text-status-error" : appointments === 1 ? "text-status-warning" : "text-status-success"}`}
          aria-label={`Abrir Agenda D+1 de ${name}`}
          onClick={onOpenAgenda}
        >
          {appointments === null ? "—" : appointments}
        </button>
      </td>
      <NumberCell value={visits} />
      <NumberCell value={sales} />
      <td className="px-5 py-5">
        <DisciplineRing value={discipline} />
      </td>
      <td className="px-5 py-5">
        <div className="flex min-w-max items-center gap-4 whitespace-nowrap">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg px-1 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Detalhes ${name}`}
            onClick={onOpenDetails}
          >
            <Eye size={13} /> Detalhes
          </button>
          {request ? (
            <>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800" onClick={() => onReview(request, "approve")}><Check size={16} /> Aprovar</button>
            <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700" onClick={() => onReview(request, "reject")}><X size={16} /> Recusar</button>
            </>
          ) : <Typography variant="tiny" tone="muted">Somente consulta</Typography>}
        </div>
      </td>
    </tr>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] || ""}` : parts[0]?.[0] || "?";
}

function NumberCell({ value, muted }: { value: number | string | null; muted?: boolean }) {
  return (
    <td
      className={`px-5 py-5 text-[16px] font-semibold ${muted ? "text-slate-400" : "text-slate-700"}`}
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
