import { describe, expect, it } from "vitest";
import { TERMOS_PROIBIDOS } from "../../scripts/termos-proibidos";
import { URL_BANCO, comCliente } from "./apoio";

const consultar = <T>(sql: string) => comCliente(URL_BANCO.admin, async (c) => (await c.query(sql)).rows as T[]);

describe("catálogo do banco (fatia 0.2)", () => {
  it("RLS ligado em toda tabela do schema public", async () => {
    const semRls = await consultar<{ relname: string }>(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1`);
    expect(semRls).toEqual([]);
  });

  it("índice em todo tenant_id", async () => {
    const tabelas = await consultar<{ tabela: string; indexada: boolean }>(`
      select c.relname as tabela,
             exists (select 1 from pg_index i where i.indrelid = a.attrelid and i.indkey[0] = a.attnum) as indexada
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and a.attname = 'tenant_id' and not a.attisdropped`);
    expect(tabelas.length).toBeGreaterThanOrEqual(2);
    expect(tabelas.filter((t) => !t.indexada)).toEqual([]);
  });

  it("funções do schema app são security definer com search_path fixo e vazio", async () => {
    const funcoes = await consultar<{ proname: string; prosecdef: boolean; proconfig: string[] | null }>(`
      select p.proname, p.prosecdef, p.proconfig from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app'`);
    expect(funcoes.length).toBeGreaterThanOrEqual(10);
    for (const f of funcoes) {
      expect(f.prosecdef, f.proname).toBe(true);
      expect(f.proconfig ?? [], f.proname).toContain('search_path=""');
    }
  });

  it("nenhuma função do schema app é executável por PUBLIC", async () => {
    const abertas = await consultar<{ proname: string }>(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'app'
        and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                    where a.grantee = 0 and a.privilege_type = 'EXECUTE')`);
    expect(abertas).toEqual([]);
  });

  it("função criada depois pelo migrator não nasce executável por PUBLIC", async () => {
    const abertaParaTodos = await comCliente(URL_BANCO.migrator, async (c) => {
      await c.query("begin");
      try {
        await c.query("create function app.funcao_nova_de_teste() returns int language sql as 'select 1'");
        const r = await c.query(`
          select exists (select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                         where p.proname = 'funcao_nova_de_teste' and a.grantee = 0 and a.privilege_type = 'EXECUTE') as aberta`);
        return r.rows[0].aberta as boolean;
      } finally {
        await c.query("rollback");
      }
    });
    expect(abertaParaTodos).toBe(false);
  });

  it("papéis da aplicação não são superusuários, não ignoram RLS e não são donos de tabela", async () => {
    const papeis = await consultar<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean }>(`
      select rolname, rolsuper, rolbypassrls from pg_roles
      where rolname in ('app_user', 'auth_service', 'worker', 'migrator') order by rolname`);
    expect(papeis.map((p) => p.rolname)).toEqual(["app_user", "auth_service", "migrator", "worker"]);
    expect(papeis.every((p) => !p.rolsuper && !p.rolbypassrls)).toBe(true);
    const donos = await consultar<{ relname: string }>(`
      select c.relname from pg_class c join pg_roles r on r.oid = c.relowner
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and r.rolname in ('app_user', 'auth_service', 'worker')`);
    expect(donos).toEqual([]);
  });

  it("nenhum termo proibido em tabelas, colunas e tipos (regra 19)", async () => {
    const nomes = await consultar<{ nome: string }>(`
      select c.relname as nome from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public', 'app')
      union select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'
      union select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public'
      union select e.enumlabel from pg_enum e`);
    const achados = nomes.filter((n) => TERMOS_PROIBIDOS.some((t) => t.padrao.test(n.nome)));
    expect(achados).toEqual([]);
  });
});
