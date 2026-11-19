import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import pg from "pg";
import { ptBR } from "../../src/i18n/pt-BR";
import { CASOS_EXCLUSAO, gerarSeed } from "../../src/seed/seed";
import { ehLocal, urlDoPapel } from "../../scripts/db/config";
import { esperarSemViolacoesAxe } from "./axe";

// Página pública do empreendimento (fatias 0.3 e 1.1). Lê do Postgres local (npm run db:reset) pela vitrine do banco.
const ELEGIVEL = { slug: "residencial-jardim-das-aguas", nome: "Residencial Jardim das Águas", bairro: "Moinhos de Vento" };
const SEM_DADOS = "studio-cidade-baixa";
const ESPELHO_23H = "edificio-mirante-petropolis";
const ESPELHO_30H = "bela-vista-prime";
const NOMES = new Map(gerarSeed().empreendimentos.map((e) => [e.slug, e.nome]));
// Capturas de tela da fatia, fora do git (.gitignore).
const CAPTURAS = "capturas/fatia-1.1";

const T = ptBR;
const TITULOS = {
  galeria: T["empreendimento.galeria.titulo"],
  custos: T["empreendimento.custos.titulo"],
  plantas: T["empreendimento.plantas.titulo"],
  viz: T["empreendimento.viz.titulo"],
  numeros: T["empreendimento.numeros.titulo"],
  numerosInvestir: T["empreendimento.numeros.titulo_investir"],
  comodidades: T["empreendimento.comodidades.titulo"],
  escritorio: T["empreendimento.escritorio.titulo"],
  legais: T["empreendimento.legais.titulo"],
};

// Espelho de unidades com 23 h e com 30 h (regra 10), gravado como migrator e só em localhost.
test.beforeAll(async () => {
  const url = urlDoPapel("migrator", "dev");
  if (!ehLocal(url)) throw new Error("O e2e da página só altera o espelho em localhost.");
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const horas = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
    await c.query("update empreendimentos set espelho_atualizado_em = $1 where slug = $2", [horas(23), ESPELHO_23H]);
    await c.query("update empreendimentos set espelho_atualizado_em = $1 where slug = $2", [horas(30), ESPELHO_30H]);
  } finally {
    await c.end();
  }
});

async function esperarNaoEncontrado(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: ptBR["empreendimento.nao_encontrado.titulo"] })).toBeVisible();
  // O Next põe o noindex no head e, quando a resposta já está em streaming, também junto do conteúdo.
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
}

async function capturar(page: Page, nome: string) {
  mkdirSync(CAPTURAS, { recursive: true });
  await page.screenshot({ path: `${CAPTURAS}/${nome}.png`, fullPage: true });
}

const titulosDaPagina = (page: Page) => page.locator("main h1, main h2").allTextContents();

