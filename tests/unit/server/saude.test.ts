import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Banco falso: a saúde só depende do que a consulta pública devolve (ou do erro dela).
const falso = vi.hoisted(() => ({ resultado: undefined as unknown, erro: undefined as Error | undefined }));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
// Mesmo arquivo que o "./db" importado por src/server/saude.ts.
vi.mock("@/server/db", () => ({
  consultaPublica: async (fn: (tx: unknown) => Promise<unknown>) => {
    if (falso.erro) throw falso.erro;
    return fn({ execute: async () => ({ rows: [falso.resultado] }) });
  },
}));

const { verificarSaude, versaoDoApp } = await import("@/server/saude");
const { GET } = await import("@/app/api/saude/route");

beforeEach(() => {
  falso.resultado = { sessao: "app_user", atual: "app_user" };
  falso.erro = undefined;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("IMOB_VERSAO", "");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("verificarSaude", () => {
  it("fica ok com a conexão do app_user", async () => {
    await expect(verificarSaude()).resolves.toEqual({ ok: true, versao: "local" });
  });

  it("falha quando a conexão é de outro papel (ex.: migrator)", async () => {
    falso.resultado = { sessao: "migrator", atual: "migrator" };
    await expect(verificarSaude()).resolves.toEqual({ ok: false, versao: "local", motivo: "papel_errado" });
  });

  it("falha quando o papel em vigor não é o da sessão", async () => {
    falso.resultado = { sessao: "app_user", atual: "postgres" };
    await expect(verificarSaude()).resolves.toMatchObject({ ok: false, motivo: "papel_errado" });
  });

  it("falha, sem lançar, quando o banco não responde", async () => {
    falso.erro = new Error("ECONNREFUSED");
    await expect(verificarSaude()).resolves.toMatchObject({ ok: false, motivo: "banco_fora" });
  });

  it("informa a versão da imagem (o commit)", async () => {
    vi.stubEnv("IMOB_VERSAO", "a".repeat(40));
    expect(versaoDoApp()).toBe("a".repeat(40));
  });
});

describe("GET /api/saude", () => {
  it("responde 200, sem cache, só com o estado e a versão", async () => {
    vi.stubEnv("IMOB_VERSAO", "abc123");
    const resposta = await GET();
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("cache-control")).toBe("no-store");
    expect(await resposta.json()).toEqual({ status: "ok", versao: "abc123" });
  });

  it("responde 503 sem dizer o motivo da falha", async () => {
    falso.resultado = { sessao: "migrator", atual: "migrator" };
    const resposta = await GET();
    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toEqual({ status: "falha", versao: "local" });
  });
});
