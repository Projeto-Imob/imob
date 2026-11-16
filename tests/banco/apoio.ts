import pg from "pg";
import { urlDoPapel } from "../../scripts/db/config";
import { uid } from "@/seed/seed";

export const URL_BANCO = {
  admin: urlDoPapel("admin", "teste"),
  migrator: urlDoPapel("migrator", "teste"),
  app: urlDoPapel("app_user", "teste"),
};

/** Contas do seed e contas criadas só para os testes (tests/banco/preparar.ts). */
export const CONTAS = {
  houseAnalista: uid(2, 1),
  horizonteSuperadmin: uid(2, 10),
  horizonteGerente: uid(2, 11),
  valeSuperadmin: uid(2, 20),
  comprador: uid(2, 100),
  equipePlataforma: "00000000-0000-4000-8009-000000000001",
  godMode: "00000000-0000-4000-8009-000000000002",
  superadminPlataforma: "00000000-0000-4000-8009-000000000003",
  compradorInativo: "00000000-0000-4000-8009-000000000004",
} as const;

/** Registros que só existem no banco de testes. */
export const FIXTURES = {
  tenantSemVitrine: "00000000-0000-4000-8009-000000000010",
  /** Segunda torre de vila-menino-deus, com lançamento em 2031 (pré-lançamento desligado). */
  torreFutura: "00000000-0000-4000-8009-000000000101",
  tipologiaDaTorreFutura: "00000000-0000-4000-8009-000000000102",
  unidadeDaTorreFutura: "00000000-0000-4000-8009-000000000103",
} as const;

export async function comCliente<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** Executa numa transação que sempre é desfeita no fim. */
export function emTransacao<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  return comCliente(url, async (c) => {
    await c.query("begin");
    try {
      return await fn(c);
    } finally {
      await c.query("rollback");
    }
  });
}

/** Executa como app_user, com o contexto gravado só na transação, e desfaz tudo no fim. */
export function comoApp<T>(
  contexto: { contaId?: string | null; impersonacaoId?: string | null },
  fn: (c: pg.Client) => Promise<T>,
): Promise<T> {
  return emTransacao(URL_BANCO.app, async (c) => {
    await c.query("select set_config('app.conta_id', $1, true), set_config('app.impersonacao_id', $2, true)", [
      contexto.contaId ?? "",
      contexto.impersonacaoId ?? "",
    ]);
    return fn(c);
  });
}

/** Captura o erro do Postgres (código e restrição) de uma operação que deveria falhar. */
export async function erroDe(operacao: Promise<unknown>): Promise<{ code?: string; constraint?: string }> {
  try {
    await operacao;
  } catch (erro) {
    const e = erro as { code?: string; constraint?: string };
    return { code: e.code, constraint: e.constraint };
  }
  throw new Error("A operação deveria ter falhado.");
}
