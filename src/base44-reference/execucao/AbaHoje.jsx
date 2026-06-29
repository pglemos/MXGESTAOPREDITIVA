import React, { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  MessageCircle, Phone, UserRound, Plus, ChevronDown,
  AlertTriangle, Calendar, Inbox, Sparkles, CheckCircle2,
  Clock, Users, RefreshCw, Gift, Shield, Truck, MoreVertical,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment/min/moment-with-locales";
import ResolverModal from "./ResolverModal";
import NovaAtividadeModal from "./NovaAtividadeModal";
import PendenciasDrawer from "./PendenciasDrawer";
import ClienteFichaSheet from "./ClienteFichaSheet";

moment.locale("pt-br");

// ── Constantes ─────────────────────────────────────────────────────────────────

const TIPO_COLOR_BAR = {
  "Atendimento": "bg-[#00A89D]",
  "Retorno": "bg-[#F59F0A]",
  "Documentação": "bg-[#526B7A]",
  "Entrega": "bg-[#F15BBA]",
  "Pós-venda": "bg-teal-500",
  "Aniversário": "bg-pink-500",
  "Garantia": "bg-[#F59F0A]",
  "Outra atividade comercial": "bg-[#526B7A]",
};

const TIPO_COLOR_BADGE = {
  "Atendimento": "bg-[#E8F3F2] text-[#00A89D]",
  "Retorno": "bg-[#FFF7E6] text-[#F59F0A]",
  "Documentação": "bg-[#DFE0E1] text-[#526B7A]",
  "Entrega": "bg-[#F15BBA] text-[#F15BBA]",
  "Pós-venda": "bg-teal-50 text-teal-700",
  "Aniversário": "bg-pink-50 text-pink-700",
  "Garantia": "bg-[#FFF7E6] text-[#F59F0A]",
  "Outra atividade comercial": "bg-[#DFE0E1] text-[#526B7A]",
};

const TIPO_ICON = {
  "Atendimento": Calendar,
  "Retorno": RefreshCw,
  "Documentação": Shield,
  "Entrega": Truck,
  "Pós-venda": Users,
  "Aniversário": Gift,
  "Garantia": Shield,
  "Outra atividade comercial": MoreVertical,
};

// Prioridade base por tipo (menor = mais urgente)
const TIPO_PRIORIDADE_BASE = {
  "Atendimento": 1,
  "Entrega": 3,
  "Garantia": 4,
  "Retorno": 6,
  "Pós-venda": 7,
  "Aniversário": 8,
  "Documentação": 9,
  "Outra atividade comercial": 10,
};

const FILTROS = [
  { id: "todos", label: "Todas" },
  { id: "Atendimento", label: "Atendimentos" },
  { id: "Retorno", label: "Retornos" },
  { id: "Aniversário", label: "Aniversários" },
  { id: "Garantia", label: "Garantias" },
  { id: "Entrega", label: "Entregas" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarIniciais(nome) {
  if (!nome) return "?";
  return nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function buildOportunidadesDeClientes(clients, hoje) {
  return clients
    .filter(c => {
      if (c.sale_status !== "Em Negociação") return false;
      if (!c.appointment_datetime) return false;
      return moment(c.appointment_datetime).format("YYYY-MM-DD") === hoje;
    })
    .map(c => ({
      id: `client_${c.id}`,
      _clienteId: c.id,
      _fromClient: true,
      tipo: "Atendimento",
      titulo: "Atendimento",
      descricao: c.vehicle_sought ? `Interesse em ${c.vehicle_sought}` : "Negociação em andamento",
      data_hora_execucao: c.appointment_datetime,
      prioridade: 1,
      status: "Pendente",
      telefone_snapshot: c.phone,
      nome_cliente_snapshot: c.name,
      veiculo_snapshot: c.vehicle_sought,
      cliente_id: c.id,
      ativo: true,
      _clienteObj: c,
    }));
}

function buildAniversarios(clients, hoje) {
  const [m, d] = [moment(hoje).month() + 1, moment(hoje).date()];
  return clients
    .filter(c => {
      if (!c.birth_date && !c.dataAniversario) return false;
      const aniv = c.birth_date || c.dataAniversario;
      const anivMoment = moment(aniv, ["YYYY-MM-DD", "MM-DD"]);
      return anivMoment.month() + 1 === m && anivMoment.date() === d;
    })
    .map(c => ({
      id: `aniv_${c.id}`,
      _clienteId: c.id,
      _fromClient: true,
      tipo: "Aniversário",
      titulo: "Aniversário",
      descricao: "Parabenize o cliente hoje!",
      data_hora_execucao: `${hoje}T09:00`,
      prioridade: 8,
      status: "Pendente",
      telefone_snapshot: c.phone,
      nome_cliente_snapshot: c.name,
      veiculo_snapshot: c.vehicle_sought,
      cliente_id: c.id,
      ativo: true,
      _clienteObj: c,
    }));
}

function sortOportunidades(lista, ordenar) {
  return [...lista].sort((a, b) => {
    if (ordenar === "horario") {
      return (a.data_hora_execucao || "").localeCompare(b.data_hora_execucao || "");
    }
    if (ordenar === "tipo") {
      return (a.tipo || "").localeCompare(b.tipo || "");
    }
    if (ordenar === "cliente") {
      return (a.nome_cliente_snapshot || "").localeCompare(b.nome_cliente_snapshot || "");
    }
    // Prioridade (padrão): vencido primeiro, depois por tipo, depois horário
    const aVencido = moment(a.data_hora_execucao).isBefore(moment()) ? 0 : 1;
    const bVencido = moment(b.data_hora_execucao).isBefore(moment()) ? 0 : 1;
    if (aVencido !== bVencido) return aVencido - bVencido;
    const pa = TIPO_PRIORIDADE_BASE[a.tipo] || 10;
    const pb = TIPO_PRIORIDADE_BASE[b.tipo] || 10;
    if (pa !== pb) return pa - pb;
    return (a.data_hora_execucao || "").localeCompare(b.data_hora_execucao || "");
  });
}

// ── Componente de Card de Oportunidade ────────────────────────────────────────

function OportunidadeCard({ op, onResolver, onAbrirCliente, isMobile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = TIPO_ICON[op.tipo] || Calendar;
  const hora = op.data_hora_execucao ? moment(op.data_hora_execucao).format("HH:mm") : "—";
  const isVencido = op.data_hora_execucao && moment(op.data_hora_execucao).isBefore(moment());
  const tel = (op.telefone_snapshot || "").replace(/\D/g, "");
  const waUrl = tel ? `https://wa.me/55${tel}` : null;
  const msgAniversario = op.tipo === "Aniversário"
    ? `Olá ${op.nome_cliente_snapshot ? op.nome_cliente_snapshot.split(" ")[0] : ""}! Feliz aniversário! Que este dia seja especial. Conte comigo para o que precisar! 🎉`
    : null;

  if (isMobile) {
    return (
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isVencido ? "border-[#EF4343]" : "border-[#DFE0E1]"}`}>
        <div className={`h-1 w-full ${TIPO_COLOR_BAR[op.tipo] || "bg-[#DFE0E1]"}`} />
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR_BADGE[op.tipo] || "bg-[#DFE0E1] text-[#526B7A]"}`}>{op.tipo}</span>
              {isVencido && <span className="text-[10px] font-bold text-[#EF4343] bg-[#FEECEC] px-2 py-0.5 rounded-full">Vencido</span>}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#526B7A]">
              <Clock className="w-3 h-3" />{hora}
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-[#DFE0E1] flex items-center justify-center text-[12px] font-black text-[#526B7A] flex-shrink-0">
              {avatarIniciais(op.nome_cliente_snapshot)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[14px] text-[#071822] truncate">{op.nome_cliente_snapshot || "—"}</p>
              {op.veiculo_snapshot && <p className="text-[12px] text-[#526B7A] truncate">{op.veiculo_snapshot}</p>}
            </div>
          </div>
          {op.descricao && <p className="text-[12px] text-[#526B7A] mb-3">{op.descricao}</p>}

          <div className="flex items-center gap-2 flex-wrap">
            {waUrl && (
              <a href={msgAniversario ? `${waUrl}?text=${encodeURIComponent(msgAniversario)}` : waUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] px-3 py-1.5 rounded-lg transition-colors">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>
            )}
            {tel && (
              <a href={`tel:${tel}`}
                className="flex items-center gap-1 text-[11px] font-bold text-[#526B7A] border border-[#DFE0E1] hover:bg-[#F7F8F8] px-3 py-1.5 rounded-lg transition-colors">
                <Phone className="w-3 h-3" /> Ligar
              </a>
            )}
            {op.cliente_id && (
              <button onClick={() => onAbrirCliente(op)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#00A89D] border border-[#00A89D] hover:bg-[#E8F3F2] px-3 py-1.5 rounded-lg transition-colors">
                <UserRound className="w-3 h-3" /> Cliente
              </button>
            )}
            <button onClick={() => onResolver(op)}
              className="ml-auto flex items-center gap-1 text-[12px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] px-4 py-1.5 rounded-lg transition-colors">
              Resolver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex group transition-shadow hover:shadow-md ${isVencido ? "border-[#EF4343]" : "border-[#DFE0E1]"}`}>
      <div className={`w-1.5 flex-shrink-0 ${TIPO_COLOR_BAR[op.tipo] || "bg-[#DFE0E1]"}`} />
      <div className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0">
        {/* Ícone e horário */}
        <div className="flex-shrink-0 text-center w-12">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1 ${TIPO_COLOR_BADGE[op.tipo] || "bg-[#DFE0E1]"}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className={`text-[10px] font-bold ${isVencido ? "text-[#EF4343]" : "text-[#526B7A]"}`}>{hora}</p>
        </div>

        {/* Avatar + nome + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#DFE0E1] flex items-center justify-center text-[12px] font-black text-[#526B7A] flex-shrink-0">
            {avatarIniciais(op.nome_cliente_snapshot)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[14px] text-[#071822] truncate">{op.nome_cliente_snapshot || "—"}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR_BADGE[op.tipo] || "bg-[#DFE0E1] text-[#526B7A]"}`}>{op.tipo}</span>
              {isVencido && <span className="text-[10px] font-bold text-[#EF4343] bg-[#FEECEC] px-2 py-0.5 rounded-full">Vencido</span>}
            </div>
            {op.veiculo_snapshot && <p className="text-[12px] text-[#526B7A] truncate">{op.veiculo_snapshot}</p>}
            {op.descricao && <p className="text-[12px] text-[#526B7A] truncate">{op.descricao}</p>}
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {waUrl && (
            <a href={msgAniversario ? `${waUrl}?text=${encodeURIComponent(msgAniversario)}` : waUrl}
              target="_blank" rel="noopener noreferrer"
              title="WhatsApp"
              className="p-2 rounded-xl bg-[#E8F3F2] hover:bg-[#E8F3F2] text-[#00A89D] transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {tel && (
            <a href={`tel:${tel}`} title="Ligar"
              className="p-2 rounded-xl bg-[#F7F8F8] hover:bg-[#DFE0E1] text-[#526B7A] transition-colors">
              <Phone className="w-4 h-4" />
            </a>
          )}
          {op.cliente_id && (
            <button onClick={() => onAbrirCliente(op)} title="Abrir cliente"
              className="p-2 rounded-xl bg-[#E8F3F2] hover:bg-[#E8F3F2] text-[#00A89D] transition-colors">
              <UserRound className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onResolver(op)}
            className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] px-4 py-2 rounded-xl transition-colors ml-1">
            Resolver
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AbaHoje({ clients, dailyClose, onClientsChange, isMobile, profile, onGoToRotina }) {
  const { toast } = useToast();
  const hoje = useMemo(() => moment().format("YYYY-MM-DD"), []);

  const [oportunidades, setOportunidades] = useState([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [resolverTarget, setResolverTarget] = useState(null);
  const [fichaCliente, setFichaCliente] = useState(null); // { clienteId, clienteObj }
  const [novaAtividade, setNovaAtividade] = useState(false);
  const [pendenciasOpen, setPendenciasOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [ordenar, setOrdenar] = useState("prioridade");
  const [resolvidasIds, setResolvidasIds] = useState(new Set());

  // Carregar oportunidades da entidade
  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const all = await base44.entities.ExecutionOpportunity.filter({ ativo: true });
        setOportunidades(all.filter(op => op.vendedor_id === me.id || !op.vendedor_id));
      } catch (e) {
        console.error(e);
      }
      setLoadingOps(false);
    };
    load();
  }, []);

  // Oportunidades derivadas dos clientes (Atendimentos agendados hoje)
  const opsDeClientes = useMemo(() => buildOportunidadesDeClientes(clients, hoje), [clients, hoje]);

  // Aniversários
  const opsAniversarios = useMemo(() => buildAniversarios(clients, hoje), [clients, hoje]);

  // Oportunidades da entidade — split por data
  const opsEntityHoje = useMemo(() =>
    oportunidades.filter(op => {
      if (!op.ativo) return false;
      if (op.status === "Resolvida" || op.status === "Cancelada") return false;
      return moment(op.data_hora_execucao).format("YYYY-MM-DD") === hoje;
    }), [oportunidades, hoje]);

  const opsEntityPendentes = useMemo(() =>
    oportunidades.filter(op => {
      if (!op.ativo) return false;
      if (op.status === "Resolvida" || op.status === "Cancelada") return false;
      return moment(op.data_hora_execucao).format("YYYY-MM-DD") < hoje;
    }), [oportunidades, hoje]);

  // Merge lista de hoje: clientes + aniversários + entidade, sem duplicar
  const listaHoje = useMemo(() => {
    const ids = new Set(opsEntityHoje.map(op => op.cliente_id).filter(Boolean));
    // Não incluir oportunidade de cliente se já existe oportunidade de entidade para ele
    const opsClientesFiltrados = opsDeClientes.filter(op => !ids.has(op.cliente_id));
    const idsAniv = new Set(opsEntityHoje.filter(op => op.tipo === "Aniversário").map(op => op.cliente_id));
    const anivFiltrados = opsAniversarios.filter(op => !idsAniv.has(op.cliente_id));

    const todos = [...opsClientesFiltrados, ...anivFiltrados, ...opsEntityHoje];
    // Remover resolvidos localmente
    return todos.filter(op => !resolvidasIds.has(op.id));
  }, [opsDeClientes, opsAniversarios, opsEntityHoje, resolvidasIds]);

  // Pendências anteriores
  const pendenciasAnteriores = useMemo(() => {
    const opsClientesPendentes = clients.filter(c => {
      if (c.sale_status !== "Em Negociação") return false;
      if (!c.appointment_datetime) return false;
      const data = moment(c.appointment_datetime).format("YYYY-MM-DD");
      return data < hoje;
    }).map(c => ({
      id: `client_pend_${c.id}`,
      _clienteId: c.id,
      _fromClient: true,
      tipo: "Atendimento",
      descricao: c.vehicle_sought ? `Interesse em ${c.vehicle_sought}` : "Negociação em andamento",
      data_hora_execucao: c.appointment_datetime,
      status: "Pendente",
      telefone_snapshot: c.phone,
      nome_cliente_snapshot: c.name,
      veiculo_snapshot: c.vehicle_sought,
      cliente_id: c.id,
    }));
    return [...opsClientesPendentes, ...opsEntityPendentes].filter(op => !resolvidasIds.has(op.id));
  }, [clients, opsEntityPendentes, hoje, resolvidasIds]);

  // Filtro + ordenação
  const listaFiltrada = useMemo(() => {
    const filtrada = filtroTipo === "todos" ? listaHoje : listaHoje.filter(op => op.tipo === filtroTipo);
    return sortOportunidades(filtrada, ordenar);
  }, [listaHoje, filtroTipo, ordenar]);

  // Contadores por tipo para os filtros
  const contagemPorTipo = useMemo(() => {
    const map = {};
    listaHoje.forEach(op => { map[op.tipo] = (map[op.tipo] || 0) + 1; });
    return map;
  }, [listaHoje]);

  // Callbacks
  const handleResolvida = useCallback((id, status, novaData) => {
    setResolvidasIds(prev => new Set([...prev, id]));
    // Se reagendou para hoje, recarregar
    if (status === "Reagendada" && novaData) {
      const novaDataStr = moment(novaData).format("YYYY-MM-DD");
      if (novaDataStr === hoje) {
        base44.entities.ExecutionOpportunity.filter({ ativo: true }).then(all => {
          setOportunidades(all);
          setResolvidasIds(new Set());
        }).catch(() => {});
      }
    }
    // Atualizar lista de clientes se foi de cliente
    if (id.startsWith("client_")) {
      const clientId = id.replace("client_pend_", "").replace("client_", "");
      if (status === "Resolvida") {
        onClientsChange && onClientsChange(prev => prev.map(c =>
          c.id === clientId ? { ...c, sale_status: "Sim" } : c
        ));
      }
    }
  }, [hoje]);

  const handleCriada = useCallback((nova) => {
    setOportunidades(prev => [...prev, nova]);
  }, []);

  const handleAbrirCliente = useCallback((op) => {
    setFichaCliente({ clienteId: op.cliente_id, clienteObj: op._clienteObj || null });
  }, []);

  const totalHoje = listaHoje.length;

  return (
    <div className="space-y-5">
      {/* ── Aviso de pendências ── */}
      {pendenciasAnteriores.length > 0 && (
        <div className="flex items-center gap-3 bg-[#FFF7E6] border border-[#F59F0A] rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-[#F59F0A] flex-shrink-0" />
          <p className="text-[13px] font-semibold text-[#F59F0A] flex-1">
            Você possui {pendenciasAnteriores.length} pendência{pendenciasAnteriores.length > 1 ? "s" : ""} de dias anteriores.
          </p>
          <button onClick={() => setPendenciasOpen(true)}
            className="text-[12px] font-bold text-[#00A89D] hover:underline flex-shrink-0">
            Ver pendências
          </button>
        </div>
      )}

      {/* ── Indicadores / Filtros compactos ── */}
      {totalHoje > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {FILTROS.map(f => {
            const count = f.id === "todos" ? totalHoje : (contagemPorTipo[f.id] || 0);
            if (f.id !== "todos" && count === 0) return null;
            const ativo = filtroTipo === f.id;
            return (
              <button key={f.id} onClick={() => setFiltroTipo(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-colors ${
                  ativo
                    ? "bg-[#00A89D] text-white border-[#00A89D]"
                    : "bg-white text-[#526B7A] border-[#DFE0E1] hover:border-[#00A89D] hover:text-[#00A89D]"
                }`}>
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${ativo ? "bg-white/20 text-white" : "bg-[#DFE0E1] text-[#526B7A]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Área principal ── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-[14px] font-black text-[#071822]">Suas oportunidades de hoje</h3>
            <p className="text-[12px] text-[#526B7A]">Foque no que realmente importa e avance nas suas vendas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="h-8 text-[12px] font-semibold border-[#DFE0E1] rounded-xl w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioridade">Prioridade</SelectItem>
                <SelectItem value="horario">Horário</SelectItem>
                <SelectItem value="tipo">Tipo</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setNovaAtividade(true)}
              className="flex items-center gap-1.5 bg-[#00A89D] hover:bg-[#00A89D] text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-[0_8px_24px_rgba(0,168,157,0.14)]">
              <Plus className="w-4 h-4" /> Nova atividade
            </button>
          </div>
        </div>

        {/* Lista */}
        {loadingOps ? (
          <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-12 text-center">
            <div className="w-6 h-6 border-4 border-[#DFE0E1] border-t-[#00A89D] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#526B7A]">Carregando oportunidades...</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          totalHoje === 0 ? (
            // Estado vazio completo
            <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F3F2] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#00A89D]" />
              </div>
              <p className="text-[16px] font-black text-[#071822] mb-1">Tela limpa por hoje.</p>
              <p className="text-[13px] text-[#526B7A] mb-5 max-w-sm mx-auto">
                Você não possui oportunidades pendentes para executar agora.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {onGoToRotina && (
                  <button onClick={onGoToRotina}
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-[#00A89D] border border-[#00A89D] rounded-xl hover:bg-[#E8F3F2] transition-colors">
                    <Sparkles className="w-4 h-4" /> Ver Rotina do Dia
                  </button>
                )}
                <Link to="/carteira"
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-[#526B7A] border border-[#DFE0E1] rounded-xl hover:bg-[#F7F8F8] transition-colors">
                  <Users className="w-4 h-4" /> Abrir Carteira
                </Link>
                <button onClick={() => setNovaAtividade(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-white bg-[#00A89D] rounded-xl hover:bg-[#00A89D] transition-colors">
                  <Plus className="w-4 h-4" /> Nova atividade
                </button>
              </div>
            </div>
          ) : (
            // Filtro sem resultados
            <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-10 text-center">
              <Inbox className="w-10 h-10 text-[#DFE0E1] mx-auto mb-3" />
              <p className="text-[13px] text-[#526B7A]">Nenhuma oportunidade do tipo <strong>{filtroTipo}</strong> para hoje.</p>
              <button onClick={() => setFiltroTipo("todos")} className="text-[12px] text-[#00A89D] font-bold mt-2 hover:underline">Ver todas</button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {listaFiltrada.map(op => (
              <OportunidadeCard key={op.id} op={op} onResolver={setResolverTarget} onAbrirCliente={handleAbrirCliente} isMobile={isMobile} />
            ))}

            {/* Todas resolvidas (quando tinha e agora zerou) */}
            {listaHoje.length > 0 && listaFiltrada.length === 0 && filtroTipo === "todos" && (
              <div className="bg-white rounded-2xl border border-[#DFE0E1] shadow-sm p-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#00A89D] mx-auto mb-3" />
                <p className="text-[15px] font-black text-[#071822] mb-1">Todas as oportunidades de hoje foram resolvidas.</p>
                <p className="text-[12px] text-[#526B7A] mb-5 max-w-sm mx-auto">
                  Novas oportunidades aparecerão aqui conforme sua agenda, carteira e processos comerciais forem atualizados.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {onGoToRotina && (
                    <button onClick={onGoToRotina}
                      className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-[#00A89D] border border-[#00A89D] rounded-xl hover:bg-[#E8F3F2] transition-colors">
                      <Sparkles className="w-4 h-4" /> Ver Rotina do Dia
                    </button>
                  )}
                  <Link to="/carteira"
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold text-[#526B7A] border border-[#DFE0E1] rounded-xl hover:bg-[#F7F8F8] transition-colors">
                    <Users className="w-4 h-4" /> Abrir Carteira
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modais ── */}
      <ClienteFichaSheet
        open={!!fichaCliente}
        clienteId={fichaCliente?.clienteId}
        clienteObj={fichaCliente?.clienteObj}
        onClose={() => setFichaCliente(null)}
      />

      {resolverTarget && (
        <ResolverModal
          oportunidade={resolverTarget}
          open
          onClose={() => setResolverTarget(null)}
          onResolvida={handleResolvida}
        />
      )}

      <NovaAtividadeModal
        open={novaAtividade}
        onClose={() => setNovaAtividade(false)}
        clients={clients}
        onCriada={handleCriada}
        vendedorId={profile?.id}
      />

      <PendenciasDrawer
        open={pendenciasOpen}
        onClose={() => setPendenciasOpen(false)}
        pendencias={pendenciasAnteriores}
        onResolvida={handleResolvida}
        onAbrirCliente={handleAbrirCliente}
        onReagendada={(id, novaData) => {
          const novaDataStr = moment(novaData).format("YYYY-MM-DD");
          if (novaDataStr === hoje) {
            setOportunidades(prev => prev.map(op =>
              op.id === id ? { ...op, data_hora_execucao: novaData, status: "Reagendada" } : op
            ));
          }
          setResolvidasIds(prev => new Set([...prev, id]));
        }}
      />
    </div>
  );
}
