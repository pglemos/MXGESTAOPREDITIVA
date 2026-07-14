import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  Copy,
  Filter,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useData";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Typography } from "@/components/atoms/Typography";
import { Modal } from "@/components/organisms/Modal";
import {
  AGENDA_CANAL_LABEL,
  AGENDA_D1_DEFAULT_FILTERS,
  AGENDA_STATUS_LABEL,
  AGENDA_TIPO_LABEL,
  CONFIRMATION_OUTCOMES,
  buildWhatsappMessage,
  buildWhatsappUrl,
  dedupeActiveAppointments,
  extractMeetLink,
  filterAgenda,
  normalizePhoneBr,
  type AgendaD1Filters,
  type AgendaD1Row,
  type ConfirmationOutcome,
} from "./agenda-d1";

interface SellerOption {
  id: string;
  name: string;
}

export interface AgendaD1PanelProps {
  open: boolean;
  onClose: () => void;
  referenceDate: string;
  sellers: SellerOption[];
  initialSellerId?: string;
}

/**
 * Agenda D+1 do gerente. Origem canônica: agendamentos do CRM/carteira.
 * O gerente não altera a agenda do vendedor: contatos e confirmações são
 * registrados em d1_audit_log e reagendamento/cancelamento notifica o vendedor.
 */
