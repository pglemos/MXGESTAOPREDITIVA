import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RegularizationsListModal } from "./RegularizationsListModal";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

describe("RegularizationsListModal", () => {
  afterEach(() => cleanup());

  test("exige confirmação explícita antes de encaminhar uma aprovação", () => {
    const onApprove = mock(() => undefined);
    const onReject = mock(() => undefined);
    const onClose = mock(() => undefined);
    const request = {
      id: "request-1",
      seller_id: "seller-1",
      store_id: "store-1",
      checkin_id: "checkin-1",
      status: "pending",
      created_at: "2026-07-13T10:20:00.000Z",
      requested_values: {
        reference_date: "2026-07-13",
        leads_cart: 3,
        leads_net: 2,
        agd_cart_today: 1,
        agd_net_today: 2,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 1,
        vnd_net_prev_day: 0,
        visit_prev_day: 4,
        pontuacao_disciplina_base: 72,
      },
      seller: { name: "Ana Oliveira", avatar_url: null },
    } as never;

    render(
      <RegularizationsListModal
        open
        requests={[request]}
        onClose={onClose}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Regularizações Aguardando Aprovação" });
    expect(within(dialog).getByText("Ana Oliveira")).toBeTruthy();
    const dialogText = dialog.textContent || "";
    expect(dialogText).toContain("Leads: 5");
    expect(dialogText).toContain("Agend.: 3");
    expect(dialogText).toContain("Vendas: 2");
    expect(dialogText).toContain("Atend.: 4");

    fireEvent.click(within(dialog).getByRole("button", { name: "Aprovar Ana Oliveira" }));
    expect(screen.getByRole("dialog", { name: "Aprovar regularização?" })).toBeTruthy();
    expect(onApprove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Confirmo a aprovação da regularização." }));
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    expect(onApprove).toHaveBeenCalledWith(request);
    expect(onReject).not.toHaveBeenCalled();
  });
});
