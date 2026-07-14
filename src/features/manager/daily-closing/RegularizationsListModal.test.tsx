import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RegularizationsListModal, type RegularizationRequest } from "./RegularizationsListModal";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

const request = {
  id: "request-1",
  seller_id: "seller-1",
  created_at: "2026-07-14T17:35:00-03:00",
  requested_values: {
    reference_date: "2026-07-14",
    leads: 8,
    agd_total: 2,
    vnd_total: 1,
    visitas: 9,
    pontuacao_disciplina_final: 78,
  },
  seller: { name: "Mateus Costa", avatar_url: null },
} as unknown as RegularizationRequest;

describe("RegularizationsListModal", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  test("exige confirmação explícita antes de aprovar", () => {
    const onApprove = mock(() => undefined);

    render(
      <RegularizationsListModal
        open
        requests={[request]}
        onClose={() => undefined}
        onApprove={onApprove}
        onReject={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprovar Mateus Costa" }));

    expect(onApprove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Aprovar regularização?" })).toBeTruthy();
    expect(screen.getByText("Mateus Costa — 14/07/2026")).toBeTruthy();

    const approve = screen.getByRole("button", { name: "Aprovar", exact: true });
    expect((approve as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "Confirmo a aprovação da regularização." }));
    expect((approve as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(approve);
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledWith(request, "");
  });

  test("exige motivo antes de recusar", () => {
    const onReject = mock(() => undefined);

    render(
      <RegularizationsListModal
        open
        requests={[request]}
        onClose={() => undefined}
        onApprove={() => undefined}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Recusar Mateus Costa" }));

    expect(onReject).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Recusar regularização?" })).toBeTruthy();

    const reject = screen.getByRole("button", { name: "Confirmar recusa" });
    expect((reject as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Motivo da recusa"), {
      target: { value: "Valores informados não conferem com o fechamento." },
    });
    expect((reject as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(reject);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith(
      request,
      "Valores informados não conferem com o fechamento.",
    );
  });
});