export function AgendaD1Panel({
  open,
  onClose,
  referenceDate,
  sellers,
  initialSellerId,
}: AgendaD1PanelProps) {
  const { storeId, profile, membership } = useAuth();
  const { sendNotification } = useNotifications();
  const d1Date = useMemo(
    () => format(addDays(parseISO(referenceDate), 1), "yyyy-MM-dd"),
    [referenceDate],
  );
  const [rows, setRows] = useState<AgendaD1Row[]>([]);
  const [lastContactByCliente, setLastContactByCliente] = useState<
    Map<string, string>
  >(new Map());
  const [lastStatusByCliente, setLastStatusByCliente] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AgendaD1Filters>({
    ...AGENDA_D1_DEFAULT_FILTERS,
    sellerId: initialSellerId || "all",
  });
  const [confirmationStatus, setConfirmationStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<{
    rowId: string;
    outcome: ConfirmationOutcome | "";
    note: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFilters({
        ...AGENDA_D1_DEFAULT_FILTERS,
        sellerId: initialSellerId || "all",
      });
      setConfirmationStatus("all");
      setSearch("");
    }
  }, [open, initialSellerId]);

  const fetchAgenda = useCallback(async () => {
    if (!storeId || !open) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("agendamentos")
      .select(
        "id, data_hora, canal, tipo, status, observacoes, seller_user_id, cliente:clientes(id, nome, telefone, telefone_normalizado, ultima_interacao), oportunidade:oportunidades(veiculo_interesse)",
      )
      .eq("loja_id", storeId)
      .gte("data_hora", `${d1Date}T00:00:00-03:00`)
      .lte("data_hora", `${d1Date}T23:59:59-03:00`)
      .order("data_hora");
    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const active = dedupeActiveAppointments(
      (data || []) as unknown as AgendaD1Row[],
    );
    setRows(active);
    const clienteIds = active
      .map((item) => item.cliente?.id)
      .filter((id): id is string => Boolean(id));
    if (clienteIds.length) {
      const { data: logs } = await supabase
        .from("d1_audit_log")
        .select("cliente_id, created_at, tipo_alteracao, valor_novo")
        .in("cliente_id", clienteIds)
        .order("created_at", { ascending: false });
      const map = new Map<string, string>();
      const statusMap = new Map<string, string>();
      for (const log of logs || []) {
        if (log.cliente_id && !map.has(log.cliente_id)) {
          map.set(log.cliente_id, log.created_at);
          statusMap.set(
            log.cliente_id,
            normalizeManagerConfirmationStatus(
              log.tipo_alteracao,
              log.valor_novo,
            ),
          );
        }
      }
      setLastContactByCliente(map);
      setLastStatusByCliente(statusMap);
    } else {
      setLastContactByCliente(new Map());
      setLastStatusByCliente(new Map());
    }
    setLoading(false);
  }, [storeId, open, d1Date]);

  useEffect(() => {
    void fetchAgenda();
  }, [fetchAgenda]);

  const sellerNameById = useMemo(
    () => new Map(sellers.map((seller) => [seller.id, seller.name])),
    [sellers],
  );
  const visible = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return filterAgenda(rows, {
      ...filters,
      status: "all",
      periodo: "all",
    }).filter((row) => {
      const managerStatus = row.cliente
        ? lastStatusByCliente.get(row.cliente.id) || "Pendente"
        : "Pendente";
      if (confirmationStatus !== "all" && managerStatus !== confirmationStatus)
        return false;
      if (!normalizedSearch) return true;
      return [
        row.cliente?.nome,
        row.oportunidade?.veiculo_interesse,
        format(parseISO(row.data_hora), "HH:mm"),
      ].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      );
    });
  }, [rows, filters, search, confirmationStatus, lastStatusByCliente]);

  const registerLog = useCallback(
    async (
      row: AgendaD1Row,
      tipoAlteracao: string,
      valorAnterior: string | null,
      valorNovo: string,
    ) => {
      if (!profile?.id) return { error: "Sessão inválida." };
      const { error: insertError } = await supabase
        .from("d1_audit_log")
        .insert({
          usuario_id: profile.id,
          usuario_nome: profile.name || null,
          cliente_id: row.cliente?.id || null,
          tipo_alteracao: tipoAlteracao,
          valor_anterior: valorAnterior,
          valor_novo: valorNovo,
        });
      if (insertError) return { error: insertError.message };
      if (row.cliente?.id) {
        setLastContactByCliente((prev) =>
          new Map(prev).set(row.cliente!.id, new Date().toISOString()),
        );
        setLastStatusByCliente((prev) =>
          new Map(prev).set(
            row.cliente!.id,
            normalizeManagerConfirmationStatus(tipoAlteracao, valorNovo),
          ),
        );
      }
      return { error: null };
    },
    [profile?.id, profile?.name],
  );

  const openWhatsapp = useCallback(
    async (row: AgendaD1Row) => {
      const phone = normalizePhoneBr(
        row.cliente?.telefone_normalizado || row.cliente?.telefone,
      );
      if (!phone || !row.cliente) {
        toast.error("Cliente sem telefone válido para WhatsApp.");
        return;
      }
      const message = buildWhatsappMessage({
        clienteNome: row.cliente.nome,
        tipo: row.tipo,
        dataHora: row.data_hora,
        lojaNome: membership?.store?.name || null,
        meetLink: extractMeetLink(row.observacoes),
      });
      window.open(buildWhatsappUrl(phone, message), "_blank", "noopener");
      const results = await Promise.all([
        registerLog(
          row,
          "agenda_d1_whatsapp",
          AGENDA_STATUS_LABEL[row.status],
          "WhatsApp aberto pelo gerente",
        ),
        storeId && profile?.id
          ? supabase
              .from("logs_compartilhamento_whatsapp")
              .insert({
                store_id: storeId,
                user_id: profile.id,
                message_text: message,
                reference_date: d1Date,
                shared_via: "whatsapp",
                source: "agenda_d1_gerente",
              })
              .then((result) => ({ error: result.error?.message || null }))
          : Promise.resolve({ error: null }),
      ]);
      const failure = results.find((result) => result.error);
      if (failure?.error)
        toast.error(`Contato aberto, mas o log falhou: ${failure.error}`);
      else toast.success("WhatsApp aberto e contato registrado.");
    },
    [membership?.store?.name, registerLog, storeId, profile?.id, d1Date],
  );

  const callPhone = useCallback(
    async (row: AgendaD1Row) => {
      const phone = normalizePhoneBr(
        row.cliente?.telefone_normalizado || row.cliente?.telefone,
      );
      if (!phone) {
        toast.error("Cliente sem telefone válido.");
        return;
      }
      window.location.href = `tel:+${phone}`;
      const { error: logError } = await registerLog(
        row,
        "agenda_d1_telefone",
        AGENDA_STATUS_LABEL[row.status],
        "Ligação iniciada pelo gerente",
      );
      if (logError)
        toast.error(`Ligação iniciada, mas o log falhou: ${logError}`);
      else toast.success("Ligação registrada.");
    },
    [registerLog],
  );

  const copyPhone = useCallback(async (row: AgendaD1Row) => {
    const phone = normalizePhoneBr(
      row.cliente?.telefone_normalizado || row.cliente?.telefone,
    );
    if (!phone) {
      toast.error("Cliente sem telefone válido.");
      return;
    }
    try {
      await navigator.clipboard.writeText(`+${phone}`);
      toast.success("Telefone copiado. Use seu aparelho para ligar.");
    } catch {
      toast.error(`Não foi possível copiar. Número: +${phone}`);
    }
  }, []);

  const saveConfirmation = useCallback(
    async (row: AgendaD1Row) => {
      if (!confirming || confirming.rowId !== row.id || !confirming.outcome)
        return;
      if (confirming.outcome === "Outro" && !confirming.note.trim()) {
        toast.error('Descreva a observação para o resultado "Outro".');
        return;
      }
      setSaving(true);
      const valorNovo = confirming.note.trim()
        ? `${confirming.outcome} — ${confirming.note.trim()}`
        : confirming.outcome;
      const { error: logError } = await registerLog(
        row,
        "agenda_d1_confirmacao",
        AGENDA_STATUS_LABEL[row.status],
        valorNovo,
      );
      if (logError) {
        toast.error(`Não foi possível registrar: ${logError}`);
        setSaving(false);
        return;
      }
      if (
        confirming.outcome === "Solicitou reagendamento" ||
        confirming.outcome === "Cancelou"
      ) {
        const { error: notificationError } = await sendNotification({
          recipient_id: row.seller_user_id,
          store_id: storeId || undefined,
          title:
            confirming.outcome === "Cancelou"
              ? "Cliente cancelou agendamento D+1"
              : "Cliente pediu reagendamento (D+1)",
          message: `${row.cliente?.nome || "Cliente"} — ${format(parseISO(row.data_hora), "dd/MM HH:mm")}. ${valorNovo}. A agenda original não foi alterada: atualize pela Carteira.`,
          type: "agenda",
          priority: "high",
          link: "/carteira",
        });
        if (notificationError)
          toast.error("Registro salvo, mas o aviso ao vendedor falhou.");
      }
      toast.success("Contato registrado na auditoria D+1.");
      setConfirming(null);
      setSaving(false);
    },
    [confirming, registerLog, sendNotification, storeId],
  );

  const filterSelectClass = "h-10 rounded-[12px] px-3 text-sm";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="3xl"
      className="sm:!max-w-[1152px]"
      referenceStyle
      title="Agenda D+1"
      description="Clientes agendados para amanhã a partir dos fechamentos da equipe."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="outline" className="border-0 bg-amber-100 px-2.5 py-1 text-xs text-amber-700 shadow-none">Agenda D+1 parcial</Badge>
            <Typography variant="tiny" tone="muted" className="mt-1 block">
              Atualizada em tempo real até o encerramento da janela de ajuste.
            </Typography>
          </div>
          <Typography
            variant="p"
            tone="muted"
            className="inline-flex items-center gap-1.5 !text-sm"
          >
            <CalendarClock size={14} />
            Data D+1:{" "}
            <strong className="text-text-primary">
              {format(parseISO(d1Date), "dd/MM/yyyy")}
            </strong>
          </Typography>
        </div>
        <div
          className="rounded-[12px] bg-slate-50 p-4"
          role="group"
          aria-label="Filtros da Agenda D+1"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-600">
            <Filter size={16} />
            Filtros
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              aria-label="Vendedor"
              className={filterSelectClass}
              value={filters.sellerId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sellerId: event.target.value,
                }))
              }
            >
              <option value="all">Vendedor</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Canal"
              className={filterSelectClass}
              value={filters.canal}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  canal: event.target.value as AgendaD1Filters["canal"],
                }))
              }
            >
              <option value="all">Canal</option>
              {Object.entries(AGENDA_CANAL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Tipo de agendamento"
              className={filterSelectClass}
              value={filters.tipo}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  tipo: event.target.value as AgendaD1Filters["tipo"],
                }))
              }
            >
              <option value="all">Tipo de agendamento</option>
              {Object.entries(AGENDA_TIPO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label === "Visita" ? "Visita Presencial" : label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Status de confirmação"
              className={filterSelectClass}
              value={confirmationStatus}
              onChange={(event) => setConfirmationStatus(event.target.value)}
            >
              <option value="all">Status de confirmação</option>
              {[
                "Pendente",
                "WhatsApp aberto",
                "Reforço enviado",
                "Confirmado",
                "Sem resposta",
                "Solicitou reagendamento",
                "Cancelou",
              ].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                size={16}
              />
              <Input
                aria-label="Buscar agenda D+1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar (cliente, veículo, horário)..."
                className={`${filterSelectClass} pl-9`}
              />
            </div>
          </div>
        </div>
        {error && (
          <div className="rounded-mx-md border border-status-error/30 bg-status-error-surface p-mx-md">
            <Typography variant="p" tone="error">
              Não foi possível carregar a Agenda D+1: {error}
            </Typography>
            <Button
              size="xs"
              variant="outline"
              className="mt-mx-sm"
              onClick={() => void fetchAgenda()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        {loading ? (
          <div className="space-y-mx-sm" aria-busy="true">
            <Skeleton className="h-mx-12" />
            <Skeleton className="h-mx-12" />
            <Skeleton className="h-mx-12" />
          </div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center p-mx-xl text-center">
            <div>
              <CalendarDays size={42} className="mx-auto text-border-default" />
              <Typography variant="p" tone="muted" className="mt-mx-sm">
                {rows.length === 0
                  ? "Nenhum cliente agendado para D+1."
                  : "Nenhum agendamento corresponde aos filtros."}
              </Typography>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1094px]">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Horário",
                    "Cliente",
                    "Telefone",
                    "Veículo",
                    "Canal",
                    "Vendedor",
                    "Tipo",
                    "Status",
                    "Último contato",
                    "Ações",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => {
                  const lastContact = row.cliente
                    ? lastContactByCliente.get(row.cliente.id) ||
                      row.cliente.ultima_interacao
                    : null;
                  const isConfirming = confirming?.rowId === row.id;
                  return (
                    <FragmentRow key={row.id}>
                      <tr className="bg-white">
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">
                          {format(parseISO(row.data_hora), "HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">
                          {row.cliente?.nome || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {row.cliente?.telefone || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {row.oportunidade?.veiculo_interesse || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {row.canal ? AGENDA_CANAL_LABEL[row.canal] : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {sellerNameById.get(row.seller_user_id) ||
                            "Vendedor da equipe"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {AGENDA_TIPO_LABEL[row.tipo]}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              row.status === "confirmado"
                                ? "success"
                                : row.status === "aguardando"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {AGENDA_STATUS_LABEL[row.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {lastContact
                            ? format(parseISO(lastContact), "dd/MM HH:mm")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-max flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`WhatsApp para ${row.cliente?.nome || "cliente"}`}
                              onClick={() => void openWhatsapp(row)}
                            >
                              <MessageCircle size={17} /> WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Ligar para ${row.cliente?.nome || "cliente"}`}
                              onClick={() => void callPhone(row)}
                            >
                              <Phone size={17} /> Telefone
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label="Copiar telefone"
                              onClick={() => void copyPhone(row)}
                            >
                              <Copy size={17} />
                            </Button>
                            <Button
                              size="sm"
                              variant={isConfirming ? "primary" : "outline"}
                              onClick={() =>
                                setConfirming(
                                  isConfirming
                                    ? null
                                    : { rowId: row.id, outcome: "", note: "" },
                                )
                              }
                            >
                              Confirmar
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isConfirming && (
                        <tr className="bg-surface-alt/60">
                          <td colSpan={10} className="px-mx-md py-mx-sm">
                            <div className="flex flex-wrap items-end gap-mx-sm">
                              <Select
                                label="Resultado do contato"
                                className="h-mx-10 min-w-[220px]"
                                value={confirming.outcome}
                                onChange={(event) =>
                                  setConfirming((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          outcome: event.target
                                            .value as ConfirmationOutcome,
                                        }
                                      : prev,
                                  )
                                }
                              >
                                <option value="" disabled>
                                  Selecione…
                                </option>
                                {CONFIRMATION_OUTCOMES.map((outcome) => (
                                  <option key={outcome} value={outcome}>
                                    {outcome}
                                  </option>
                                ))}
                              </Select>
                              <div className="min-w-[260px] flex-1">
                                <label
                                  className="mb-mx-2xs block text-mx-tiny font-black uppercase tracking-wider text-text-tertiary"
                                  htmlFor={`agenda-d1-note-${row.id}`}
                                >
                                  {confirming.outcome === "Outro"
                                    ? "Observação (obrigatória)"
                                    : "Observação (opcional)"}
                                </label>
                                <Input
                                  id={`agenda-d1-note-${row.id}`}
                                  className="h-mx-10"
                                  value={confirming.note}
                                  onChange={(event) =>
                                    setConfirming((prev) =>
                                      prev
                                        ? { ...prev, note: event.target.value }
                                        : prev,
                                    )
                                  }
                                  placeholder="Detalhe do contato com o cliente"
                                />
                              </div>
                              <Button
                                size="sm"
                                disabled={saving || !confirming.outcome}
                                onClick={() => void saveConfirmation(row)}
                              >
                                {saving ? "Salvando…" : "Salvar registro"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirming(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                            {(confirming.outcome ===
                              "Solicitou reagendamento" ||
                              confirming.outcome === "Cancelou") && (
                              <Typography
                                variant="tiny"
                                tone="muted"
                                className="mt-mx-xs"
                              >
                                A agenda original não será alterada. O vendedor
                                recebe um aviso para atualizar pela Carteira.
                              </Typography>
                            )}
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Typography variant="tiny" tone="muted" className="block">
          A Carteira de Clientes permanece a base oficial. O gerente não altera
          o agendamento original: apenas confirma com o cliente e registra o
          status gerencial de confirmação.
        </Typography>
      </div>
    </Modal>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function normalizeManagerConfirmationStatus(
  tipo: string | null,
  value: string | null,
) {
  if (tipo === "agenda_d1_whatsapp") return "WhatsApp aberto";
  if (!value) return "Pendente";
  return (
    ["Confirmado", "Sem resposta", "Solicitou reagendamento", "Cancelou"].find(
      (status) => value.startsWith(status),
    ) || "Reforço enviado"
  );
}
