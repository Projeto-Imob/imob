/**
 * Saúde do app para o monitor e o deploy (fatia 0.4): o banco responde e a conexão é do app_user.
 * O worker entra aqui quando existir (adiado para a primeira fatia com tarefa agendada).
 */
import "server-only";
import { sql } from "drizzle-orm";
import { consultaPublica } from "./db";

const PAPEL_DO_APP = "app_user";

export type Saude = { ok: boolean; versao: string; motivo?: "banco_fora" | "papel_errado" };

/** Versão em execução: o commit da imagem (IMOB_VERSAO), ou "local" fora do servidor. */
export function versaoDoApp(): string {
  return process.env.IMOB_VERSAO || "local";
}

export async function verificarSaude(): Promise<Saude> {
  const versao = versaoDoApp();
  let papeis: { sessao: string; atual: string } | undefined;
  try {
    papeis = await consultaPublica(async (tx) => {
      const r = await tx.execute<{ sessao: string; atual: string }>(sql`select session_user::text as sessao, current_user::text as atual`);
      return r.rows[0];
    });
  } catch (erro) {
    console.error("[saude] banco fora:", erro instanceof Error ? erro.message : erro);
    return { ok: false, versao, motivo: "banco_fora" };
  }
  if (papeis?.sessao !== PAPEL_DO_APP || papeis.atual !== PAPEL_DO_APP) {
    console.error(`[saude] conexão como "${papeis?.sessao}", e só pode ser ${PAPEL_DO_APP}.`);
    return { ok: false, versao, motivo: "papel_errado" };
  }
  return { ok: true, versao };
}
