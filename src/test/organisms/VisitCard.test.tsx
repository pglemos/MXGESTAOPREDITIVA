import { expect, test, describe, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { VisitCard } from "@/components/organisms/VisitCard";
import type { VisitCardData } from "@/components/organisms/VisitCard";
import { MemoryRouter } from "react-router-dom";
import * as React from "react";

afterEach(() => {
  cleanup();
});

const mockVisit: VisitCardData = {
  id: "visit-1",
  client_id: "client-1",
  client_name: "Acme Corp",
  visit_number: 3,
  scheduled_at: "2026-04-16T10:00:00",
  duration_hours: 2,
  modality: "Presencial",
  objective: "Review quarterly results",
  status: "agendada",
  consultant: { name: "Dr. Silva" },
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("VisitCard", () => {
  test("renders client name", () => {
    renderWithRouter(<VisitCard visit={mockVisit} linkTo="/visits/1" />);
    expect(screen.getByText("Acme Corp")).toBeDefined();
  });

  test("renders scheduled time", () => {
    renderWithRouter(<VisitCard visit={mockVisit} linkTo="/visits/1" />);
    expect(screen.getByText(/10:00/)).toBeDefined();
  });

  test("renders status badge", () => {
    renderWithRouter(<VisitCard visit={mockVisit} linkTo="/visits/1" />);
    expect(screen.getByText("AGENDADA")).toBeDefined();
  });

  test("renders visit number", () => {
    renderWithRouter(<VisitCard visit={mockVisit} linkTo="/visits/1" />);
    expect(screen.getByText(/Visita 3\/7/)).toBeDefined();
  });

  test("links to correct URL", () => {
    renderWithRouter(<VisitCard visit={mockVisit} linkTo="/visits/1" />);
    const links = screen.getAllByRole("link");
    const visitLink = links.find((l) => l.getAttribute("href") === "/visits/1");
    expect(visitLink).toBeDefined();
  });

  test("renders cancelled status", () => {
    const cancelledVisit = { ...mockVisit, status: "cancelada" };
    renderWithRouter(<VisitCard visit={cancelledVisit} linkTo="/visits/1" />);
    expect(screen.getByText("CANCELADA")).toBeDefined();
  });

  test("renders completed status", () => {
    const completedVisit = { ...mockVisit, status: "concluída" };
    renderWithRouter(<VisitCard visit={completedVisit} linkTo="/visits/1" />);
    expect(screen.getByText("CONCLUÍDA")).toBeDefined();
  });
});
