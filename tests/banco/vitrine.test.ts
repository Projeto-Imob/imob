import type pg from "pg";
import { describe, expect, it } from "vitest";
import { CASOS_EXCLUSAO, gerarSeed } from "@/seed/seed";
import { CONTAS, FIXTURES, URL_BANCO, comCliente, comoApp, emTransacao } from "./apoio";

// Migration 0002_vitrine: app.na_vitrine é a regra da vitrine pública no banco, e app.esgotado passa a
// olhar só as torres que o público vê.

const EXCLUIDOS: string[] = Object.values(CASOS_EXCLUSAO);
const ELEGIVEIS = gerarSeed()
  .empreendimentos.map((e) => e.slug)
  .filter((slug) => !EXCLUIDOS.includes(slug))
  .sort();

const vitrinePorSlug = async (c: pg.Client) =>
  Object.fromEntries(
    (await c.query<{ slug: string; v: boolean }>("select slug, app.na_vitrine(id) as v from empreendimentos")).rows.map(
      (r) => [r.slug, r.v],
    ),
  );

const situacao = async (c: pg.Client, slug: string) =>
  (
    await c.query<{ esgotado: boolean; na_vitrine: boolean }>(
      "select app.esgotado(id) as esgotado, app.na_vitrine(id) as na_vitrine from empreendimentos where slug = $1",
      [slug],
    )
  ).rows[0];

describe("app.na_vitrine (vitrine pública)", () => {
  it("vale para os elegíveis do seed e não vale para nenhum caso de exclusão, mesmo para quem vê tudo", async () => {
    const vitrine = await comoApp({ contaId: CONTAS.houseAnalista }, vitrinePorSlug);
    expect(Object.keys(vitrine)).toHaveLength(ELEGIVEIS.length + EXCLUIDOS.length);
    for (const slug of EXCLUIDOS) expect(vitrine[slug], slug).toBe(false);
    for (const slug of ELEGIVEIS) expect(vitrine[slug], slug).toBe(true);
  });

  it("não listado fica fora da vitrine também para quem tem login", async () => {
    const vitrine = await comoApp({ contaId: CONTAS.comprador }, vitrinePorSlug);
    expect(vitrine[CASOS_EXCLUSAO.naoListado]).toBe(false);
  });

  it("visitante sem contexto: filtrar por na_vitrine devolve só os elegíveis", async () => {
    const slugs = await comoApp({}, async (c) =>
      (await c.query<{ slug: string }>("select slug from empreendimentos where app.na_vitrine(id) order by slug")).rows.map(
        (r) => r.slug,
      ),
    );
    expect(slugs).toEqual(ELEGIVEIS);
  });

  it("app_user e worker executam na_vitrine", async () => {
    const r = await comCliente(URL_BANCO.admin, async (c) =>
      (
        await c.query<{ app: boolean; worker: boolean }>(`
          select has_function_privilege('app_user', 'app.na_vitrine(uuid)', 'execute') as app,
                 has_function_privilege('worker', 'app.na_vitrine(uuid)', 'execute') as worker`)
      ).rows[0],
    );
    expect(r).toEqual({ app: true, worker: true });
  });
});

describe("app.esgotado olha só as torres que o público vê (D15)", () => {
  // vila-menino-deus: torre lançada em 2026 e, só no banco de testes, a Torre B com lançamento em 2031.
  const VILA = "vila-menino-deus";

  it("torre lançada vendida e torre futura com unidade livre: esgotado, fora da vitrine", async () => {
    await emTransacao(URL_BANCO.admin, async (c) => {
      await c.query(
        `update unidades set status = 'vendida'
         where empreendimento_id = (select id from empreendimentos where slug = $1) and subcondominio_id <> $2`,
        [VILA, FIXTURES.torreFutura],
      );
      expect(await situacao(c, VILA)).toEqual({ esgotado: true, na_vitrine: false });
    });
  });

  it("com o pré-lançamento ativo, a torre futura conta e o empreendimento volta à vitrine", async () => {
    await emTransacao(URL_BANCO.admin, async (c) => {
      await c.query(
        `update unidades set status = 'vendida'
         where empreendimento_id = (select id from empreendimentos where slug = $1) and subcondominio_id <> $2`,
        [VILA, FIXTURES.torreFutura],
      );
      await c.query("update empreendimentos set pre_lancamento_ativo = true where slug = $1", [VILA]);
      expect(await situacao(c, VILA)).toEqual({ esgotado: false, na_vitrine: true });
    });
  });

  it("sem venda, nada muda: o seed continua com o mesmo esgotado", async () => {
    await comCliente(URL_BANCO.admin, async (c) => {
      expect(await situacao(c, VILA)).toEqual({ esgotado: false, na_vitrine: true });
      expect((await situacao(c, CASOS_EXCLUSAO.esgotado))?.esgotado).toBe(true);
    });
  });
});
