import type pg from "pg";
import { describe, expect, it } from "vitest";
import { elegivel, montarCompletos, subcondominioVisivel, type EmpreendimentoCompleto } from "@/modulos/catalogo";
import { CASOS_BUSCA, CASOS_EXCLUSAO, gerarSeed } from "@/seed/seed";
import { URL_BANCO, emTransacao } from "./apoio";

// Paridade TS x SQL (fatia 0.5a, A1): as funções de src/modulos/catalogo/elegibilidade.ts copiam app.em_stand_by,
// app.esgotado e a política subcondominios_leitura. O banco é a fonte; aqui se prova que o TypeScript concorda,
// no seed e em cenários aplicados numa transação desfeita no fim, sempre com o "hoje" de app.hoje().

const VILA = "vila-menino-deus";
const MIRANTE = "edificio-mirante-petropolis";
const TRES_FIGUEIRAS = CASOS_EXCLUSAO.preLancamento;

const idDe = (slug: string) => `(select id from empreendimentos where slug = '${slug}')`;
const tudoVendido = (slug: string) => `update unidades set status = 'vendida' where empreendimento_id = ${idDe(slug)}`;

/** Cada cenário é um conjunto de comandos SQL aplicados como administrador. */
const CENARIOS: Array<{ nome: string; sql: string[] }> = [
  { nome: "seed, sem alteração", sql: [] },
  {
    nome: "torre lançada vendida, com torre futura livre",
    sql: [`update unidades set status = 'vendida' where empreendimento_id = ${idDe(VILA)} and subcondominio_id <> '${CASOS_BUSCA.torreFutura}'`],
  },
  {
    nome: "pré-lançamento ligado com a torre lançada vendida",
    sql: [
      `update unidades set status = 'vendida' where empreendimento_id = ${idDe(VILA)} and subcondominio_id <> '${CASOS_BUSCA.torreFutura}'`,
      `update empreendimentos set pre_lancamento_ativo = true where slug = '${VILA}'`,
    ],
  },
  {
    nome: "pré-lançamento ligado com tudo vendido",
    sql: [tudoVendido(TRES_FIGUEIRAS), `update empreendimentos set pre_lancamento_ativo = true where slug = '${TRES_FIGUEIRAS}'`],
  },
  {
    nome: "pré-lançamento ligado, sem venda",
    sql: [`update empreendimentos set pre_lancamento_ativo = true where slug = '${TRES_FIGUEIRAS}'`],
  },
  {
    nome: "lançamento hoje",
    sql: [
      `update subcondominios set data_lancamento = app.hoje() where id = '${CASOS_BUSCA.torreFutura}'`,
      `update subcondominios set data_lancamento = app.hoje() where empreendimento_id = ${idDe(TRES_FIGUEIRAS)} and data_lancamento is not null`,
    ],
  },
  {
    nome: "lançamento amanhã",
    sql: [
      `update subcondominios set data_lancamento = app.hoje() + 1 where empreendimento_id = ${idDe(MIRANTE)} and data_lancamento is not null`,
      `update subcondominios set data_lancamento = app.hoje() + 1 where empreendimento_id = ${idDe(TRES_FIGUEIRAS)} and data_lancamento is not null`,
    ],
  },
  {
    nome: "torre sem data é a única do empreendimento",
    sql: [`update subcondominios set data_lancamento = null where empreendimento_id = ${idDe(MIRANTE)}`],
  },
  {
    nome: "torre vendida_100 por status, com torre sem data livre",
    sql: [`update subcondominios set status = 'vendido_100' where empreendimento_id = ${idDe(MIRANTE)} and data_lancamento is not null`],
  },
];

type LinhaEmp = { id: string; pre: boolean; publicacao: string; curadoria: boolean; ri: boolean; visibilidade: string };
type LinhaSub = { id: string; emp: string; status: string; lancamento: string | null };
type LinhaUni = { id: string; status: string };

