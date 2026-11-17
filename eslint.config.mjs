import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Fronteiras verificadas por lint (docs/ARQUITETURA.md, seção 3; teste em tests/unit/lint-acesso-dados.test.ts).
// - Design D3: um caminho de dados só, o Postgres; nada guardado no navegador.
// - Lista permitida do banco e dos arquivos: src/server e os consultas.ts e acoes.ts dos módulos.
// - Design D6: de fora, um módulo entra pelo índice (@/modulos/<modulo>) ou, no servidor, por consultas e acoes;
//   as regras puras e o índice não importam React, Next, banco nem servidor.
// - sql.raw barrado fora dos testes: valor dinâmico vai como parâmetro em sql`...`.

const NAVEGADOR = ["localStorage", "sessionStorage", "indexedDB"];
const NOME_NAVEGADOR = `/^(${NAVEGADOR.join("|")})$/`;

const MSG_NAVEGADOR = "Nada guardado no navegador: o único caminho de dados é o Postgres (design D3).";
const MSG_DADOS = "Banco e arquivos só em src/server e nos consultas.ts e acoes.ts dos módulos (lista permitida).";
const MSG_MODULO = "Importe o módulo pelo índice (@/modulos/<modulo>); no servidor, também por consultas ou acoes (design D6).";
const MSG_RELATIVO = "Dentro do módulo, use ./; outro módulo entra pelo índice @/modulos/<modulo> (design D6).";
const MSG_PURO = "Regra pura e índice do módulo: sem React, Next, banco nem servidor (design D6).";
const MSG_SQL_RAW = "sql.raw não parametriza valores: use sql`...` com interpolação (injeção de SQL).";

const SINTAXE_NAVEGADOR = [
  // Pega window.localStorage, apelidos (w.localStorage), globalThis["sessionStorage"] e Reflect.get(globalThis, "indexedDB").
  { selector: `MemberExpression[property.name=${NOME_NAVEGADOR}]`, message: MSG_NAVEGADOR },
  { selector: `Literal[value=${NOME_NAVEGADOR}]`, message: MSG_NAVEGADOR },
  { selector: `TemplateElement[value.cooked=${NOME_NAVEGADOR}]`, message: MSG_NAVEGADOR },
  { selector: "MemberExpression[object.name='document'][property.name='cookie']", message: MSG_NAVEGADOR },
];
const SINTAXE_SQL_RAW = [
  { selector: "MemberExpression[object.name='sql'][property.name='raw']", message: MSG_SQL_RAW },
  { selector: "MemberExpression[object.name='sql'][property.value='raw']", message: MSG_SQL_RAW },
];

const IMPORTS_NAVEGADOR = [
  { name: "idb", message: MSG_NAVEGADOR },
  { name: "idb-keyval", message: MSG_NAVEGADOR },
];
const IMPORTS_DADOS = [
  { name: "drizzle-orm", message: MSG_DADOS },
  { name: "pg", message: MSG_DADOS },
  { name: "postgres", message: MSG_DADOS },
  { name: "@electric-sql/pglite", message: MSG_DADOS },
];
const PADROES_DADOS = [
  { group: ["drizzle-orm/*", "@aws-sdk/*", "@electric-sql/pglite/*"], message: MSG_DADOS },
  { regex: "(^|/)server/(db|arquivos)(/|$)", message: MSG_DADOS },
];
const MODULO_PROFUNDO = { regex: "^@/modulos/[^/]+/(?!(consultas|acoes)$)", message: MSG_MODULO };
const SAI_DO_MODULO = { regex: "^\\.\\./", message: MSG_RELATIVO };
const IMPORTS_PUROS = ["react", "react-dom", "next", "server-only", "./consultas", "./acoes"].map((name) => ({
  name,
  message: MSG_PURO,
}));
const PADROES_PUROS = [
  { group: ["react/*", "react-dom/*", "next/*"], message: MSG_PURO },
  { regex: "^@/server(/|$)", message: MSG_PURO },
];

const PORTAS_SERVIDOR = ["src/modulos/*/consultas.ts", "src/modulos/*/acoes.ts"];

const fronteiras = [
  {
    // Todo src: nada no navegador, sem sql.raw, banco e arquivos só na lista permitida, módulos pelo índice.
    files: ["src/**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "no-restricted-globals": ["error", ...NAVEGADOR.map((name) => ({ name, message: MSG_NAVEGADOR }))],
      "no-restricted-syntax": ["error", ...SINTAXE_NAVEGADOR, ...SINTAXE_SQL_RAW],
      "no-restricted-imports": [
        "error",
        { paths: [...IMPORTS_NAVEGADOR, ...IMPORTS_DADOS], patterns: [...PADROES_DADOS, MODULO_PROFUNDO] },
      ],
    },
  },
  {
    // Lista permitida: código de servidor.
    files: ["src/server/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { paths: IMPORTS_NAVEGADOR, patterns: [MODULO_PROFUNDO] }] },
  },
  {
    // Lista permitida: as portas de servidor de cada módulo.
    files: PORTAS_SERVIDOR,
    rules: {
      "no-restricted-imports": ["error", { paths: IMPORTS_NAVEGADOR, patterns: [MODULO_PROFUNDO, SAI_DO_MODULO] }],
    },
  },
  {
    // Regras puras e índice dos módulos: seguros no cliente.
    files: ["src/modulos/*/*.{ts,tsx}"],
    ignores: PORTAS_SERVIDOR,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...IMPORTS_NAVEGADOR, ...IMPORTS_DADOS, ...IMPORTS_PUROS],
          patterns: [...PADROES_DADOS, ...PADROES_PUROS, MODULO_PROFUNDO, SAI_DO_MODULO],
        },
      ],
    },
  },
  {
    // Scripts de banco usam o driver direto, mas também sem sql.raw.
    files: ["scripts/**/*.{ts,mjs}"],
    rules: { "no-restricted-syntax": ["error", ...SINTAXE_SQL_RAW] },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...fronteiras,
  globalIgnores([
    ".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**",
    // Framework AIOX e planejamento ficam na raiz, mas não são código do app.
    ".aiox-core/**", ".claude/**", ".agents/**", ".github/**", "squads/**", "openspec/**", "docs/**",
  ]),
]);

export default eslintConfig;
