import { afterEach, describe, expect, it, vi } from "vitest";
import { LIMITES_DO_PAPEL, PAPEIS_BANCO, urlDoMigrator } from "../../scripts/db/config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("urlDoMigrator (fatia 0.4)", () => {
  it("usa DATABASE_URL_MIGRATOR sem precisar da URL do superusuário, como na tarefa de migration do servidor", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL_ADMIN", "");
    vi.stubEnv("DATABASE_URL_MIGRATOR", "postgres://migrator:x@banco-hml:5432/imob");
    expect(urlDoMigrator("dev")).toBe("postgres://migrator:x@banco-hml:5432/imob");
  });

  it("no banco de testes, deriva sempre da URL de administração", () => {
    vi.stubEnv("DATABASE_URL_ADMIN", "postgres://postgres@localhost:5432/postgres");
    vi.stubEnv("DATABASE_URL_MIGRATOR", "postgres://migrator:x@banco-hml:5432/imob");
    vi.stubEnv("DB_SENHA_MIGRATOR", "");
    vi.stubEnv("DB_NOME_TESTE", "");
    const url = new URL(urlDoMigrator("teste"));
    expect(url.hostname).toBe("localhost");
    expect(url.username).toBe("migrator");
  });

  it("em produção, sem nenhuma URL, recusa em vez de cair no banco local", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL_ADMIN", "");
    vi.stubEnv("DATABASE_URL_MIGRATOR", "");
    expect(() => urlDoMigrator("dev")).toThrow("DATABASE_URL_ADMIN");
  });
});

describe("LIMITES_DO_PAPEL (Proposta da fatia 0.4)", () => {
  it("o app, o auth e o worker têm limite de consulta e de transação ociosa; o migrator não", () => {
    expect(Object.keys(LIMITES_DO_PAPEL).sort()).toEqual(["app_user", "auth_service", "worker"]);
    expect(PAPEIS_BANCO).toContain("migrator");
    for (const limites of Object.values(LIMITES_DO_PAPEL)) {
      expect(limites.statementTimeout).toMatch(/^\d+(ms|s|min)$/);
      expect(limites.idleInTransactionSessionTimeout).toMatch(/^\d+(ms|s|min)$/);
    }
  });
});
