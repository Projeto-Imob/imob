import { ESLint } from "eslint";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(__dirname, "../..");
const eslint = new ESLint({ cwd: raiz });

/** Regras `no-restricted-*` que dão erro ao lintar o código como se estivesse no arquivo. */
async function restricoes(arquivo: string, codigo: string) {
  const [resultado] = await eslint.lintText(codigo, { filePath: path.join(raiz, arquivo) });
  return (resultado?.messages ?? [])
    .filter((m) => m.severity === 2 && m.ruleId?.startsWith("no-restricted-"))
    .map((m) => m.ruleId);
}

const COMPONENTE = "src/components/Violador.tsx";
const PAGINA = "src/app/(publico)/empreendimento/[slug]/page.tsx";
const REGRA = "src/modulos/busca/filtros.ts";
const INDICE = "src/modulos/catalogo/index.ts";
const CONSULTAS = "src/modulos/catalogo/consultas.ts";
const ACOES = "src/modulos/atendimento/acoes.ts";
const SERVIDOR = "src/server/db/index.ts";

// Design D3: um caminho de dados só, o Postgres; nada guardado no navegador.
const ARMAZENAMENTO = [
  "export const x = localStorage.getItem('a');\n",
  "export const x = window.localStorage.getItem('a');\n",
  "export const x = sessionStorage.length;\n",
  "export const x = indexedDB.open('a');\n",
  "const w = window;\nexport const x = w.localStorage;\n",
  "export const x = Reflect.get(globalThis, 'localStorage');\n",
  "export const x = globalThis['sessionStorage'];\n",
  "export const x = document.cookie;\n",
  "import { get } from 'idb-keyval';\nexport const x = get;\n",
];

// Banco, driver e arquivos: só a lista permitida (src/server, consultas.ts e acoes.ts).
const DADOS = [
  "import { sql } from 'drizzle-orm';\nexport const x = sql;\n",
  "import { pgTable } from 'drizzle-orm/pg-core';\nexport const x = pgTable;\n",
  "import { Pool } from 'pg';\nexport const x = Pool;\n",
  "import { comContexto } from '@/server/db';\nexport const x = comContexto;\n",
  "import { empreendimentos } from '@/server/db/schema';\nexport const x = empreendimentos;\n",
  "import { discoLocal } from '@/server/arquivos/disco';\nexport const x = discoLocal;\n",
  "import { S3Client } from '@aws-sdk/client-s3';\nexport const x = S3Client;\n",
];

describe("lint: armazenamento no navegador (design D3)", () => {
  it.each(ARMAZENAMENTO)("falha em componente: %s", async (codigo) => {
    expect(await restricoes(COMPONENTE, codigo)).not.toEqual([]);
  });

  it.each(ARMAZENAMENTO)("falha também no servidor: %s", async (codigo) => {
    expect(await restricoes(SERVIDOR, codigo)).not.toEqual([]);
  });
});

describe("lint: banco e arquivos só pela lista permitida", () => {
  it.each(DADOS)("falha em componente, página, regra pura e índice: %s", async (codigo) => {
    for (const arquivo of [COMPONENTE, PAGINA, REGRA, INDICE]) {
      expect(await restricoes(arquivo, codigo), arquivo).not.toEqual([]);
    }
  });

  it.each(DADOS)("permite em src/server, consultas.ts e acoes.ts: %s", async (codigo) => {
    for (const arquivo of [SERVIDOR, CONSULTAS, ACOES]) {
      expect(await restricoes(arquivo, codigo), arquivo).toEqual([]);
    }
  });
});

describe("lint: sql.raw fora dos testes", () => {
  const SQL_RAW = "import { sql } from 'drizzle-orm';\nexport const x = sql.raw('select 1');\n";

  it.each([SERVIDOR, CONSULTAS, "scripts/db/operacoes.ts"])("falha em %s", async (arquivo) => {
    expect(await restricoes(arquivo, SQL_RAW)).toContain("no-restricted-syntax");
  });

  it("sql com parâmetros passa", async () => {
    const codigo = "import { sql } from 'drizzle-orm';\nexport const x = (id: string) => sql`select ${id}`;\n";
    expect(await restricoes(CONSULTAS, codigo)).toEqual([]);
  });
});

describe("lint: fronteira dos módulos (design D6)", () => {
  const PROFUNDO = "import { montarCompletos } from '@/modulos/catalogo/regras';\nexport const x = montarCompletos;\n";
  const PELO_INDICE = "import { montarCompletos } from '@/modulos/catalogo';\nexport const x = montarCompletos;\n";

  it.each([COMPONENTE, PAGINA, REGRA, SERVIDOR, ACOES])("import profundo de um módulo falha em %s", async (arquivo) => {
    expect(await restricoes(arquivo, PROFUNDO)).not.toEqual([]);
  });

  it("import relativo para dentro de outro módulo falha", async () => {
    const codigo = "import { montarCompletos } from '../catalogo/regras';\nexport const x = montarCompletos;\n";
    expect(await restricoes(REGRA, codigo)).not.toEqual([]);
    expect(await restricoes(CONSULTAS, codigo.replace("../catalogo", "../busca"))).not.toEqual([]);
  });

  it.each([COMPONENTE, PAGINA, REGRA, SERVIDOR])("import pelo índice passa em %s", async (arquivo) => {
    expect(await restricoes(arquivo, PELO_INDICE)).toEqual([]);
  });

  it("import relativo dentro do próprio módulo passa", async () => {
    expect(await restricoes(REGRA, "import { perfil } from './tipos';\nexport const x = perfil;\n")).toEqual([]);
  });

  it("página do servidor importa consultas.ts e acoes.ts do módulo", async () => {
    const codigo =
      "import { lerEmpreendimentoPublico } from '@/modulos/catalogo/consultas';\n" +
      "import { registrar } from '@/modulos/atendimento/acoes';\n" +
      "export const x = [lerEmpreendimentoPublico, registrar];\n";
    expect(await restricoes(PAGINA, codigo)).toEqual([]);
  });

  it("índice e regras puras não reexportam nem importam consultas e acoes", async () => {
    expect(await restricoes(INDICE, "export * from './consultas';\n")).not.toEqual([]);
    expect(await restricoes(INDICE, "export * from './acoes';\n")).not.toEqual([]);
    expect(await restricoes(REGRA, "import { a } from './consultas';\nexport const x = a;\n")).not.toEqual([]);
  });

  it("regra pura não importa React, Next nem código de servidor", async () => {
    for (const codigo of [
      "import { useState } from 'react';\nexport const x = useState;\n",
      "import { notFound } from 'next/navigation';\nexport const x = notFound;\n",
      "import { env } from '@/server/env';\nexport const x = env;\n",
      "import 'server-only';\nexport const x = 1;\n",
    ]) {
      expect(await restricoes(REGRA, codigo), codigo).not.toEqual([]);
    }
  });
});
