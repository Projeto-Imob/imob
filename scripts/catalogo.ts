// npm run catalogo: extrai as chaves do catálogo de textos e falha com literal de texto em JSX
// fora do catálogo (design D7). Gera src/i18n/catalogo.gerado.json para o god mode.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ptBR } from "../src/i18n/pt-BR.ts";
import { chavesInexistentes, literaisEmJsx, type Achado } from "./catalogo-lib.ts";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(raiz, "src");

function arquivosTsx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return arquivosTsx(p);
    return e.name.endsWith(".tsx") ? [p] : [];
  });
}

const chaves = new Set(Object.keys(ptBR));
const achados: Achado[] = arquivosTsx(src).flatMap((arquivo) => {
  const codigo = fs.readFileSync(arquivo, "utf8");
  const rel = path.relative(raiz, arquivo).replaceAll("\\", "/");
  return [...literaisEmJsx(codigo, rel), ...chavesInexistentes(codigo, rel, chaves)];
});

const catalogo = Object.entries(ptBR).map(([chave, padrao]) => ({ chave, padrao }));
fs.writeFileSync(path.join(src, "i18n", "catalogo.gerado.json"), JSON.stringify(catalogo, null, 2) + "\n");

if (achados.length > 0) {
  console.error(`Texto fora do catálogo (${achados.length}):`);
  for (const a of achados) console.error(`  ${a.arquivo}:${a.linha}  ${a.trecho}`);
  console.error('Mova o texto para src/i18n/pt-BR.ts e use <T k="..."> ou texto("...").');
  process.exit(1);
}
console.log(`Catálogo ok: ${chaves.size} chaves, nenhum literal em JSX.`);
