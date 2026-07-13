import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ClosingDetailsModal } from "./ClosingDetailsModal";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

describe("ClosingDetailsModal", () => {
  afterEach(() => cleanup());

  test("exibe os dados do fechamento e abre a agenda do vendedor", () => {
    const onOpenAgenda = mock(() => undefined);
    const onClose = mock(() => undefined);

    render(
      <ClosingDetailsModal
        open
        seller={{ id: "seller-1", name: "Ana Oliveira" }}
        checkin={{
          reference_date: "2026-07-13",
          submitted_at: "2026-07-13T18:30:00.000Z",
          leads_prev_day: 5,
          leads_net_prev_day: 2,
          agd_cart_today: 1,
          agd_net_today: 2,
          vnd_porta_prev_day: 1,
          vnd_cart_prev_day: 1,
          vnd_net_prev_day: 0,
          visit_prev_day: 4,
          pontuacao_disciplina_final: 72,
          pontuacao_disciplina_base: 72,
        } as never}
        status="Finalizado"
        onOpenAgenda={onOpenAgenda}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Detalhes do Fechamento — Ana Oliveira")).toBeTruthy();
    expect(screen.getByText("Movimento por Canal")).toBeTruthy();
    expect(screen.getByRole("dialog").textContent).toContain("72%");
    fireEvent.click(screen.getByRole("button", { name: /Ver Agenda D\+1 deste vendedor/i }));
    expect(onOpenAgenda).toHaveBeenCalledTimes(1);
  });
});