for (const largura of [390, 1440]) {
  test.describe(`empreendimento em ${largura} px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    const casos: Array<[string, string, string[]]> = [
      [
        "Morar",
        "?modo=morar",
        [TITULOS.galeria, ELEGIVEL.nome, TITULOS.custos, TITULOS.plantas, TITULOS.viz, TITULOS.numeros, TITULOS.comodidades, TITULOS.escritorio, TITULOS.legais],
      ],
      [
        "Investir",
        "?modo=investir",
        [ELEGIVEL.nome, TITULOS.numerosInvestir, TITULOS.custos, TITULOS.viz, TITULOS.galeria, TITULOS.plantas, TITULOS.comodidades, TITULOS.escritorio, TITULOS.legais],
      ],
      [
        "modo inválido (cai em Morar)",
        "?modo=vender",
        [TITULOS.galeria, ELEGIVEL.nome, TITULOS.custos, TITULOS.plantas, TITULOS.viz, TITULOS.numeros, TITULOS.comodidades, TITULOS.escritorio, TITULOS.legais],
      ],
    ];

    for (const [rotulo, consulta, ordem] of casos) {
      test(`${rotulo}: blocos na ordem, sem rolagem horizontal, sem CRECI e sem violação no axe`, async ({ page }) => {
        const resposta = await page.goto(`/empreendimento/${ELEGIVEL.slug}${consulta}`);
        expect(resposta?.status()).toBe(200);
        await expect(page.getByRole("heading", { level: 1, name: ELEGIVEL.nome })).toBeVisible();
        await expect(page.getByText(ptBR["empreendimento.selo_ri"])).toBeVisible();
        await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

        expect(await titulosDaPagina(page)).toEqual(ordem);
        await expect(page.locator("body")).not.toContainText(/CRECI/i);

        const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(larguraDocumento).toBeLessThanOrEqual(largura);

        await esperarSemViolacoesAxe(page);
        await capturar(page, `empreendimento-${rotulo.split(" ")[0]!.toLowerCase()}-${largura}`);
      });
    }

    test("não encontrado com noindex, sem violação no axe", async ({ page }) => {
      await page.goto(`/empreendimento/${CASOS_EXCLUSAO.semRI}`);
      await esperarNaoEncontrado(page);
      await esperarSemViolacoesAxe(page);
      await capturar(page, `nao-encontrado-${largura}`);
    });

    test("Studio Cidade Baixa: Não informado onde falta dado, sem violação no axe", async ({ page }) => {
      await page.goto(`/empreendimento/${SEM_DADOS}`);
      await expect(page.getByRole("heading", { level: 1, name: NOMES.get(SEM_DADOS)! })).toBeVisible();
      const escritorio = page.getByRole("region", { name: TITULOS.escritorio });
      await expect(escritorio.getByText(ptBR["empreendimento.nao_informado"]).first()).toBeVisible();
      await expect(escritorio.getByRole("link")).toHaveCount(0);
      const comodidades = page.getByRole("region", { name: TITULOS.comodidades });
      await expect(comodidades.getByText(ptBR["empreendimento.nao_informado"])).toBeVisible();
      await esperarSemViolacoesAxe(page);
      await capturar(page, `studio-nao-informado-${largura}`);
    });
  });
}

test.describe("conteúdo da página", () => {
  test("cartão da house com contato liberado e custos pela unidade escolhida", async ({ page }) => {
    await page.goto(`/empreendimento/${ELEGIVEL.slug}`);
    const escritorio = page.getByRole("region", { name: TITULOS.escritorio });
    await expect(escritorio.getByText("Helena Exemplo")).toBeVisible();
    await expect(escritorio.getByRole("link", { name: ptBR["empreendimento.escritorio.whatsapp"] })).toHaveAttribute("href", /^https:\/\/wa\.me\/5551900000100\?text=/);
    await expect(escritorio.getByRole("link", { name: ptBR["empreendimento.escritorio.email"] })).toHaveAttribute("href", /^mailto:/);
    // Decisão de 18/11/2026: só WhatsApp e e-mail ficam públicos; o telefone sai do cartão (flag desligada).
    await expect(escritorio.getByRole("link", { name: ptBR["empreendimento.escritorio.telefone"] })).toHaveCount(0);

    const custos = page.getByRole("region", { name: TITULOS.custos });
    await expect(custos.getByText("corrigidas pelo índice do contrato", { exact: false })).toBeVisible();
    const seletor = custos.getByLabel(ptBR["empreendimento.custos.unidade"]);
    const preco = custos.locator("li", { hasText: ptBR["empreendimento.custos.preco"] });
    const antes = await preco.innerText();
    const opcoes = await seletor.locator("option").count();
    expect(opcoes).toBeGreaterThan(1);
    await seletor.selectOption({ index: opcoes - 1 });
    await expect(preco).not.toHaveText(antes);
    await expect(page.locator("body")).not.toContainText(/INCC|IGP|IPCA|Selic/);
  });

  test("a vizinhança mostra o tempo a pé e a frase-resumo", async ({ page }) => {
    await page.goto(`/empreendimento/${ELEGIVEL.slug}`);
    const viz = page.getByRole("region", { name: TITULOS.viz });
    await expect(viz.getByText(/min a pé/).first()).toBeVisible();
    await expect(viz.getByText(/^Escola a \d+ min a pé, parque a \d+ min\.$/)).toBeVisible();
  });

  test("escassez só com o espelho atualizado há menos de 24 h (regra 10)", async ({ page }) => {
    await page.goto(`/empreendimento/${ESPELHO_23H}`);
    await expect(page.getByText(/^Restam \d+$/).first()).toBeVisible();
    await expect(page.getByText(ptBR["empreendimento.espelho_fresco"])).toBeVisible();

    for (const slug of [ESPELHO_30H, ELEGIVEL.slug]) {
      await page.goto(`/empreendimento/${slug}`);
      await expect(page.getByText(ptBR["empreendimento.disponibilidade_confirmar"])).toBeVisible();
      await expect(page.getByText(/Restam/)).toHaveCount(0);
    }
  });
});

test.describe("barra fixa no celular", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("mostra a entrada e leva ao escritório; sem agendar enquanto a flag está desligada", async ({ page }) => {
    await page.goto(`/empreendimento/${ELEGIVEL.slug}`);
    const barra = page.getByRole("region", { name: ptBR["empreendimento.barra.rotulo"] });
    await expect(barra).toBeVisible();
    await expect(barra.getByText(/R\$/)).toBeVisible();
    await expect(barra.getByRole("link", { name: ptBR["empreendimento.barra.agendar"] })).toHaveCount(0);
    await barra.getByRole("link", { name: ptBR["empreendimento.barra.falar_gerente"] }).click();
    await expect(page).toHaveURL(/#escritorio$/);
  });
});

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
