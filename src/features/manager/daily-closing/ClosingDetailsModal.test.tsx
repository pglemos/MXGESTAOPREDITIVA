import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ClosingDetailsModal } from "./ClosingDetailsModal";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

mock.module("@/hooks/useAuth", () => ({
  useAuth: () => ({ membership: { store: { name: "Matriz" } } }),
}));

describe("ClosingDetailsModal", () => {
  afterEach(() => cleanup());

  test("exibe dados gerais, movimento por canal e abre Agenda D+1", () => {
    const onOpenAgenda = mock(() => undefined);

    render(
      <ClosingDetailsModal
        open
        seller={{ id: "seller-1", name: "Ana Oliveira" }}
        status="Fora do horário"
        checkin={{
          reference_date: "2026-07-14",
          submitted_at: "2026-07-14T18:14:00-03:00",
          pontuacao_disciplina_final: 62,
          visit_prev_day: 6,
          leads_prev_day: 4,
          leads_net_prev_day: 6,
          agd_cart_today: 3,
          agd_net_today: 2,
          vnd_porta_prev_day: 1,
          vnd_cart_prev_day: 1,
          vnd_net_prev_day: 0,
        }}
        onClose={() => undefined}
        onOpenAgenda={onOpenAgenda}
      />,
    );

    expect(screen.getByText("Matriz")).toBeTruthy();
    expect(screen.getByText("Fora do horário")).toBeTruthy();
    expect(screen.getByLabelText("Disciplina 62%")).toBeTruthy();
    expect(screen.getByText("Movimento por Canal")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver Agenda D+1 deste vendedor",
      }),
    );
    expect(onOpenAgenda).toHaveBeenCalledTimes(1);
  });
});
