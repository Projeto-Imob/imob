/**
 * Contexto da requisição (fatia 1.3b, PR 1). É daqui que toda Server Action e Route Handler tira o
 * Contexto que entrega ao comContexto(). Hoje o contexto é só o do visitante: um UUID aleatório num
 * cookie httpOnly de 90 dias. A sessão da conta chega com o login (PR 3 da 1.3b) e com a 1.4.
 *
 * - exigirContexto(): para Server Action e Route Handler (únicos lugares onde o cookie pode ser gravado).
 *   Cria o cookie do visitante se faltar ou estiver malformado.
 * - lerContexto(): para Server Component; só lê, nunca grava. Sem cookie, visitanteId é nulo.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import type { Contexto } from "./db/index.ts";

export const COOKIE_VISITANTE = "imob_visitante";
/** 90 dias (decisão de 18/11/2026: favoritos sem login passam para a conta na 1.4). */
export const VALIDADE_COOKIE_SEGUNDOS = 90 * 24 * 60 * 60;

const idDoVisitante = z.uuid();

const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** O host sem a porta; "[::1]:3000" vira "[::1]". */
function semPorta(host: string): string {
  return host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]!;
}

/** Secure em todo lugar, menos no localhost (desenvolvimento e e2e em http). Sem host, Secure. */
export function opcoesDoCookie(host: string | null) {
  const local = host !== null && HOSTS_LOCAIS.has(semPorta(host).toLowerCase());
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !local,
    path: "/",
    maxAge: VALIDADE_COOKIE_SEGUNDOS,
  };
}

/** Contexto de quem chama; o visitante sempre existe depois de exigirContexto(). */
export type ContextoExigido = Contexto & { visitanteId: string };

function valido(valor: string | undefined): string | null {
  const r = idDoVisitante.safeParse(valor);
  return r.success ? r.data : null;
}

export async function lerContexto(): Promise<Contexto> {
  const guardado = (await cookies()).get(COOKIE_VISITANTE)?.value;
  return { contaId: null, visitanteId: valido(guardado) };
}

export async function exigirContexto(): Promise<ContextoExigido> {
  const loja = await cookies();
  const existente = valido(loja.get(COOKIE_VISITANTE)?.value);
  if (existente) return { contaId: null, visitanteId: existente };
  const novo = randomUUID();
  loja.set(COOKIE_VISITANTE, novo, opcoesDoCookie((await headers()).get("host")));
  return { contaId: null, visitanteId: novo };
}