/** Lê o estado do banco como administrador e o aplica sobre o seed, para o TypeScript calcular com os mesmos dados. */
async function lerComoTypeScript(c: pg.Client): Promise<EmpreendimentoCompleto[]> {
  const emps = (
    await c.query<LinhaEmp>(
      `select id, pre_lancamento_ativo as pre, publicacao, curadoria_aprovada as curadoria,
              ri_numero is not null as ri, visibilidade from empreendimentos`,
    )
  ).rows;
  const subs = (
    await c.query<LinhaSub>(
      "select id, empreendimento_id as emp, status, data_lancamento::text as lancamento from subcondominios",
    )
  ).rows;
  const unis = (await c.query<LinhaUni>("select id, status from unidades")).rows;
  const seed = gerarSeed();
  for (const e of seed.empreendimentos) {
    const l = emps.find((x) => x.id === e.id)!;
    e.preLancamentoAtivo = l.pre;
    e.curadoriaAprovada = l.curadoria;
    e.publicacao = l.publicacao as typeof e.publicacao;
    e.visibilidade = l.visibilidade as typeof e.visibilidade;
    if (!l.ri) e.ri = null;
  }
  for (const s of seed.subcondominios) {
    const l = subs.find((x) => x.id === s.id)!;
    s.status = l.status as typeof s.status;
    s.dataLancamento = l.lancamento;
  }
  for (const u of seed.unidades) u.status = unis.find((x) => x.id === u.id)!.status as typeof u.status;
  return montarCompletos(seed);
}

const ids = (linhas: Array<{ id: string }>) => linhas.map((l) => l.id).sort();

describe("paridade TS x SQL da elegibilidade e da visibilidade das torres", () => {
  it("o seed cobre os casos: torre futura e torres sem data fora da vitrine", () => {
    const sem = gerarSeed().subcondominios.filter((s) => s.dataLancamento === null);
    expect(sem.map((s) => s.id).sort()).toEqual([CASOS_BUSCA.torreSemDataMirante, CASOS_BUSCA.torreSemDataTresFigueiras].sort());
  });

  it.each(CENARIOS)("$nome", async ({ sql }) => {
    await emTransacao(URL_BANCO.admin, async (c) => {
      for (const comando of sql) await c.query(comando);
      const hoje = (await c.query<{ hoje: string }>("select app.hoje()::text as hoje")).rows[0]!.hoje;
      const todos = await lerComoTypeScript(c);
      const ctx = { hoje };

      // 1. elegivel (TS) = app.na_vitrine (SQL), empreendimento a empreendimento.
      const vitrine = (await c.query<{ id: string; v: boolean }>("select id, app.na_vitrine(id) as v from empreendimentos")).rows;
      expect(vitrine).toHaveLength(todos.length);
      for (const e of todos) {
        expect(elegivel(e, ctx), `${e.empreendimento.slug} em ${hoje}`).toBe(vitrine.find((v) => v.id === e.empreendimento.id)!.v);
      }

      // 2. O que o visitante lê pelo RLS = torres visíveis e unidades delas nos empreendimentos elegíveis.
      await c.query("set local role app_user");
      await c.query("select set_config('app.conta_id', '', true), set_config('app.impersonacao_id', '', true)");
      const subsRls = (await c.query<{ id: string }>("select id from subcondominios")).rows;
      const unisRls = (await c.query<{ id: string }>("select id from unidades")).rows;
      const empsRls = (await c.query<{ id: string }>("select id from empreendimentos")).rows;
      await c.query("reset role");

      const elegiveis = todos.filter((e) => elegivel(e, ctx));
      const subsTs = elegiveis.flatMap((e) => e.subcondominios.filter((s) => subcondominioVisivel(s, e, hoje)));
      const idsSubsTs = new Set(subsTs.map((s) => s.id));
      const unisTs = elegiveis.flatMap((e) => e.unidades.filter((u) => idsSubsTs.has(u.subcondominioId)));

      expect(ids(empsRls)).toEqual(elegiveis.map((e) => e.empreendimento.id).sort());
      expect(ids(subsRls)).toEqual(ids(subsTs));
      expect(ids(unisRls)).toEqual(ids(unisTs));
    });
  });
});
