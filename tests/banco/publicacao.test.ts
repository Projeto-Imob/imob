import { describe, expect, it } from "vitest";
import { CASOS_EXCLUSAO } from "@/seed/seed";
import { CONTAS, URL_BANCO, comoApp, emTransacao, erroDe } from "./apoio";

const PUBLICAR_SEM_RI = "update empreendimentos set publicacao = 'publicado', curadoria_aprovada = true where slug = $1";
const RESTRICAO_RI = { code: "23514", constraint: "empreendimentos_publicacao_exige_ri" };
const ATUALIZAR = "update empreendimentos set descricao = descricao || ' (editado)' where slug = $1";
const SEM_PERMISSAO = "42501";

describe("R.I. obrigatório para publicar (regra 1)", () => {
  it("recusado para o dono das tabelas (migrator)", async () => {
    expect(await erroDe(emTransacao(URL_BANCO.migrator, (c) => c.query(PUBLICAR_SEM_RI, [CASOS_EXCLUSAO.semRI])))).toEqual(RESTRICAO_RI);
  });

  it("recusado até para o superusuário do banco", async () => {
    expect(await erroDe(emTransacao(URL_BANCO.admin, (c) => c.query(PUBLICAR_SEM_RI, [CASOS_EXCLUSAO.semRI])))).toEqual(RESTRICAO_RI);
  });

  it("recusado para a equipe da plataforma pelo app", async () => {
    expect(
      await erroDe(comoApp({ contaId: CONTAS.equipePlataforma }, (c) => c.query(PUBLICAR_SEM_RI, [CASOS_EXCLUSAO.semRI]))),
    ).toEqual(RESTRICAO_RI);
  });

  it("cartório em branco não conta como R.I.", async () => {
    const erro = await erroDe(
      comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
        c.query(
          `update empreendimentos set ri_numero = 'R.1-1 (exemplo)', ri_cartorio = '   ', ri_data_registro = '2026-01-10',
             publicacao = 'publicado', curadoria_aprovada = true where slug = $1`,
          [CASOS_EXCLUSAO.semRI],
        ),
      ),
    );
    expect(erro).toEqual(RESTRICAO_RI);
  });

  it("com o R.I. completo, a equipe publica", async () => {
    const r = await comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
      c.query(
        `update empreendimentos set ri_numero = 'R.1-999999 (exemplo)', ri_cartorio = 'Registro de Imóveis Exemplo',
           ri_data_registro = '2026-01-10', publicacao = 'publicado', curadoria_aprovada = true where slug = $1`,
        [CASOS_EXCLUSAO.semRI],
      ),
    );
    expect(r.rowCount).toBe(1);
  });
});

describe("quem escreve no catálogo (v1: só a equipe da plataforma)", () => {
  it("god mode lê tudo e não escreve nada (regra 12)", async () => {
    const r = await comoApp({ contaId: CONTAS.godMode }, async (c) => ({
      vistos: (await c.query("select count(*)::int as n from empreendimentos")).rows[0].n,
      edicao: (await c.query(ATUALIZAR, ["vila-menino-deus"])).rowCount,
      publicacao: (await c.query(PUBLICAR_SEM_RI, [CASOS_EXCLUSAO.semRI])).rowCount,
      comissao: (await c.query("update empreendimentos_comercial set comissao_percentual = 1")).rowCount,
    }));
    expect(r).toEqual({ vistos: 11, edicao: 0, publicacao: 0, comissao: 0 });
  });

  it("impersonate é só leitura", async () => {
    const r = await comoApp({ contaId: CONTAS.equipePlataforma, impersonacaoId: CONTAS.horizonteSuperadmin }, (c) =>
      c.query(ATUALIZAR, ["vila-menino-deus"]),
    );
    expect(r.rowCount).toBe(0);
  });

  it("a incorporadora não escreve no catálogo, nem nos próprios empreendimentos", async () => {
    const r = await comoApp({ contaId: CONTAS.valeSuperadmin }, async (c) => ({
      proprio: (await c.query(ATUALIZAR, ["vila-menino-deus"])).rowCount,
      deOutra: (await c.query(ATUALIZAR, ["residencial-jardim-das-aguas"])).rowCount,
    }));
    expect(r).toEqual({ proprio: 0, deOutra: 0 });
  });

  it("comprador e visitante não escrevem no catálogo", async () => {
    expect((await comoApp({ contaId: CONTAS.comprador }, (c) => c.query(ATUALIZAR, ["vila-menino-deus"]))).rowCount).toBe(0);
    expect((await comoApp({}, (c) => c.query(ATUALIZAR, ["vila-menino-deus"]))).rowCount).toBe(0);
  });

  it("a equipe edita e só ela altera a comissão", async () => {
    const atualizar = "update empreendimentos_comercial set comissao_percentual = 6 where empreendimento_id = (select id from empreendimentos where slug = $1)";
    const daIncorporadora = await comoApp({ contaId: CONTAS.horizonteSuperadmin }, (c) => c.query(atualizar, ["residencial-jardim-das-aguas"]));
    const daEquipe = await comoApp({ contaId: CONTAS.equipePlataforma }, (c) => c.query(atualizar, ["residencial-jardim-das-aguas"]));
    const edicaoDaEquipe = await comoApp({ contaId: CONTAS.equipePlataforma }, (c) => c.query(ATUALIZAR, ["vila-menino-deus"]));
    expect([daIncorporadora.rowCount, daEquipe.rowCount, edicaoDaEquipe.rowCount]).toEqual([0, 1, 1]);
  });

  it("só o internal_superadmin ativa o pré-lançamento", async () => {
    const ativar = "update empreendimentos set pre_lancamento_ativo = true where slug = $1";
    const daEquipe = await erroDe(comoApp({ contaId: CONTAS.equipePlataforma }, (c) => c.query(ativar, [CASOS_EXCLUSAO.preLancamento])));
    expect(daEquipe.code).toBe(SEM_PERMISSAO);
    const doSocio = await comoApp({ contaId: CONTAS.superadminPlataforma }, (c) => c.query(ativar, [CASOS_EXCLUSAO.preLancamento]));
    expect(doSocio.rowCount).toBe(1);
  });

  it("o tenant do empreendimento e o empreendimento dos filhos não mudam pelo app", async () => {
    const tenant = await erroDe(
      comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
        c.query("update empreendimentos set tenant_id = (select id from tenants where nome_comercial = 'Vale Claro') where slug = $1", [
          "residencial-jardim-das-aguas",
        ]),
      ),
    );
    expect(tenant.code).toBe(SEM_PERMISSAO);
    const filho = await erroDe(
      comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
        c.query("update planos set empreendimento_id = (select id from empreendimentos where slug = 'vila-menino-deus')"),
      ),
    );
    expect(filho.code).toBe(SEM_PERMISSAO);
  });
});

