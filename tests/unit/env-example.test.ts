import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const arquivo = fs.readFileSync(path.resolve(__dirname, "../../.env.example"), "utf8");
const linhas = arquivo.split(/\r?\n/);
/** Nome de toda variável citada, ativa ou comentada. */
const variaveis = linhas.flatMap((l) => {
  const m = l.match(/^#?\s*([A-Z][A-Z0-9_]*)=/);
  return m ? [m[1]!] : [];
});

/**
 * Únicas variáveis públicas permitidas: não são segredo.
 * O DSN do Sentry só permite enviar eventos ao projeto e vai para o navegador por definição.
 */
const PUBLICAS_PERMITIDAS = new Set(["NEXT_PUBLIC_DATA_SOURCE", "NEXT_PUBLIC_SENTRY_DSN"]);

describe(".env.example", () => {
  it("declara a fonte de dados com valor local ou postgres", () => {
    expect(arquivo).toMatch(/^NEXT_PUBLIC_DATA_SOURCE=local$/m);
    expect(arquivo).toMatch(/"local".*"postgres"/);
  });

  it.each(["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "ANTHROPIC_API_KEY", "SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"])(
    "%s aparece só como placeholder comentado",
    (nome) => {
      const linha = linhas.find((l) => l.match(new RegExp(`^#?\\s*${nome}=`)));
      expect(linha).toBe(`# ${nome}=`);
    },
  );

  it("nenhum segredo usa o prefixo NEXT_PUBLIC_", () => {
    const publicas = variaveis.filter((v) => v.startsWith("NEXT_PUBLIC_"));
    expect(publicas.filter((v) => !PUBLICAS_PERMITIDAS.has(v))).toEqual([]);
  });
});
