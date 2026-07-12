import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  PENDING_CLOSING_MESSAGE,
  PendingReminderModal,
} from "./ManagerDailyClosing.container";

globalThis.getComputedStyle ||= (() => ({ animationName: "none" })) as typeof getComputedStyle;
globalThis.MutationObserver ||= class {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof MutationObserver;

describe("PendingReminderModal", () => {
  test("confirma a cobrança antes de disparar a ação", () => {
    const onConfirm = mock(() => undefined);
    const onClose = mock(() => undefined);
    const pendingRows = [
      { seller: { id: "seller-1", name: "Ana Oliveira" } },
      { seller: { id: "seller-2", name: "João Silva" } },
    ] as Parameters<typeof PendingReminderModal>[0]["pendingRows"];

    render(
      <PendingReminderModal
        open
        pendingRows={pendingRows}
        reminding={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("2 vendedor(es) pendente(s)")).toBeTruthy();
    expect(screen.getByText("Ana Oliveira")).toBeTruthy();
    expect(screen.getByText(`“${PENDING_CLOSING_MESSAGE}”`)).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar Cobrança" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
