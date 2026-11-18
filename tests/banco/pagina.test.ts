import { describe, expect, it } from "vitest";
import { CASOS_EXCLUSAO, gerarSeed } from "@/seed/seed";
import { CONTAS, URL_BANCO, comCliente, comoApp, emTransacao, erroDe } from "./apoio";

// Migrations da fatia 1.1: pontos_proximos e escritorios_vendas (leitura como a do empreendimento, escrita só da equipe).

const seed = gerarSeed();
const ELEGIVEL = "residencial-jardim-das-aguas";
const SEM_CARTAO = "studio-cidade-baixa";

describe("pontos_proximos e escritorios_vendas: leitura", () => {
  it("o visitante lê os pontos e o cartão de um empreendimento da vitrine", async () => {
    const r = await comoApp({}, async (c) => ({
      pontos: (await c.query("select p.categoria, p.nome, p.distancia_m from pontos_proximos p join empreendimentos e on e.id = p.empreendimento_id where e.slug = $1", [ELEGIVEL])).rows,
      cartao: (await c.query("select o.nome, o.cargo, o.whatsapp from escritorios_vendas o join empreendimentos e on e.id = o.empreendimento_id where e.slug = $1", [ELEGIVEL])).rows,
    }));
    expect(r.pontos).toHaveLength(6);
    expect(r.cartao).toEqual([{ nome: "Helena Exemplo", cargo: "Gerente de contas", whatsapp: "+5551900000003" }]);
  });

  it("o visitante não lê pontos nem cartão de empreendimento fora da vitrine", async () => {
    const slugs = Object.values(CASOS_EXCLUSAO);
    const r = await comoApp({}, async (c) => ({
      pontos: (await c.query("select 1 from pontos_proximos p join empreendimentos e on e.id = p.empreendimento_id where e.slug = any($1)", [slugs])).rowCount,
      cartao: (await c.query("select 1 from escritorios_vendas o join empreendimentos e on e.id = o.empreendimento_id where e.slug = any($1)", [slugs])).rowCount,
    }));
    expect(r).toEqual({ pontos: 0, cartao: 0 });
  });

  it("o Studio Cidade Baixa tem pontos e não tem cartão", async () => {
    const r = await comoApp({}, async (c) => ({
      pontos: (await c.query("select 1 from pontos_proximos p join empreendimentos e on e.id = p.empreendimento_id where e.slug = $1", [SEM_CARTAO])).rowCount,
      cartao: (await c.query("select 1 from escritorios_vendas o join empreendimentos e on e.id = o.empreendimento_id where e.slug = $1", [SEM_CARTAO])).rowCount,
    }));
    expect(r).toEqual({ pontos: 6, cartao: 0 });
  });

  it("a equipe da plataforma lê tudo, inclusive os casos de exclusão", async () => {
    const total = await comoApp({ contaId: CONTAS.houseAnalista }, async (c) => (await c.query("select 1 from pontos_proximos")).rowCount);
    expect(total).toBe(seed.empreendimentos.length * 6);
  });
});

describe("pontos_proximos e escritorios_vendas: escrita", () => {
  const empreendimentoId = seed.empreendimentos.find((e) => e.slug === ELEGIVEL)!.id;
  const novoPonto = `insert into pontos_proximos (empreendimento_id, categoria, nome, distancia_m) values ('${empreendimentoId}', 'escola', 'Escola Nova', 100)`;

  it("visitante, comprador e incorporadora não escrevem", async () => {
    for (const contaId of [undefined, CONTAS.comprador, CONTAS.horizonteSuperadmin]) {
      const e1 = await comoApp({ contaId }, (c) => erroDe(c.query(novoPonto)));
      expect(e1.code, `insert ${contaId}`).toBeDefined();
      const e2 = await comoApp({ contaId }, async (c) => {
        const r = await c.query("update escritorios_vendas set nome = 'Outro' where empreendimento_id = $1", [empreendimentoId]);
        return r.rowCount;
      }).catch(() => 0);
      expect(e2, `update ${contaId}`).toBe(0);
      const e3 = await comoApp({ contaId }, async (c) => (await c.query("delete from pontos_proximos where empreendimento_id = $1", [empreendimentoId])).rowCount).catch(() => 0);
      expect(e3, `delete ${contaId}`).toBe(0);
    }
  });

  it("a equipe da plataforma escreve", async () => {
    const r = await comoApp({ contaId: CONTAS.equipePlataforma }, async (c) => {
      await c.query(novoPonto);
      return (await c.query("update escritorios_vendas set cargo = 'Gerente' where empreendimento_id = $1", [empreendimentoId])).rowCount;
    });
    expect(r).toBe(1);
  });

  it("a categoria e a distância são validadas", async () => {
    const categoria = await emTransacao(URL_BANCO.migrator, (c) => erroDe(c.query(`insert into pontos_proximos (empreendimento_id, categoria, nome, distancia_m) values ('${empreendimentoId}', 'cassino', 'X', 1)`)));
    expect(categoria.code).toBe("22P02");
    const distancia = await emTransacao(URL_BANCO.migrator, (c) => erroDe(c.query(`insert into pontos_proximos (empreendimento_id, categoria, nome, distancia_m) values ('${empreendimentoId}', 'escola', 'X', -1)`)));
    expect(distancia.constraint).toBe("pontos_proximos_distancia");
  });

  it("não repete categoria e nome no mesmo empreendimento", async () => {
    const e = await emTransacao(URL_BANCO.migrator, (c) =>
      erroDe(c.query(`insert into pontos_proximos (empreendimento_id, categoria, nome, distancia_m) select empreendimento_id, categoria, nome, 1 from pontos_proximos limit 1`)),
    );
    expect(e.constraint).toBe("pontos_proximos_unico");
  });

  it("um só cartão por empreendimento", async () => {
    const e = await emTransacao(URL_BANCO.migrator, (c) =>
      erroDe(c.query(`insert into escritorios_vendas (empreendimento_id, nome) values ('${empreendimentoId}', 'Segundo')`)),
    );
    expect(e.code).toBe("23505");
  });

  it("o app não muda o empreendimento do cartão nem do ponto (UPDATE coluna a coluna)", async () => {
    const privilegios = await comCliente(URL_BANCO.admin, async (c) =>
      (
        await c.query<{ pontos: boolean; cartao: boolean; nome: boolean }>(`
          select has_column_privilege('app_user', 'pontos_proximos', 'empreendimento_id', 'update') as pontos,
                 has_column_privilege('app_user', 'escritorios_vendas', 'empreendimento_id', 'update') as cartao,
                 has_column_privilege('app_user', 'escritorios_vendas', 'nome', 'update') as nome`)
      ).rows[0],
    );
    expect(privilegios).toEqual({ pontos: false, cartao: false, nome: true });
  });

  it("as duas tabelas têm RLS ligado", async () => {
    const r = await comCliente(URL_BANCO.admin, async (c) =>
      (await c.query<{ relname: string; relrowsecurity: boolean }>("select relname, relrowsecurity from pg_class where relname in ('pontos_proximos', 'escritorios_vendas')")).rows,
    );
    expect(r).toHaveLength(2);
    expect(r.every((t) => t.relrowsecurity)).toBe(true);
  });
});
