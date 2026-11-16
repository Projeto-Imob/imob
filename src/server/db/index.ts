/**
 * Acesso ao banco (fatia 0.2; design D4). Só código de servidor importa este módulo (server-only
 * e regra de lint). Toda consulta roda numa transação com o contexto gravado por
 * set_config(…, true), válido só naquela transação: o contexto nunca vaza entre requisições
 * que dividem o pool. A partir da fatia 1.4, exigirContexto() é quem chama comContexto().
 */
import "server-only";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "./schema/index.ts";

export type Contexto = {
  /** Conta logada; nula para visitante. */
  contaId: string | null;
  /** Sessão de impersonate (só leitura, design D4). */
  impersonacaoId?: string | null;
};

type Banco = NodePgDatabase<typeof schema>;
export type Transacao = Parameters<Parameters<Banco["transaction"]>[0]>[0];

const idOpcional = z.uuid().nullable();

function urlDoBanco(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL não definida.");
  // Desenvolvimento: Postgres local (npm run db:start), papel app_user, autenticação local.
  return "postgres://app_user@localhost:5432/imob";
}

let pool: Pool | null = null;
let banco: Banco | null = null;

function obterBanco(): Banco {
  if (!banco) {
    pool = new Pool({ connectionString: urlDoBanco(), max: Number(process.env.DB_POOL_MAX ?? 10) });
    banco = drizzle({ client: pool, schema });
  }
  return banco;
}

/** Executa `fn` numa transação com o contexto da conta (e do impersonate, se houver). */
export async function comContexto<T>(contexto: Contexto, fn: (tx: Transacao) => Promise<T>): Promise<T> {
  const contaId = idOpcional.parse(contexto.contaId);
  const impersonacaoId = idOpcional.parse(contexto.impersonacaoId ?? null);
  return obterBanco().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.conta_id', ${contaId ?? ""}, true), set_config('app.impersonacao_id', ${impersonacaoId ?? ""}, true)`,
    );
    return fn(tx);
  });
}

/** Consulta de visitante, sem conta: o RLS deixa passar só o que é público da vitrine. */
export function consultaPublica<T>(fn: (tx: Transacao) => Promise<T>): Promise<T> {
  return comContexto({ contaId: null }, fn);
}

/** Fecha o pool (testes e encerramento do processo). */
export async function encerrarBanco(): Promise<void> {
  await pool?.end();
  pool = null;
  banco = null;
}
