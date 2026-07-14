import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CalendarCheck, Home } from "lucide-react";
import ManagerReferenceShell from "./ManagerReferenceShell";

afterEach(cleanup);

describe("ManagerReferenceShell", () => {
  test("reproduz a estrutura de sidebar clara usada pelo Base44 para gerente", () => {
    render(
      <MemoryRouter initialEntries={["/fechamento-diario"]}>
        <ManagerReferenceShell
          navSections={[
            {
              label: "MENU",
              items: [
                { label: "Início", path: "/home", icon: <Home /> },
                {
                  label: "Fechamento Diário",
                  path: "/fechamento-diario",
                  icon: <CalendarCheck />,
                },
              ],
            },
          ]}
        >
          <p>Conteúdo do fechamento</p>
        </ManagerReferenceShell>
      </MemoryRouter>,
    );

    expect(screen.getAllByLabelText("Menu principal do Gerente")[0].className).toContain("bg-white");
    expect(screen.getByText("Módulo Gerencial")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Fechamento Diário" }).getAttribute("class")).toContain("bg-emerald-600");
    expect(screen.getByText("Conteúdo do fechamento")).toBeTruthy();
  });
});
