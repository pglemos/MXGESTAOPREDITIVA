import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { CalendarDays, History, Bell, AlertTriangle } from "lucide-react";
import moment from "moment/min/moment-with-locales";
import MovimentoDia from "@/components/fechamento/MovimentoDia";
import BottomSection from "@/components/fechamento/BottomSection";
import ClientCard from "@/components/fechamento/ClientCard";

moment.locale("pt-br");

// Retorna hora atual em Brasília (UTC-3)
function nowBrasilia() {
  const utc = new Date();
  return new Date(utc.getTime() + (-3 * 60 * 60 * 1000));
}

// "open" | "blocked" | "expired"  para o dia de ontem
function checkYesterdayStatus() {
  const now = nowBrasilia();
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const totalMin = h * 60 + m;
  if (totalMin <= 9 * 60 + 30) return "open";
  if (totalMin <= 12 * 60) return "blocked";
  return "expired";
}

export default function FechamentoDiario() {
  const { toast } = useToast();
  const now = nowBrasilia();
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const yesterdayStr = moment(todayStr).subtract(1, "day").format("YYYY-MM-DD");

  // Se antes de 12h01, permite trabalhar no fechamento de ontem; após 12h01 usa hoje
  const yesterdayStatus = checkYesterdayStatus();
  const closingDate = yesterdayStatus !== "expired" ? yesterdayStr : todayStr;
  const isWorkingOnYesterday = closingDate === yesterdayStr;

  const [dailyClose, setDailyClose] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyClients, setHistoryClients] = useState([]);
  const [historyShowAll, setHistoryShowAll] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Verifica se existe liberação para ontem (quando bloqueado)
  const [liberado, setLiberado] = useState(false);

  // Horário Brasília para checar janela D+1
  function nowBrasiliaLocal() {
    const utc = new Date();
    return new Date(utc.getTime() + (-3 * 60 * 60 * 1000));
  }

  function isD1WindowOpenLocal(cd) {
    const d1Date = moment(cd).add(1, "day").format("YYYY-MM-DD");
    const now = nowBrasiliaLocal();
    const nowStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}-${String(now.getUTCDate()).padStart(2,"0")}`;
    if (nowStr < d1Date) return true;
    if (nowStr > d1Date) return false;
    const totalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    return totalMin < 9 * 60 + 31;
  }

  const loadData = async () => {
    const [closes, lib, me] = await Promise.all([
      base44.entities.DailyClose.filter({ date: closingDate }).catch(() => []),
      yesterdayStatus === "blocked"
        ? base44.entities.LiberacaoFechamento.filter({ data_fechamento: yesterdayStr, status_solicitacao: "Liberado" }).catch(() => [])
        : Promise.resolve([]),
      base44.auth.me().catch(() => null),
    ]);
    setDailyClose(closes[0] || null);
    setLiberado(lib.length > 0);
    setCurrentUser(me);
    setLoading(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    const startOfMonth = moment(todayStr).startOf("month").format("YYYY-MM-DD");
    const yesterday = yesterdayStr;
    const [all, allClients] = await Promise.all([
      base44.entities.DailyClose.filter({ date: { $gte: startOfMonth, $lte: yesterday } }, "-date", 50).catch(() => []),
      base44.entities.Client.filter({}).catch(() => []),
    ]);
    setHistoryRecords(all);
    setHistoryClients(allClients);
    setHistoryLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openHistory = () => {
    setHistoryOpen(true);
    setHistoryShowAll(false);
    loadHistory();
  };

  const D1_FIELDS = ["agendamentos_carteira", "agendamentos_internet"];

  const setCounter = async (field, newVal) => {
    // Se finalizado: só permite alterar campos D+1 durante a janela de ajuste
    if (jaFinalizado) {
      if (!d1Editavel) return; // bloqueado total
      if (!D1_FIELDS.includes(field)) return; // campo não-D+1 bloqueado
    }
    const safeVal = Math.min(999, Math.max(0, newVal));
    const baseObj = {
      date: closingDate,
      leads_carteira: 0, leads_internet: 0,
      atendimentos_showroom: 0, atendimentos_carteira: 0, atendimentos_internet: 0,
      agendamentos_carteira: 0, agendamentos_internet: 0,
    };
    const current = dailyClose || baseObj;
    const data = { ...current, [field]: safeVal };
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by_id;

    if (dailyClose?.id) {
      const updated = await base44.entities.DailyClose.update(dailyClose.id, { [field]: safeVal });
      setDailyClose(updated);
    } else {
      const created = await base44.entities.DailyClose.create(data);
      setDailyClose(created);
    }
  };

  const updateCounter = (field, delta) => {
    const current = dailyClose || {};
    setCounter(field, (current[field] || 0) + delta);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Estado de bloqueio derivado ───────────────────────────────────────────
  const jaFinalizado = dailyClose?.finalizado === true;
  const d1WindowOpen = jaFinalizado && isD1WindowOpenLocal(closingDate) && dailyClose?.ajustes_d1_permitidos !== false;
  // bloqueado total: finalizado E janela D+1 encerrada
  const tudo_bloqueado = jaFinalizado && !d1WindowOpen;
  // d1Editavel: finalizado E janela D+1 aberta
  const d1Editavel = jaFinalizado && d1WindowOpen;

  // Função para registrar audit log
  const handleAuditLog = async ({ tipo_alteracao, cliente_id, valor_anterior, valor_novo }) => {
    if (!currentUser || !dailyClose?.id) return;
    base44.entities.D1AuditLog.create({
      usuario_id: currentUser.id,
      usuario_nome: currentUser.full_name,
      fechamento_id: dailyClose.id,
      cliente_id: cliente_id || "",
      data_hora_alteracao: new Date().toISOString(),
      tipo_alteracao,
      valor_anterior: valor_anterior || "",
      valor_novo: valor_novo || "",
    }).catch(() => {});
  };

  const dc = dailyClose || {};
  const totalLeads = (dc.leads_carteira || 0) + (dc.leads_internet || 0);
  const totalAtend = (dc.atendimentos_showroom || 0) + (dc.atendimentos_carteira || 0) + (dc.atendimentos_internet || 0);
  const totalAgend = (dc.agendamentos_carteira || 0) + (dc.agendamentos_internet || 0);
  const totalVendas = clients.filter(c => c.sale_status === "Sim").length;
  const totalFaturamento = clients
    .filter(c => c.sale_status === "Sim")
    .reduce((sum, c) => {
      if (!c.negotiated_value) return sum;
      const num = parseFloat(c.negotiated_value.replace(/[R$\s.]/g, "").replace(",", "."));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

  // Datas exibidas no header
  const displayDate = isWorkingOnYesterday ? yesterdayStr : todayStr;
  const displayLabel = isWorkingOnYesterday
    ? `${moment(yesterdayStr).format("DD/MM/YYYY")} (ontem)`
    : moment(todayStr).format("DD/MM/YYYY");
  const displayDow = moment(displayDate).format("dddd");

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      {/* ── Topbar ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 h-[64px] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-5">
          <h1 className="text-[22px] font-black text-[#0F172A] tracking-tight uppercase">Fechamento Diário</h1>
          <div className="flex items-center gap-1.5 text-[13px] bg-slate-50 border border-[#E5E7EB] rounded-lg px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-[#005BFF]" />
            <span className="font-semibold text-[#0F172A]">{displayLabel}</span>
            <span className="text-[#64748B] capitalize">({displayDow})</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openHistory}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B] hover:text-[#005BFF] border border-[#E5E7EB] bg-white hover:border-[#005BFF] rounded-xl px-4 py-2 transition-all"
          >
            <History className="w-4 h-4" />
            Histórico de Fechamentos
          </button>
          <div className="relative cursor-pointer">
            <Bell className="w-5 h-5 text-[#64748B]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center">3</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Alerta discreto: fechamento anterior pendente após 12h01 */}
        {yesterdayStatus === "expired" && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <p className="text-[13px] font-medium text-[#92400E]">
              Existe um fechamento anterior pendente.{" "}
              <button onClick={openHistory} className="underline font-semibold hover:text-amber-900 transition-colors">
                Acesse o Histórico de Fechamentos
              </button>{" "}
              para regularizar.
            </p>
          </div>
        )}

        {/* ── Row 1: Movimento do Dia ── */}
        <MovimentoDia
          dc={dc}
          updateCounter={updateCounter}
          setCounter={setCounter}
          clients={clients}
          closingDate={closingDate}
          bloqueado={tudo_bloqueado}
          d1Editavel={d1Editavel}
          onAuditLog={handleAuditLog}
        />

        {/* ── Row 2: Clientes ── */}
        <ClientCard
          onClientsChange={setClients}
          closingDate={closingDate}
          bloqueado={tudo_bloqueado}
          d1Editavel={d1Editavel}
          onAuditLog={handleAuditLog}
          dailyCloseId={dailyClose?.id}
        />

        {/* ── Row 3: Bottom ── */}
        <BottomSection
          totalLeads={totalLeads}
          totalAtend={totalAtend}
          totalAgend={totalAgend}
          totalVendas={totalVendas}
          totalFaturamento={totalFaturamento}
          clients={clients}
          agendamentosD1Carteira={dc.agendamentos_carteira || 0}
          agendamentosD1Internet={dc.agendamentos_internet || 0}
          closingDate={closingDate}
          liberado={liberado}
          penalizado={false}
          dailyClose={dailyClose}
          onDailyCloseUpdate={(updated) => setDailyClose(updated)}
        />
      </div>

      {/* ── Modal: Histórico ── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] font-bold">Histórico de Fechamentos</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
              </div>
            ) : historyRecords.length === 0 ? (
              <p className="text-[13px] text-[#64748B] text-center py-6">Nenhum fechamento registrado neste mês.</p>
            ) : (() => {
              const visible = historyShowAll ? historyRecords : historyRecords.slice(0, 7);
              const hasMore = !historyShowAll && historyRecords.length > 7;

              // Dias com DailyClose registrado
              const registeredDates = new Set(historyRecords.map(h => h.date));

              // Dias corridos do mês até ontem que NÃO têm registro → pendentes
              const startOfMonth = moment(todayStr).startOf("month").format("YYYY-MM-DD");
              const pendentes = [];
              let d = moment(startOfMonth);
              while (d.format("YYYY-MM-DD") <= yesterdayStr) {
                const ds = d.format("YYYY-MM-DD");
                if (!registeredDates.has(ds)) pendentes.push(ds);
                d.add(1, "day");
              }

              return (
                <>
                  {/* Pendentes primeiro */}
                  {pendentes.slice(0, historyShowAll ? undefined : 3).map(date => (
                    <div key={`pending-${date}`} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                        <span className="font-semibold text-[13px] text-[#0F172A]">{moment(date).format("DD/MM/YYYY")}</span>
                        <span className="text-[11px] text-slate-400 capitalize">{moment(date).format("ddd")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[#EF4444] bg-red-100 px-2.5 py-0.5 rounded-full">
                          Pendente de Fechamento
                        </span>
                        <button
                          onClick={() => toast({ title: "Regularizar", description: `Solicite liberação para o fechamento de ${moment(date).format("DD/MM/YYYY")}.` })}
                          className="text-[11px] font-bold text-[#005BFF] hover:underline"
                        >
                          Regularizar
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Fechamentos registrados */}
                  {visible.map(h => {
                    const leads = (h.leads_carteira || 0) + (h.leads_internet || 0);
                    const atend = (h.atendimentos_showroom || 0) + (h.atendimentos_carteira || 0) + (h.atendimentos_internet || 0);
                    const agend = (h.agendamentos_carteira || 0) + (h.agendamentos_internet || 0);
                    const vendas = historyClients.filter(c =>
                      c.sale_status === "Sim" && moment(c.created_date).format("YYYY-MM-DD") === h.date
                    ).length;
                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <CalendarDays className="w-4 h-4 text-[#005BFF] flex-shrink-0" />
                          <span className="font-semibold text-[13px] text-[#0F172A]">{moment(h.date).format("DD/MM/YYYY")}</span>
                          <span className="text-[11px] text-slate-400 capitalize">{moment(h.date).format("ddd")}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-[#64748B]">
                          <span><strong className="text-[#005BFF]">{leads}</strong> leads</span>
                          <span><strong className="text-[#6D28D9]">{atend}</strong> atend.</span>
                          <span><strong className="text-[#F59E0B]">{agend}</strong> agend.</span>
                          <span><strong className="text-[#22C55E]">{vendas}</strong> vendas</span>
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <button
                      onClick={() => setHistoryShowAll(true)}
                      className="w-full text-[12px] font-semibold text-[#005BFF] hover:underline py-2 text-center"
                    >
                      Mostrar mais ({historyRecords.length - 7} registros restantes)
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}