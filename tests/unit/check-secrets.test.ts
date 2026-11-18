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
    ["chave de API do Google", falso("AIza", "Sy", "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q")],
    ["chave secreta do Stripe", falso("sk_", "live_", "Qm7Zr2Lp9Xv4Bn8Ts3Kd6Wc")],
    ["JWT", falso("eyJ", "hbGciOiJIUzI1NiJ9", ".eyJ", "zdWIiOiIxMjM0NTY3ODkwIn0", ".abcdefghij1234567890")],
    ["token do Slack", falso("xo", "xb-", "1234567890-abcdefghij")],
    ["URL de banco ou fila com senha", falso("MYSQL_URL=mysql://app:", "s3nhaForte", "@db.exemplo.com/imob")],
    ["URL de banco ou fila com senha", falso("redis://", ":s3nhaForte", "@cache.exemplo.com:6379")],
    ["URL de banco ou fila com senha", falso("mongodb+srv://app:", "s3nhaForte", "@cluster.exemplo.net/imob")],
    ["URL de banco ou fila com senha", falso("amqp://guest:", "s3nhaForte", "@fila.exemplo.com")],
    ["chave privada do age", falso("AGE-SECRET-", "KEY-1", "QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ")],
    ["chave do Resend", falso("re_", "BrW36ARa_", "JNfq6XbSVLqXqcvbNWgKq8Hx")],
    ["token do Sentry", falso("sntry", "s_", "eyJpYXQiOjE2ODk".repeat(2))],
    ["token do Sentry", falso("sntry", "u_", "a1b2c3d4".repeat(8))],
    ["segredo sem aspas em INI ou YAML", falso("secret_key = ", "Zx9Qw8Er7Ty6Ui5O")],
    ["segredo sem aspas em INI ou YAML", falso("  api_key: ", "Zx9Qw8Er7Ty6Ui5O")],
    ["segredo sem aspas em INI ou YAML", falso("- DB_PASSWORD: ", "Zx9Qw8Er7Ty6Ui5O", " # produção")],
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
    // placeholders dos padrões novos
    falso("STRIPE_KEY=sk_", "live_", "x".repeat(24)),
    "chave = AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "MYSQL_URL=mysql://app:<senha>@db.exemplo.com/imob",
    "REDIS_URL=redis://:senha@cache.exemplo.com:6379",
    "REDIS_URL=redis://:s3nhaForte@localhost:6379/0",
    "MONGO_URL=mongodb://app:${MONGO_SENHA}@db.exemplo.com/imob",
    "AMQP_URL=amqp://guest:guest@localhost:5672/",
    "Authorization: Bearer eyJ...",
    "SLACK_TOKEN=<token>",
    "RESEND_API_KEY=re_...",
    "SENTRY_AUTH_TOKEN=<token>",
    "const re_validacao_de_entrada_longa = 1;",
    "password = changeme",
    "secret_key = <valor>",
    "token: ${{ secrets.GITHUB_TOKEN }}",
    "api_key: xxxxxxxxxxxxxxxxxxxxxxxx",
    "token: string;",
    "const senhaDoUsuarioMuitoLonga = lerSenhaDoUsuario();",
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
