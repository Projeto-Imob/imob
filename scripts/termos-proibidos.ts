// Regra inegociável 19: corretor, imobiliária (como perfil), parceria, anúncio de corretor e o nome
// "JulI.A" não existem no produto. Esta varredura cobre o código do app (src/, config/, scripts/,
// tests/, public/ e os arquivos de configuração da raiz), db/ e infra/ (design D11).
// docs/, openspec/, CLAUDE.md, AGENTS.md e o framework AIOX ficam fora porque descrevem os próprios termos.
import fs from "node:fs";
import path from "node:path";

export const TERMOS_PROIBIDOS: ReadonlyArray<{ nome: string; padrao: RegExp }> = [
  { nome: "corretor", padrao: /corretor/i },
  { nome: "broker", padrao: /broker/i },
  { nome: "parceria", padrao: /parceria/i },
  // Perfil "imobiliaria": forma de identificador, sem acento. A prosa "incorporação imobiliária" não é perfil.
  { nome: "imobiliaria", padrao: /imobiliaria/i },
  { nome: "JulI.A", padrao: /\bjuli\.a\b/i },
];

const DIRETORIOS_IGNORADOS = new Set(["node_modules", ".next", "out", "build", "coverage", "playwright-report", "test-results", ".git"]);
const EXTENSOES = /\.(ts|tsx|js|jsx|mjs|cjs|mts|json|css|sql|md|ya?ml|sh|conf|env\.example|txt|html)$|^Dockerfile|^\.env\.example$/i;

/** Arquivos que precisam citar os termos para verificá-los. */
const PERMITIDOS = new Set(["scripts/termos-proibidos.ts", "tests/unit/termos-proibidos.test.ts", "package-lock.json"]);

/** Pastas do app varridas recursivamente. */
export const PASTAS_VARRIDAS = ["src", "config", "scripts", "tests", "public", "db", "infra"] as const;
/** Arquivos da raiz que não são do app (instruções e planejamento). */
const RAIZ_IGNORADOS = new Set(["CLAUDE.md", "AGENTS.md", "README.md"]);

export type Ocorrencia = { arquivo: string; linha: number; termo: string };

export function procurarEmTexto(texto: string, arquivo: string): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];
  texto.split(/\r?\n/).forEach((conteudo, i) => {
    for (const { nome, padrao } of TERMOS_PROIBIDOS) {
      if (padrao.test(conteudo)) ocorrencias.push({ arquivo, linha: i + 1, termo: nome });
    }
  });
  return ocorrencias;
}

function listar(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (DIRETORIOS_IGNORADOS.has(e.name)) return [];
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return listar(p);
    return EXTENSOES.test(e.name) ? [p] : [];
  });
}

/** Varre o código do app, db/ e infra/ a partir da raiz do repositório. */
export function varrerRepositorio(raizRepo: string): Ocorrencia[] {
  const arquivosRaiz = fs
    .readdirSync(raizRepo, { withFileTypes: true })
    .filter((e) => e.isFile() && EXTENSOES.test(e.name) && !RAIZ_IGNORADOS.has(e.name))
    .map((e) => path.join(raizRepo, e.name));
  const arquivos = [...arquivosRaiz, ...PASTAS_VARRIDAS.flatMap((pasta) => listar(path.join(raizRepo, pasta)))];
  return arquivos.flatMap((arquivo) => {
    const rel = path.relative(raizRepo, arquivo).replaceAll("\\", "/");
    if (PERMITIDOS.has(rel)) return [];
    return procurarEmTexto(fs.readFileSync(arquivo, "utf8"), rel);
  });
}
