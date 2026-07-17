import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AgendaConfirmationMenu } from "./AgendaConfirmationMenu";

describe("AgendaConfirmationMenu", () => {
  afterEach(() => cleanup());

  test("abre o menu Base44 e entrega o resultado escolhido", () => {
    const onSelect = mock(() => undefined);

    render(<AgendaConfirmationMenu onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    for (const outcome of [
      "Confirmado",
      "Sem resposta",
      "Solicitou reagendamento",
      "Cancelou",
      "Outro",
    ]) {
      expect(screen.getByRole("menuitem", { name: outcome })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("menuitem", { name: "Sem resposta" }));
    expect(onSelect).toHaveBeenCalledWith("Sem resposta");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  test("fecha por Escape e clique externo", () => {
    render(<AgendaConfirmationMenu onSelect={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
