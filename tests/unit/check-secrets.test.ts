import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ehArquivoEnvProibido, procurarSegredos, verificar } from "../../scripts/check-secrets";

const script = path.resolve(__dirname, "../../scripts/check-secrets.ts");

// Valores falsos montados em tempo de execução, para o próprio teste não conter um segredo literal.
const falso = (...partes: string[]) => partes.join("");

describe("procurarSegredos", () => {
  it.each([
    ["chave de acesso AWS", falso("AKIA", "ABCDEFGHIJKLMNOP")],
    ["chave da Anthropic", falso("ANTHROPIC_API_KEY=sk-", "ant-", "a".repeat(30))],
    ["token do GitHub", falso("gh", "p_", "a".repeat(36))],
    ["chave privada", falso("-----BEGIN ", "PRIVATE KEY-----")],
    ["URL de banco com senha", falso("DATABASE_URL=postgres://app:", "s3nhaForte", "@db.exemplo.com/imob")],
    ["segredo com prefixo NEXT_PUBLIC_", falso("NEXT_PUBLIC_", "BETTER_AUTH_", "SECRET=")],
    ["segredo atribuído em texto", falso("const apiKey = '", "Zx9".repeat(8), "';")],
    ["segredo atribuído em variável de ambiente", falso("BETTER_AUTH_SECRET=", "q8W2".repeat(4))],
  ])("acusa %s", (motivo, linha) => {
    expect(procurarSegredos(linha, "x").map((a) => a.motivo)).toContain(motivo);
  });

  it.each([
    "DATABASE_URL=postgres://app:<senha>@localhost:5432/imob",
    "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test",
    "# BETTER_AUTH_SECRET=",
    "BETTER_AUTH_SECRET=",
    "NEXT_PUBLIC_DATA_SOURCE=local",
    "<Componente tokens={meusTokens} />",
    "overhead_tokens: baselineOverheadTokens,",
  ])("não acusa placeholder ou nome de variável: %s", (linha) => {
    expect(procurarSegredos(linha, "x")).toEqual([]);
  });
});

describe("arquivos .env", () => {
  it.each([".env", ".env.local", "db/.env.local", "infra/.env.production"])("%s é proibido", (a) => {
    expect(ehArquivoEnvProibido(a)).toBe(true);
  });
  it.each([".env.example", "infra/.env.example", "src/env.ts"])("%s é permitido", (a) => {
    expect(ehArquivoEnvProibido(a)).toBe(false);
  });
});

describe("check:secrets num repositório", () => {
  let repo: string;
  const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), "imob-secrets-"));
    git("init", "-q");
    fs.writeFileSync(path.join(repo, ".gitignore"), ".env*\n!.env.example\n");
    fs.writeFileSync(path.join(repo, ".env.example"), "# BETTER_AUTH_SECRET=\n");
  });
  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));

  it("passa sem segredos e com .env.local ignorado", () => {
    fs.writeFileSync(path.join(repo, ".env.local"), falso("BETTER_AUTH_SECRET=", "q8W2".repeat(4), "\n"));
    expect(verificar(repo)).toEqual([]);
    expect(spawnSync(process.execPath, [script, "--raiz", repo]).status).toBe(0);
  });

  it("acusa um arquivo .env.local rastreado", () => {
    fs.writeFileSync(path.join(repo, ".env.local"), "X=1\n");
    git("add", "-f", ".env.local");
    expect(verificar(repo).map((a) => a.arquivo)).toContain(".env.local");
    const r = spawnSync(process.execPath, [script, "--raiz", repo], { encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(".env.local");
  });
});