describe("integridade entre empreendimentos (sem referência cruzada entre tenants)", () => {
  it("unidade não aponta para subcondomínio de outro empreendimento", async () => {
    const erro = await erroDe(
      comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
        c.query(`
          insert into unidades (empreendimento_id, tipologia_id, subcondominio_id, identificador, area_privativa, preco, status)
          select e.id,
                 (select t.id from tipologias t where t.empreendimento_id = e.id limit 1),
                 (select s.id from subcondominios s join empreendimentos o on o.id = s.empreendimento_id where o.slug = 'vila-menino-deus' limit 1),
                 'INTRUSA', 50, 100000, 'vendida'
          from empreendimentos e where e.slug = 'residencial-jardim-das-aguas'`),
      ),
    );
    expect(erro).toEqual({ code: "23503", constraint: "unidades_subcondominio_mesmo_empreendimento" });
  });

  it("vínculo de tipologia não aponta para subcondomínio de outro empreendimento", async () => {
    const erro = await erroDe(
      comoApp({ contaId: CONTAS.equipePlataforma }, (c) =>
        c.query(`
          insert into tipologia_subcondominios (empreendimento_id, tipologia_id, subcondominio_id)
          select e.id,
                 (select t.id from tipologias t where t.empreendimento_id = e.id limit 1),
                 (select s.id from subcondominios s join empreendimentos o on o.id = s.empreendimento_id where o.slug = 'vila-menino-deus' limit 1)
          from empreendimentos e where e.slug = 'residencial-jardim-das-aguas'`),
      ),
    );
    expect(erro).toEqual({ code: "23503", constraint: "tipologia_subcondominios_subcondominio_mesmo_empreendimento" });
  });
});

describe("contas", () => {
  it("existe uma só conta god mode", async () => {
    const erro = await erroDe(
      emTransacao(URL_BANCO.migrator, (c) =>
        c.query("insert into contas (nome, email, papel) values ('Outro', 'outro.god@exemplo.invalid', 'god_mode')"),
      ),
    );
    expect(erro).toEqual({ code: "23505", constraint: "contas_um_god_mode" });
  });

  it("papel de cliente exige tenant; comprador e equipe não têm tenant", async () => {
    const semTenant = await erroDe(
      emTransacao(URL_BANCO.migrator, (c) =>
        c.query("insert into contas (nome, email, papel) values ('Gerente', 'gerente.sem.tenant@exemplo.invalid', 'client_manager')"),
      ),
    );
    expect(semTenant).toEqual({ code: "23514", constraint: "contas_papel_e_tenant" });
    const compradorComTenant = await erroDe(
      emTransacao(URL_BANCO.migrator, (c) =>
        c.query(
          "insert into contas (nome, email, papel, tenant_id) select 'Comprador', 'comprador.tenant@exemplo.invalid', 'buyer', id from tenants limit 1",
        ),
      ),
    );
    expect(compradorComTenant).toEqual({ code: "23514", constraint: "contas_papel_e_tenant" });
  });

  it("o app não cria conta direto no banco (sem GRANT)", async () => {
    const erro = await erroDe(
      comoApp({}, (c) => c.query("insert into contas (nome, email, papel) values ('Intruso', 'intruso@exemplo.invalid', 'buyer')")),
    );
    expect(erro.code).toBe(SEM_PERMISSAO);
  });
});
