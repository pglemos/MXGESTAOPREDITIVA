import { expect, test } from "@playwright/test";
import { getE2ERolePassword, loginWithCredentials } from "./e2e-helpers/auth";

const credentials = {
  email: "gerente@mxgestaopreditiva.com.br",
  password: getE2ERolePassword(),
};

const evidenceRoot = "output/playwright/manager-daily-closing-parity";

test.describe("Fechamento Diário gerencial — estados Base44", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, credentials.email, credentials.password);
    await page.goto("/fechamento-diario");
    await expect(
      page.getByRole("heading", { name: "Fechamento Diário" }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("captura página e modais sem executar mutações", async ({ page }) => {
    test.setTimeout(120_000);
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill("2026-07-14");
    await page.getByRole("button", { name: "Atualizar" }).click();
    await expect(page.getByText(/Movimento da Equipe/)).toBeVisible();
    await page.screenshot({
      path: `${evidenceRoot}/fechamento-loaded-1440x900.png`,
      fullPage: true,
    });

    await page.getByRole("button", { name: "Ver Agenda D+1" }).click();
    const agenda = page.getByRole("dialog", { name: "Agenda D+1" });
    await expect(agenda).toBeVisible();
    await page.screenshot({
      path: `${evidenceRoot}/agenda-d1.png`,
      fullPage: true,
    });

    const confirm = agenda.getByRole("button", { name: "Confirmar" }).first();
    if (await confirm.count()) {
      await confirm.click();
      await expect(page.getByRole("menu", { name: "Resultado da confirmação" })).toBeVisible();
      await page.screenshot({
        path: `${evidenceRoot}/agenda-d1-confirmar-menu.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }
    await page.keyboard.press("Escape");

    const regularizations = page.getByRole("button", {
      name: "Ver Regularizações",
    });
    if (await regularizations.isEnabled()) {
      await regularizations.click();
      const list = page.getByRole("dialog", {
        name: "Regularizações Aguardando Aprovação",
      });
      await expect(list).toBeVisible();
      await page.screenshot({
        path: `${evidenceRoot}/regularizacoes.png`,
        fullPage: true,
      });

      const approve = list.getByRole("button", { name: /^Aprovar / }).first();
      if (await approve.count()) {
        await approve.click();
        await expect(
          page.getByRole("dialog", { name: "Aprovar regularização?" }),
        ).toBeVisible();
        await page.screenshot({
          path: `${evidenceRoot}/aprovar-regularizacao.png`,
          fullPage: true,
        });
        await page.keyboard.press("Escape");
      }
      await page.keyboard.press("Escape");
    }

    await page.getByRole("button", { name: "Corrigir Leads" }).click();
    const leads = page.getByRole("dialog", { name: "Conferência de Leads" });
    await expect(leads).toBeVisible();
    await page.screenshot({
      path: `${evidenceRoot}/conferencia-leads.png`,
      fullPage: true,
    });
    await leads.getByRole("button", { name: "Ver Histórico" }).click();
    await expect(
      page.getByRole("dialog", { name: "Histórico de Conferências" }),
    ).toBeVisible();
    await page.screenshot({
      path: `${evidenceRoot}/historico-conferencias.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    const details = page.getByRole("button", { name: "Detalhes" }).first();
    if (await details.count()) {
      await details.click();
      await expect(
        page.getByRole("dialog", { name: /Detalhes do Fechamento/ }),
      ).toBeVisible();
      await page.screenshot({
        path: `${evidenceRoot}/detalhes-fechamento.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }

    const charge = page.getByRole("button", { name: "Cobrar Pendentes" });
    if (await charge.isEnabled()) {
      await charge.click();
      await expect(
        page.getByRole("dialog", { name: "Cobrar Fechamentos Pendentes" }),
      ).toBeVisible();
      await page.screenshot({
        path: `${evidenceRoot}/cobrar-pendentes.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }
  });
});
