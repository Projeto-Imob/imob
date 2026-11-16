import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { dataLocal, montarCompletos } from "@/dominio/catalogo";
import { baseElegivel } from "@/dominio/elegibilidade";
import { CASOS_EXCLUSAO, gerarSeed } from "@/seed/seed";
import { comContexto, consultaPublica, encerrarBanco, type Transacao } from "@/server/db";
import { CONTAS, FIXTURES, URL_BANCO, comCliente } from "./apoio";

afterAll(() => encerrarBanco());

const slugs = async (tx: Transacao) =>
  (await tx.execute(sql`select slug from empreendimentos order by slug`)).rows.map((r) => String(r.slug));
const contar = async (tx: Transacao, consulta: string) => Number((await tx.execute(sql.raw(consulta))).rows[0]!.n);

const baseTs = () =>
  baseElegivel(montarCompletos(gerarSeed()), { hoje: dataLocal(new Date()) })
    .map((e) => e.empreendimento.slug)
    .sort();

// Em sequência: a transação usa um cliente só, e o pg não aceita consultas simultâneas nele.
const torreFutura = async (tx: Transacao) => [
  await contar(tx, `select count(*) as n from subcondominios where id = '${FIXTURES.torreFutura}'`),
  await contar(tx, `select count(*) as n from tipologias where id = '${FIXTURES.tipologiaDaTorreFutura}'`),
  await contar(tx, `select count(*) as n from unidades where id = '${FIXTURES.unidadeDaTorreFutura}'`),
];

describe("visitante sem contexto", () => {
  it("não lê nenhuma conta nem dado comercial", async () => {
    const r = await consultaPublica(async (tx) => [
      await contar(tx, "select count(*) as n from contas"),
      await contar(tx, "select count(*) as n from empreendimentos_comercial"),
    ]);
    expect(r).toEqual([0, 0]);
  });

  it("vê exatamente a base elegível, igual à regra em TypeScript", async () => {
    const vistos = await consultaPublica(slugs);
    expect(vistos).toHaveLength(6);
    expect(vistos).toEqual(baseTs());
    for (const excluido of Object.values(CASOS_EXCLUSAO)) expect(vistos).not.toContain(excluido);
  });

  it("não vê torre com lançamento futuro, nem a tipologia e as unidades dela (regra 11, D15)", async () => {
    expect(await consultaPublica(torreFutura)).toEqual([0, 0, 0]);
    expect(await comContexto({ contaId: CONTAS.equipePlataforma }, torreFutura)).toEqual([1, 1, 1]);
  });

  it("vê subcondomínios, unidades e planos só dos empreendimentos públicos", async () => {
    const fora = await consultaPublica((tx) =>
      contar(
        tx,
        `select count(*) as n from (
           select empreendimento_id from subcondominios union all
           select empreendimento_id from unidades union all
           select empreendimento_id from planos union all
           select empreendimento_id from tipologia_subcondominios
         ) x where x.empreendimento_id not in (select id from empreendimentos)`,
      ),
    );
    expect(fora).toBe(0);
  });

  it("vê o nome só das incorporadoras com empreendimento na vitrine", async () => {
    const ids = await consultaPublica(async (tx) => (await tx.execute(sql`select id from tenants`)).rows.map((r) => String(r.id)));
    expect(ids.sort()).toEqual(gerarSeed().incorporadoras.map((i) => i.id).sort());
    expect(ids).not.toContain(FIXTURES.tenantSemVitrine);
  });
});

