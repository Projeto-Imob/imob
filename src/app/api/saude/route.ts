/**
 * GET /api/saude (fatia 0.4): monitor de disponibilidade, healthcheck do contêiner e conferência do deploy.
 * Não lê dado de conta nem de tenant, por isso não passa por exigirContexto(). Responde só o estado e a
 * versão (o commit, que é público); o motivo de uma falha vai para o log do servidor.
 */
import { connection } from "next/server";
import { verificarSaude } from "@/server/saude";

export async function GET() {
  // Sempre na hora da requisição: nada de pré-renderizar a saúde no build.
  await connection();
  const saude = await verificarSaude();
  return Response.json(
    { status: saude.ok ? "ok" : "falha", versao: saude.versao },
    { status: saude.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
