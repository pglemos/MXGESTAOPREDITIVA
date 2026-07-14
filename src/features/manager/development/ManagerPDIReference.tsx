import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  Map as MapIcon,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WizardPDI } from "@/features/pdi/WizardPDI";
import { useAuth } from "@/hooks/useAuth";
import { usePDISessions, type PDISessionSummary } from "@/hooks/usePDI_MX";
import { useSellersByStore } from "@/hooks/useStores";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ManagerDataErrorState } from './ManagerDataErrorState'

type InternalTab = "mine" | "team";
type StatusFilter = "all" | "none" | "active" | "overdue" | "completed";
const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500";

export default function ManagerPDIReference() {
  const navigate = useNavigate();
  const { profile, storeId } = useAuth();
  const { pdis, loading, error, refetch } = usePDISessions();
  const { sellers, loading: sellersLoading, error: sellersError } = useSellersByStore(storeId);
  const [tab, setTab] = useState<InternalTab>("team");
  const [sellerId, setSellerId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showWizard, setShowWizard] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const today = localDateKey(new Date());

  const rows = useMemo(
    () =>
      sellers.map((seller) => {
        const pdi =
          pdis.find(
            (item) =>
              item.colaborador_id === seller.id && !isCompleted(item.status),
          ) ||
          pdis.find((item) => item.colaborador_id === seller.id) ||
          null;
        const status = pdiStatus(pdi, today);
        const actions = pdi?.plano_acao || [];
        const completedActions = actions.filter((action) =>
          isActionDone(action.status),
        ).length;
        const progress = actions.length
          ? Math.round((completedActions / actions.length) * 100)
          : 0;
        const overdueActions = actions.filter(
          (action) =>
            !isActionDone(action.status) && action.data_conclusao < today,
        ).length;
        return { seller, pdi, status, progress, overdueActions };
      }),
    [pdis, sellers, today],
  );

  const filteredRows = rows
    .filter(
      (row) =>
        (!sellerId || row.seller.id === sellerId) &&
        (statusFilter === "all" || row.status.key === statusFilter),
    )
    .sort((left, right) => left.status.rank - right.status.rank);
  const active = pdis.filter((item) => !isCompleted(item.status)).length;
  const overdue = pdis.filter(
    (item) => pdiStatus(item, today).key === "overdue",
  ).length;
  const overdueActions = pdis
    .flatMap((item) => item.plano_acao || [])
    .filter(
      (action) => !isActionDone(action.status) && action.data_conclusao < today,
    ).length;
  const myPdi =
    pdis.find((item) => item.colaborador_id === profile?.id) || null;

  if (loading || sellersLoading)
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );

  if (sellersError)
    return <ManagerDataErrorState title="Não foi possível carregar os vendedores." />

  if (error)
    return <ManagerDataErrorState title="Não foi possível carregar os PDIs." />

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">PDI</h2>
        <p className="text-sm text-gray-500">
          Desenvolva competências por meio de avaliações, ações práticas e
          acompanhamentos periódicos.
        </p>
      </div>
      <nav
        className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        role="tablist"
        aria-label="PDI"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mine"}
          onClick={() => setTab("mine")}
          className={`px-6 py-3 text-sm font-medium ${tab === "mine" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-gray-500"}`}
        >
          Meu PDI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "team"}
          onClick={() => setTab("team")}
          className={`px-6 py-3 text-sm font-medium ${tab === "team" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-gray-500"}`}
        >
          PDI da Equipe
        </button>
      </nav>

      {tab === "mine" ? (
        <MyManagerPDI
          pdi={myPdi}
          onOpen={(id) => navigate(`/pdi/${id}/print`)}
        />
      ) : (
        <>
          <section
            className="grid grid-cols-2 gap-4 xl:grid-cols-4"
            aria-label="Resumo de PDIs"
          >
            <PDIStat
              label="Revisões a realizar"
              value={
                pdis.filter(
                  (item) =>
                    item.due_date &&
                    item.due_date >= today &&
                    !isCompleted(item.status),
                ).length
              }
              icon={Calendar}
              tone="blue"
            />
            <PDIStat
              label="PDIs ativos"
              value={active}
              icon={FileText}
              tone="emerald"
            />
            <PDIStat
              label="Acompanhamentos atrasados"
              value={overdue}
              icon={AlertTriangle}
              tone="amber"
            />
            <PDIStat
              label="Ações vencidas"
              value={overdueActions}
              icon={Clock}
              tone="red"
            />
          </section>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} />
              Iniciar novo PDI
            </button>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600"
            >
              <MapIcon size={15} />
              Ver Mapa da Equipe
            </button>
          </div>
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
              <Filter label="Status">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className={FIELD_CLASS}
                >
                  <option value="all">Todos</option>
                  <option value="none">Sem PDI</option>
                  <option value="active">PDI ativo</option>
                  <option value="overdue">Em atraso</option>
                  <option value="completed">Concluído</option>
                </select>
              </Filter>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {filteredRows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {[
                        "Vendedor",
                        "Status",
                        "Última avaliação",
                        "Última reunião",
                        "Próxima revisão",
                        "Competências",
                        "Progresso",
                        "Ações vencidas",
                        "",
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
                    {filteredRows.map((row) => (
                      <tr key={row.seller.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.seller.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${row.status.style}`}
                          >
                            {row.status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(
                            row.pdi?.data_realizacao || row.pdi?.created_at,
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">—</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(row.pdi?.due_date)}
                        </td>
                        <td className="max-w-60 px-4 py-3 text-xs text-gray-600">
                          {(row.pdi?.top_5_gaps ?? [])
                            .map((gap) => gap.competencia)
                            .slice(0, 3)
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.pdi ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${row.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {row.progress}%
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.overdueActions > 0 ? (
                            <span className="font-medium text-red-600">
                              {row.overdueActions}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              row.pdi
                                ? navigate(`/pdi/${row.pdi.id}/print`)
                                : setShowWizard(true)
                            }
                            className="flex items-center gap-1 text-xs font-medium text-emerald-700"
                          >
                            {row.pdi ? "Abrir" : "Iniciar"}
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Nenhum vendedor encontrado.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {showWizard && (
        <WizardPDI
          onClose={() => setShowWizard(false)}
          onSuccess={async (sessionId) => {
            setShowWizard(false);
            await refetch();
            if (sessionId) navigate(`/pdi/${sessionId}/print`);
          }}
        />
      )}
      {showMap && (
        <TeamCompetencyMap pdis={pdis} onClose={() => setShowMap(false)} />
      )}
    </div>
  );
}

function MyManagerPDI({
  pdi,
  onOpen,
}: {
  pdi: PDISessionSummary | null;
  onOpen: (id: string) => void;
}) {
  if (!pdi)
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-500">
          <Lock size={24} />
        </span>
        <h3 className="mt-3 font-semibold text-gray-800">
          Seu PDI será conduzido pelo Dono ou responsável pela sua avaliação.
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Consulte os critérios do cargo enquanto seu PDI oficial não é
          iniciado.
        </p>
      </section>
    );
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800">Seu PDI oficial</h3>
      <p className="mt-1 text-sm text-gray-500">
        Próxima revisão: {formatDate(pdi.due_date)}
      </p>
      <button
        type="button"
        onClick={() => onOpen(pdi.id)}
        className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Abrir PDI
      </button>
    </section>
  );
}
export function TeamCompetencyMap({
  pdis,
  onClose,
}: {
  pdis: PDISessionSummary[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useFocusTrap(dialogRef, true)

  const counts = new Map<string, number>();
  pdis
    .filter((item) => !isCompleted(item.status))
    .forEach((item) =>
      (item.top_5_gaps ?? []).forEach((gap) =>
        counts.set(gap.competencia, (counts.get(gap.competencia) || 0) + 1),
      ),
    );
  const rows = Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1],
  );
  const max = Math.max(1, ...rows.map(([, count]) => count));
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
        aria-label="Mapa da Equipe"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && event.target === event.currentTarget) onClose()
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Mapa da Equipe
            </h2>
            <p className="text-sm text-gray-500">
              Competências prioritárias registradas nos PDIs ativos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {rows.length ? (
            rows.map(([label, count]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-xs text-gray-600">
                  {label}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className="h-full rounded-lg bg-emerald-500"
                    style={{ width: `${Math.max(6, (count / max) * 100)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-gray-500">
                  {count}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhuma competência priorizada em PDI ativo.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function PDIStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Calendar;
  tone: "blue" | "emerald" | "amber" | "red";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
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
function pdiStatus(
  pdi: PDISessionSummary | null,
  today: string,
): {
  key: Exclude<StatusFilter, "all">;
  label: string;
  style: string;
  rank: number;
} {
  if (!pdi)
    return {
      key: "none",
      label: "Sem PDI",
      style: "bg-gray-100 text-gray-600",
      rank: 3,
    };
  if (isCompleted(pdi.status))
    return {
      key: "completed",
      label: "Concluído",
      style: "bg-emerald-100 text-emerald-700",
      rank: 4,
    };
  if (pdi.due_date && pdi.due_date < today)
    return {
      key: "overdue",
      label: "Em atraso",
      style: "bg-red-100 text-red-700",
      rank: 0,
    };
  return {
    key: "active",
    label: "PDI ativo",
    style: "bg-emerald-100 text-emerald-700",
    rank: 2,
  };
}
function isCompleted(status?: string | null) {
  return (
    status === "concluido" ||
    status === "concluida" ||
    status === "finalizado" ||
    status === "finalizada"
  );
}
function isActionDone(status?: string | null) {
  return (
    status === "concluida" || status === "justificada" || status === "cancelada"
  );
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
}
