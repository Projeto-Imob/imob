// Confere, antes de o contêiner do app subir, que a DATABASE_URL conecta como app_user (fatia 0.4).
// O RLS só protege os dados se o app nunca rodar como migrator nem como superusuário.
// Uso: node scripts/conferir-papel.ts   (sai com código 1 se a conexão falhar ou o papel não bater)
import { pathToFileURL } from "node:url";
import pg from "pg";

export const PAPEL_DO_APP = "app_user";

/** Papel da sessão aberta com a URL (session_user) e o papel em vigor nela (current_user). */
export async function papeisDaConexao(url: string): Promise<{ sessao: string; atual: string }> {
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
  await c.connect();
  try {
    const r = await c.query<{ sessao: string; atual: string }>("select session_user::text as sessao, current_user::text as atual");
    return r.rows[0] ?? { sessao: "", atual: "" };
  } finally {
    await c.end();
  }
}

/** Mensagem de erro, ou null quando a conexão é do app_user. */
export async function conferirPapel(url: string | undefined): Promise<string | null> {
  if (!url) return "DATABASE_URL não definida.";
  let papeis: { sessao: string; atual: string };
  try {
    papeis = await papeisDaConexao(url);
  } catch (erro) {
    return `não conectou ao banco: ${erro instanceof Error ? erro.message : String(erro)}`;
  }
  if (papeis.sessao !== PAPEL_DO_APP || papeis.atual !== PAPEL_DO_APP) {
    return `o app conectou como "${papeis.sessao}" (em vigor: "${papeis.atual}"), e só pode conectar como ${PAPEL_DO_APP}.`;
  }
  return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const erro = await conferirPapel(process.env.DATABASE_URL);
  if (erro) {
    console.error(`[conferir-papel] ${erro}`);
    process.exit(1);
  }
  console.log(`[conferir-papel] conexão com o banco como ${PAPEL_DO_APP}.`);
}
