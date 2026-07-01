import React, { useState } from "react";
import FluxoFechamento from "@/components/fechamento/FluxoFechamento";
import ClientCardMobile from "@/components/fechamento/ClientCardMobile";
import ClientesListaMobile from "@/components/fechamento/ClientesListaMobile";
import DisciplinaMobile from "@/components/fechamento/DisciplinaMobile";
import FinalizarMobile from "@/components/fechamento/FinalizarMobile";

export default function MobileFechamento({
  dc,
  updateCounter,
  setCounter,
  clients,
  closingDate,
  bloqueado,
  d1Editavel,
  onAuditLog,
  dailyClose,
  onDailyCloseUpdate,
  onClientsChange,
  totalLeads,
  totalAtend,
  totalAgend,
  totalVendas,
  totalFaturamento,
  liberado,
  onRegistroSalvo,
}) {
  // Estado para edição/exclusão vindos da lista de clientes
  const [editingClientExterno, setEditingClientExterno] = useState(null);
  const [deleteConfirmExterno, setDeleteConfirmExterno] = useState(null);

  // O botão + modais do ClientCardMobile ficam dentro do step 4 do FluxoFechamento
  const vendasContent = (
    <ClientCardMobile
      onClientsChange={onClientsChange}
      closingDate={closingDate}
      bloqueado={bloqueado}
      d1Editavel={d1Editavel}
      onAuditLog={onAuditLog}
      dailyCloseId={dailyClose?.id}
      clients={clients}
      onRegistroSalvo={onRegistroSalvo}
      editingClientExterno={editingClientExterno}
      onEditExternoHandled={() => setEditingClientExterno(null)}
      deleteConfirmExterno={deleteConfirmExterno}
      onDeleteExternoHandled={() => setDeleteConfirmExterno(null)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Blocos 1–4: Progresso + Etapas (Showroom, Carteira, Internet, Vendas) */}
      <FluxoFechamento
        dc={dc}
        updateCounter={updateCounter}
        setCounter={setCounter}
        clients={clients}
        closingDate={closingDate}
        bloqueado={bloqueado}
        d1Editavel={d1Editavel}
        onAuditLog={onAuditLog}
        vendasContent={vendasContent}
      />

      {/* Lista de clientes cadastrados (abaixo das etapas) */}
      <ClientesListaMobile
        clients={clients}
        closingDate={closingDate}
        bloqueado={bloqueado}
        d1Editavel={d1Editavel}
        onEdit={(c) => setEditingClientExterno(c)}
        onDelete={(c) => setDeleteConfirmExterno(c)}
      />

      {/* Disciplina */}
      <DisciplinaMobile
        clients={clients}
        agendamentosD1Carteira={dc.agendamentos_carteira || 0}
        agendamentosD1Internet={dc.agendamentos_internet || 0}
        closingDate={closingDate}
        totalLeads={totalLeads}
        totalAtend={totalAtend}
        penalizado={false}
        dailyClose={dailyClose}
      />

      {/* Botão Finalizar */}
      <FinalizarMobile
        clients={clients}
        agendamentosD1Carteira={dc.agendamentos_carteira || 0}
        agendamentosD1Internet={dc.agendamentos_internet || 0}
        closingDate={closingDate}
        totalLeads={totalLeads}
        totalAtend={totalAtend}
        penalizado={false}
        liberado={liberado}
        dailyClose={dailyClose}
        onDailyCloseUpdate={onDailyCloseUpdate}
      />
    </div>
  );
}