describe("com contexto", () => {
  it("comprador logado também abre o não listado e nunca lê comissão", async () => {
    const r = await comContexto({ contaId: CONTAS.comprador }, async (tx) => ({
      slugs: await slugs(tx),
      comissoes: await contar(tx, "select count(*) as n from empreendimentos_comercial"),
    }));
    expect(r.slugs).toContain(CASOS_EXCLUSAO.naoListado);
    expect(r.slugs).toHaveLength(7);
    expect(r.comissoes).toBe(0);
  });

  it("conta desativada é tratada como visitante: não abre o não listado", async () => {
    const vistos = await comContexto({ contaId: CONTAS.compradorInativo }, slugs);
    expect(vistos).not.toContain(CASOS_EXCLUSAO.naoListado);
    expect(vistos).toHaveLength(6);
  });

  it("house, equipe e god mode não leem contas de comprador; o comprador lê a própria", async () => {
    const compradoresVistos = (contaId: string) =>
      comContexto({ contaId }, (tx) => contar(tx, "select count(*) as n from contas where papel = 'buyer'"));
    expect(await compradoresVistos(CONTAS.houseAnalista)).toBe(0);
    expect(await compradoresVistos(CONTAS.equipePlataforma)).toBe(0);
    expect(await compradoresVistos(CONTAS.godMode)).toBe(0);
    expect(await compradoresVistos(CONTAS.comprador)).toBe(1);
    expect(await comContexto({ contaId: CONTAS.equipePlataforma }, (tx) => contar(tx, "select count(*) as n from contas"))).toBeGreaterThan(3);
  });

  it("incorporadora vê os próprios rascunho e exclusivo, e não os de outra", async () => {
    const horizonte = await comContexto({ contaId: CONTAS.horizonteSuperadmin }, slugs);
    expect(horizonte).toContain(CASOS_EXCLUSAO.semRI);
    expect(horizonte).toContain(CASOS_EXCLUSAO.exclusivo);
    const vale = await comContexto({ contaId: CONTAS.valeSuperadmin }, slugs);
    expect(vale).not.toContain(CASOS_EXCLUSAO.semRI);
    expect(vale).not.toContain(CASOS_EXCLUSAO.exclusivo);
  });

  it("incorporadora lê só a própria comissão", async () => {
    const tenantsDasComissoes = await comContexto({ contaId: CONTAS.horizonteSuperadmin }, async (tx) =>
      (await tx.execute(sql`
        select distinct e.tenant_id from empreendimentos_comercial c
        join empreendimentos e on e.id = c.empreendimento_id`)).rows.map((r) => String(r.tenant_id)),
    );
    expect(tenantsDasComissoes).toEqual([gerarSeed().incorporadoras[0]!.id]);
  });

  it("house lê todos os empreendimentos, inclusive rascunho e exclusivo", async () => {
    expect(await comContexto({ contaId: CONTAS.houseAnalista }, slugs)).toHaveLength(11);
  });

  it("set_config(…, true) vale só dentro da transação, numa conexão crua", async () => {
    const depois = await comCliente(URL_BANCO.app, async (c) => {
      await c.query("begin");
      await c.query("select set_config('app.conta_id', $1, true)", [CONTAS.horizonteSuperadmin]);
      await c.query("commit");
      return (await c.query("select coalesce(current_setting('app.conta_id', true), '') as v")).rows[0].v;
    });
    expect(depois).toBe("");
  });

  it("duas contas ao mesmo tempo no mesmo pool não se misturam", async () => {
    const rodada = (contaId: string) =>
      comContexto({ contaId }, async (tx) => {
        await tx.execute(sql`select pg_sleep(0.05)`);
        return { contaId, slugs: await slugs(tx) };
      });
    const resultados = await Promise.all(
      Array.from({ length: 10 }, (_, i) => rodada(i % 2 === 0 ? CONTAS.horizonteSuperadmin : CONTAS.valeSuperadmin)),
    );
    for (const r of resultados) {
      expect(r.slugs.includes(CASOS_EXCLUSAO.semRI)).toBe(r.contaId === CONTAS.horizonteSuperadmin);
    }
  });

  it("recusa id de conta fora do formato", async () => {
    await expect(comContexto({ contaId: "1; drop table contas" }, slugs)).rejects.toThrow();
  });
});
