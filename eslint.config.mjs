import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Design D3: nenhum componente acessa armazenamento do navegador, o cliente do banco
// ou o armazenamento de arquivos diretamente. Só `src/data/` e `src/server/` podem.
const ARMAZENAMENTO_NAVEGADOR = ["localStorage", "sessionStorage", "indexedDB"];
const MENSAGEM =
  "Acesso a dados só pelos repositórios de src/data (design D3). Use a porta do domínio.";

const regrasAcessoDados = {
  "no-restricted-globals": [
    "error",
    ...ARMAZENAMENTO_NAVEGADOR.map((name) => ({ name, message: MENSAGEM })),
  ],
  "no-restricted-properties": [
    "error",
    ...["window", "globalThis", "self"].flatMap((object) =>
      ARMAZENAMENTO_NAVEGADOR.map((property) => ({ object, property, message: MENSAGEM })),
    ),
  ],
  "no-restricted-imports": [
    "error",
    {
      paths: [
        { name: "drizzle-orm", message: MENSAGEM },
        { name: "pg", message: MENSAGEM },
        { name: "postgres", message: MENSAGEM },
        { name: "@electric-sql/pglite", message: MENSAGEM },
        { name: "idb", message: MENSAGEM },
        { name: "idb-keyval", message: MENSAGEM },
      ],
      patterns: [
        { group: ["drizzle-orm/*", "@aws-sdk/*", "@electric-sql/pglite/*"], message: MENSAGEM },
        {
          group: ["@/server/db", "@/server/db/*", "@/server/storage", "@/server/storage/*"],
          message: MENSAGEM,
        },
        { group: ["**/server/db", "**/server/db/*", "**/server/storage", "**/server/storage/*"], message: MENSAGEM },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    // Testes montam os adaptadores diretamente para verificá-los.
    ignores: ["src/data/**", "src/server/**", "tests/**"],
    rules: regrasAcessoDados,
  },
  globalIgnores([
    ".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**",
    // Framework AIOX e planejamento ficam na raiz, mas não são código do app.
    ".aiox-core/**", ".claude/**", ".agents/**", ".github/**", "squads/**", "openspec/**", "docs/**",
  ]),
]);

export default eslintConfig;
