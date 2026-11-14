import { expect, test } from "@playwright/test";
import { ptBR } from "../../src/i18n/pt-BR";
import { esperarSemViolacoesAxe } from "./axe";

const AREAS = [
  [ptBR["nav.inicio"], "/"],
  [ptBR["nav.buscar"], "/buscar-imoveis"],
  [ptBR["nav.mapa"], "/mapa"],
  [ptBR["nav.favoritos"], "/favoritos"],
  [ptBR["nav.conta"], "/conta"],
] as const;

for (const largura of [390, 1024, 1440]) {
  test.describe(`layout em ${largura} px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test("navegação de cinco áreas, rodapé sem CRECI, dados de exemplo e axe", async ({ page }) => {
      await page.goto("/");

      const nav = page.getByRole("navigation", { name: ptBR["nav.rotulo"] });
      await expect(nav).toBeVisible();
      for (const [rotulo, href] of AREAS) {
        await expect(nav.getByRole("link", { name: rotulo })).toHaveAttribute("href", href);
      }
      await expect(nav.getByRole("link", { name: ptBR["nav.inicio"] })).toHaveAttribute("aria-current", "page");

      // Barra inferior fixa no celular; menu no cabeçalho no desktop.
      const caixaNav = (await nav.boundingBox())!;
      if (largura < 768) {
        expect(caixaNav.y + caixaNav.height).toBeCloseTo(900, 0);
      } else {
        expect(caixaNav.y).toBeLessThan(80);
      }

      // Alvos de toque de pelo menos 44 × 44 px.
      for (const link of await nav.getByRole("link").all()) {
        const caixa = (await link.boundingBox())!;
        expect(caixa.width).toBeGreaterThanOrEqual(44);
        expect(caixa.height).toBeGreaterThanOrEqual(44);
      }

      const rodape = page.getByRole("contentinfo");
      await expect(rodape.getByTestId("aviso-dados-exemplo")).toHaveText(ptBR["rodape.dados_exemplo"]);
      await expect(page.locator("body")).not.toContainText(/CRECI/i);

      const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(larguraDocumento).toBeLessThanOrEqual(largura);

      await esperarSemViolacoesAxe(page);
    });
  });
}
