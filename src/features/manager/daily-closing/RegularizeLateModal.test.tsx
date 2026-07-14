import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RegularizeLateModal } from "./RegularizeLateModal";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

describe("RegularizeLateModal", () => {
  afterEach(() => cleanup());

  test("exibe os dados e envia a justificativa", () => {
    const onSubmit = mock(() => undefined);

    render(
      <RegularizeLateModal
        open
        sellerName="Ana Oliveira"
        referenceDate="2026-07-14"
        submittedAt="2026-07-14T18:14:00-03:00"
        saving={false}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Regularizar Fechamento" })).toBeTruthy();
    expect(screen.getByText("Ana Oliveira — 14/07/2026")).toBeTruthy();
    expect(screen.getByText("18:14")).toBeTruthy();

    const submit = screen.getByRole("button", { name: "Enviar Regularização" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Observação da regularização"), {
      target: { value: "Fechamento concluído após validação dos dados do CRM." },
    });
    expect((submit as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(
      "Fechamento concluído após validação dos dados do CRM.",
    );
  });
});
