/**
 * Acesso ao banco (fatia 0.2; design D4). Só código de servidor importa este módulo (server-only
 * e lista permitida do lint). Toda consulta roda numa transação com o contexto gravado por
 * set_config(…, true), válido só naquela transação: o contexto nunca vaza entre requisições
 * que dividem o pool. exigirContexto() (src/server/contexto.ts) entrega o Contexto que as ações passam ao comContexto().
 */
import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { z } from "zod";
import * as schema from "./schema/index.ts";

export type Contexto = {
  /** Conta logada; nula para visitante. */
  contaId: string | null;
  /** Sessão de impersonate (só leitura, design D4). */
  impersonacaoId?: string | null;
  /** Visitante anônimo (cookie de 90 dias); dono das gravações de comprador sem conta (fatia 1.3b). */
  visitanteId?: string | null;
};

type Banco = NodePgDatabase<typeof schema> & { $client: PoolClient };

/**
 * O banco preso à conexão da transação. Sem `transaction`: um begin aninhado na mesma conexão
 * encerraria a transação de fora antes da hora.
 */
export type Transacao = Omit<Banco, "transaction">;

const idOpcional = z.uuid().nullable();

/** Espera máxima por uma conexão livre; o padrão do pg é esperar para sempre. */
const ESPERA_CONEXAO_MS = 5_000;
const MAXIMO_PADRAO = 10;

function urlDoBanco(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL não definida.");
  // Desenvolvimento: Postgres local (npm run db:start), papel app_user, autenticação local.
  return "postgres://app_user@localhost:5432/imob";
}

function maximoDoPool(): number {
  const max = Number(process.env.DB_POOL_MAX);
  return Number.isInteger(max) && max > 0 ? max : MAXIMO_PADRAO;
}

// Em desenvolvimento, o Next reavalia este módulo a cada edição: o pool fica no globalThis para
// não abrir um pool novo (e conexões novas) a cada recarga.
type Estado = { pool: Pool | null };
const global = globalThis as typeof globalThis & { __imobBanco?: Estado };
const estado: Estado = global.__imobBanco ?? { pool: null };
if (process.env.NODE_ENV !== "production") global.__imobBanco = estado;

/** Um cliente Drizzle por conexão do pool (o pg reaproveita as conexões). */
const bancos = new WeakMap<PoolClient, Banco>();

function obterPool(): Pool {
  if (!estado.pool) {
    const pool = new Pool({
      connectionString: urlDoBanco(),
      max: maximoDoPool(),
      connectionTimeoutMillis: ESPERA_CONEXAO_MS,
    });
    // Conexão ociosa que cai (banco reiniciado, rede) emite "error" no pool; sem ouvinte, o processo cai junto.
    pool.on("error", (erro) => console.error("[banco] conexão ociosa do pool caiu:", erro.message));
    estado.pool = pool;
  }
  return estado.pool;
}

function bancoDa(conexao: PoolClient): Banco {
  let banco = bancos.get(conexao);
  if (!banco) {
    banco = drizzle({ client: conexao, schema });
    bancos.set(conexao, banco);
  }
  return banco;
}

/**
 * Begin, commit e rollback próprios: o begin fica dentro do try (se falhar, a conexão volta ao
 * pool), o erro original sobrevive a um rollback que falha e a conexão quebrada é descartada.
 */
async function emTransacao<T>(
  contexto: Contexto,
  acesso: "leitura e escrita" | "só leitura",
  fn: (tx: Transacao) => Promise<T>,
): Promise<T> {
  const contaId = idOpcional.parse(contexto.contaId);
  const impersonacaoId = idOpcional.parse(contexto.impersonacaoId ?? null);
  const visitanteId = idOpcional.parse(contexto.visitanteId ?? null);
  const conexao = await obterPool().connect();
  let quebrada: Error | undefined;
  try {
    await conexao.query(acesso === "só leitura" ? "begin read only" : "begin");
    await conexao.query(
      "select set_config('app.conta_id', $1, true), set_config('app.impersonacao_id', $2, true), set_config('app.visitante_id', $3, true)",
      [contaId ?? "", impersonacaoId ?? "", visitanteId ?? ""],
    );
    const resultado = await fn(bancoDa(conexao));
    await conexao.query("commit");
    return resultado;
  } catch (erro) {
    try {
      await conexao.query("rollback");
    } catch (erroRollback) {
      quebrada = erroRollback instanceof Error ? erroRollback : new Error(String(erroRollback));
    }
    throw erro;
  } finally {
    conexao.release(quebrada);
  }
}

/** Executa `fn` numa transação com o contexto da conta (e do impersonate, se houver). */
export function comContexto<T>(contexto: Contexto, fn: (tx: Transacao) => Promise<T>): Promise<T> {
  return emTransacao(contexto, "leitura e escrita", fn);
}

/** Consulta de visitante, sem conta e só de leitura: o RLS deixa passar só o que é público da vitrine. */
export function consultaPublica<T>(fn: (tx: Transacao) => Promise<T>): Promise<T> {
  return emTransacao({ contaId: null }, "só leitura", fn);
}

/** Fecha o pool (testes e encerramento do processo). */
export async function encerrarBanco(): Promise<void> {
  const pool = estado.pool;
  estado.pool = null;
  await pool?.end();
}
