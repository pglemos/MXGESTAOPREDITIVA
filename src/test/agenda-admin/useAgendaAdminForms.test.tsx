import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { useAgendaAdminForms } from "@/features/agenda-admin/hooks/useAgendaAdminForms";
import type { AgendaConsultant, AgendaVisit } from "@/hooks/agenda";

afterEach(() => {
  cleanup();
});

const consultants: AgendaConsultant[] = [
  { id: "consultant-1", name: "Joao", email: "joao@example.com" },
];

const visit: AgendaVisit = {
  id: "visit-1",
  client_id: "client-1",
  client_name: "GED Veiculos",
  client_slug: "ged-veiculos",
  client_status: "ativo",
  client_modality: "Presencial",
  visit_number: 6,
  scheduled_at: "2026-05-27T09:00:00-03:00",
  duration_hours: 3,
  modality: "Presencial",
  status: "agendada",
  consultant_id: "consultant-1",
  auxiliary_consultant_id: null,
  objective: "Visita 6/7",
  visit_reason: "Plano de desenvolvimento",
  target_audience: "Gerente",
  product_name: "PMR",
  checklist_data: [],
  feedback_client: null,
  executive_summary: null,
  google_event_id: null,
  google_event_id_central: null,
  google_meet_link: null,
  meta_mensal: null,
  projecao: null,
  leads_mes: null,
  estoque_disponivel: null,
  created_at: "2026-05-26T12:00:00-03:00",
  updated_at: "2026-05-26T12:00:00-03:00",
  consultant: { name: "Joao", email: "joao@example.com" },
};

const ok = async () => ({ error: null });

function AgendaFormsHarness() {
  const [visits, setVisits] = React.useState<AgendaVisit[]>([]);
  const forms = useAgendaAdminForms({
    visits,
    consultants,
    canViewAllAgendas: true,
    createVisit: ok,
    updateVisit: ok,
    updateVisitStatus: ok,
    deleteVisit: ok,
    createScheduleEvent: ok,
    updateScheduleEvent: ok,
    deleteScheduleEvent: ok,
    getNextVisitNumber: () => 1,
  });

  return (
    <>
      <button type="button" onClick={() => setVisits([visit])}>Carregar visitas</button>
      <button type="button" onClick={() => forms.handleOpenEditVisit(visit.id)}>Editar visita</button>
      <span data-testid="editing-visit-id">{forms.editingVisitId || "none"}</span>
      <span data-testid="editing-client-id">{forms.scheduleForm.client_id || "none"}</span>
      {forms.showScheduleModal && <div role="dialog">Editar Visita de Consultoria</div>}
    </>
  );
}

describe("useAgendaAdminForms", () => {
  test("opens edit modal with visits loaded after initial render", () => {
    render(<AgendaFormsHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Carregar visitas" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar visita" }));

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByTestId("editing-visit-id")).toHaveTextContent("visit-1");
    expect(screen.getByTestId("editing-client-id")).toHaveTextContent("client-1");
  });
});
