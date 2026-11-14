import { ESLint } from "eslint";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(__dirname, "../..");
const eslint = new ESLint({ cwd: raiz });

async function erros(arquivo: string, codigo: string) {
  const [resultado] = await eslint.lintText(codigo, { filePath: path.join(raiz, arquivo) });
  return (resultado?.messages ?? [])
    .filter((m) => m.severity === 2)
    .map((m) => m.ruleId);
}

const VIOLACOES = [
  "export const x = localStorage.getItem('a');\n",
  "export const x = window.localStorage.getItem('a');\n",
  "export const x = sessionStorage.length;\n",
  "export const x = indexedDB.open('a');\n",
  "import { sql } from 'drizzle-orm';\nexport const x = sql;\n",
  "import { pgTable } from 'drizzle-orm/pg-core';\nexport const x = pgTable;\n",
  "import { db } from '@/server/db';\nexport const x = db;\n",
  "import { s3 } from '@/server/storage/s3';\nexport const x = s3;\n",
  "import { S3Client } from '@aws-sdk/client-s3';\nexport const x = S3Client;\n",
];

describe("regra de lint de acesso a dados (design D3)", () => {
  it.each(VIOLACOES)("falha fora de src/data e src/server: %s", async (codigo) => {
    const ids = await erros("src/components/Violador.tsx", codigo);
    expect(ids.some((id) => id?.startsWith("no-restricted-"))).toBe(true);
  });

  it.each(VIOLACOES)("permite dentro de src/data: %s", async (codigo) => {
    const ids = await erros("src/data/local.ts", codigo);
    expect(ids.filter((id) => id?.startsWith("no-restricted-"))).toEqual([]);
  });

  it("permite dentro de src/server", async () => {
    const ids = await erros("src/server/db/index.ts", VIOLACOES[4]!);
    expect(ids.filter((id) => id?.startsWith("no-restricted-"))).toEqual([]);
  });
});
