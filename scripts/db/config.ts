// Endereços do banco para scripts e testes (fatia 0.2).
// Em produção tudo vem do ambiente. Os padrões locais (Postgres nativo em localhost, com
// autenticação local sem senha e só dados fictícios) valem apenas fora de produção.

export type Alvo = "dev" | "teste";
export const PAPEIS_BANCO = ["migrator", "app_user", "auth_service", "worker"] as const;
export type PapelBanco = (typeof PAPEIS_BANCO)[number];

const ADMIN_LOCAL = "postgres://postgres@localhost:5432/postgres";

/** Superusuário: só prepara papéis e bancos e roda os testes de banco. */
export function urlAdmin(): string {
  const url = process.env.DATABASE_URL_ADMIN;
  if (url) return url;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL_ADMIN não definida.");
  return ADMIN_LOCAL;
}

export function nomeDoBanco(alvo: Alvo): string {
  return alvo === "teste" ? (process.env.DB_NOME_TESTE ?? "imob_teste") : (process.env.DB_NOME ?? "imob");
}

export function senhaDoPapel(papel: PapelBanco): string | null {
  const valor = process.env[`DB_SENHA_${papel.toUpperCase()}`];
  return valor ? valor : null;
}

/** URL de um papel no banco do alvo, no mesmo servidor da URL de administração. */
export function urlDoPapel(papel: PapelBanco | "admin", alvo: Alvo): string {
  const u = new URL(urlAdmin());
  u.pathname = `/${nomeDoBanco(alvo)}`;
  if (papel !== "admin") {
    u.username = papel;
    u.password = senhaDoPapel(papel) ?? "";
  }
  return u.toString();
}

export function ehLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** Para mostrar no terminal: servidor e banco, nunca usuário nem senha. */
export function descrever(url: string): string {
  const u = new URL(url);
  return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
}
