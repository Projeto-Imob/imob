import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { interpolar, ptBR } from "../../src/i18n/pt-BR";
import { CASOS_EXCLUSAO, gerarSeed } from "../../src/seed/seed";
import { esperarSemViolacoesAxe } from "./axe";

// Página pública do empreendimento (fatia 0.3). Lê do Postgres local (npm run db:reset) pela vitrine do banco.
const ELEGIVEL = { slug: "residencial-jardim-das-aguas", nome: "Residencial Jardim das Águas", bairro: "Moinhos de Vento" };
const NOMES = new Map(gerarSeed().empreendimentos.map((e) => [e.slug, e.nome]));
// Capturas de tela da fatia, fora do git (.gitignore).
const CAPTURAS = "capturas/fatia-0.3";

async function esperarNaoEncontrado(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: ptBR["empreendimento.nao_encontrado.titulo"] })).toBeVisible();
  // O Next põe o noindex no head e, quando a resposta já está em streaming, também junto do conteúdo.
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
}

async function capturar(page: Page, nome: string) {
  mkdirSync(CAPTURAS, { recursive: true });
  await page.screenshot({ path: `${CAPTURAS}/${nome}.png`, fullPage: true });
}

for (const largura of [390, 1440]) {
  test.describe(`empreendimento em ${largura} px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test("abre um empreendimento elegível com o resumo do banco, sem violação no axe", async ({ page }) => {
      const resposta = await page.goto(`/empreendimento/${ELEGIVEL.slug}`);
      expect(resposta?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: ELEGIVEL.nome })).toBeVisible();
      await expect(page.getByText(ptBR["empreendimento.selo_ri"])).toBeVisible();
      const local = interpolar(ptBR["empreendimento.local"], { bairro: ELEGIVEL.bairro, cidade: "Porto Alegre", uf: "RS" });
      await expect(page.getByText(local)).toBeVisible();
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

      const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(larguraDocumento).toBeLessThanOrEqual(largura);

      await esperarSemViolacoesAxe(page);
      await capturar(page, `empreendimento-${largura}`);
    });

    test("não encontrado com noindex, sem violação no axe", async ({ page }) => {
      await page.goto(`/empreendimento/${CASOS_EXCLUSAO.semRI}`);
      await esperarNaoEncontrado(page);
      await esperarSemViolacoesAxe(page);
      await capturar(page, `nao-encontrado-${largura}`);
    });
  });
}

test.describe("cada caso de exclusão do seed", () => {
  const casos: [string, string][] = [...Object.entries(CASOS_EXCLUSAO), ["inexistente", "nao-existe"]];
  for (const [caso, slug] of casos) {
    test(`${caso}: não encontrado, com noindex e sem dado do empreendimento`, async ({ page }) => {
      await page.goto(`/empreendimento/${slug}`);
      await esperarNaoEncontrado(page);
      const nome = NOMES.get(slug);
      if (nome) await expect(page.getByText(nome)).toHaveCount(0);
    });
  }
});
