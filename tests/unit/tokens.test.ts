import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const raiz = path.resolve(__dirname, "../..");
const css = fs.readFileSync(path.join(raiz, "src/app/globals.css"), "utf8");

function tokens(): Record<string, string> {
  const bloco = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  return Object.fromEntries(
    [...bloco.matchAll(/--(cor-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, nome, hex]) => [nome!, hex!.toLowerCase()]),
  );
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

const t = tokens();
const cor = (nome: string) => {
  const v = t[nome];
  if (!v) throw new Error(`token --${nome} ausente em globals.css`);
  return v;
};

// Combinações de texto usadas na interface (texto, fundo). AA exige 4,5:1 para texto normal.
const TEXTO: Array<[string, string]> = [
  ["cor-preto", "cor-off-white"],
  ["cor-preto", "cor-branco"],
  ["cor-grafite", "cor-off-white"],
  ["cor-texto-secundario", "cor-off-white"],
  ["cor-texto-secundario", "cor-branco"],
  ["cor-texto-discreto", "cor-off-white"],
  ["cor-texto-discreto", "cor-branco"],
  ["cor-preto", "cor-laranja"],
  ["cor-laranja", "cor-preto"],
  ["cor-off-white", "cor-preto"],
  ["cor-secundario-sobre-preto", "cor-preto"],
  ["cor-sucesso", "cor-off-white"],
  ["cor-atencao", "cor-off-white"],
  ["cor-erro", "cor-off-white"],
  ["cor-sucesso", "cor-branco"],
  ["cor-atencao", "cor-branco"],
  ["cor-erro", "cor-branco"],
  ["cor-apoio-morar", "cor-off-white"],
  ["cor-apoio-investir", "cor-off-white"],
  ["cor-branco", "cor-apoio-morar"],
  ["cor-branco", "cor-apoio-investir"],
];

// Elementos não textuais (borda de controle, marcas de gráfico): 3:1.
const NAO_TEXTO: Array<[string, string]> = [
  ["cor-borda-controle", "cor-off-white"],
  ["cor-borda-controle", "cor-branco"],
  ["cor-grafico-rampa-inicio", "cor-branco"],
  ["cor-grafico-rampa-fim", "cor-branco"],
];

describe("tokens de cor (seção 12)", () => {
  it.each(TEXTO)("%s sobre %s passa AA (4,5:1)", (texto, fundo) => {
    expect(contraste(cor(texto), cor(fundo))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NAO_TEXTO)("%s sobre %s passa 3:1", (elemento, fundo) => {
    expect(contraste(cor(elemento), cor(fundo))).toBeGreaterThanOrEqual(3);
  });

  it("o laranja falha como texto sobre fundo claro (motivo da regra)", () => {
    expect(contraste(cor("cor-laranja"), cor("cor-off-white"))).toBeLessThan(3);
  });

  it("tipografia: Inter Tight nos títulos e Inter na interface", () => {
    expect(css).toMatch(/--font-titulo:\s*var\(--font-inter-tight\)/);
    expect(css).toMatch(/--font-sans:\s*var\(--font-inter\)/);
    expect(css).toMatch(/\.titulo-marca\s*\{[^}]*font-weight:\s*800[^}]*text-transform:\s*uppercase[^}]*letter-spacing:\s*-0\.03em/);
    expect(css).toMatch(/\.etiqueta\s*\{[^}]*font-weight:\s*600[^}]*text-transform:\s*uppercase[^}]*letter-spacing:\s*0\.14em/);
  });
});

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return arquivos(p);
    return /\.(tsx?|css)$/.test(e.name) ? [p] : [];
  });
}

// Utilitários que pintariam texto, ícone, linha ou marca de gráfico com o laranja.
const USO_PROIBIDO = /\b(?:text|border|stroke|fill|outline|ring|decoration|divide|accent|caret|placeholder)-laranja\b/;

/**
 * Ilustrações que desenham com o laranja só sobre o fundo preto delas mesmas (a regra 15 proíbe o laranja
 * apenas sobre fundo claro). Nelas, só `fill-laranja` fica liberado; texto, traço e borda em laranja continuam
 * barrados. Cada uma tem um teste de componente que prova o fundo preto (tests/unit/pagina-componentes.test.tsx).
 */
export const ILUSTRACOES_SOBRE_PRETO = new Set([path.join("src", "modulos", "catalogo", "componentes", "FachadaIlustrada.tsx")]);

export function usosProibidosDoLaranja(fonteOriginal: string, arquivo: string): string[] {
  const achados: string[] = [];
  const fonte = ILUSTRACOES_SOBRE_PRETO.has(arquivo) ? fonteOriginal.replace(/\bfill-laranja\b/g, "") : fonteOriginal;
  if (USO_PROIBIDO.test(fonte)) achados.push(`${arquivo}: utilitário de texto/linha com laranja`);
  if (arquivo.endsWith(".css")) {
    for (const [, seletor, corpo] of fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const pintaComLaranja = /(?:^|[;\s])(?:color|border(?:-\w+)?-color|stroke|fill|outline-color)\s*:\s*var\(--cor-laranja\)/.test(corpo!);
      const sobrePreto = /background(?:-color)?\s*:\s*var\(--cor-preto\)/.test(corpo!);
      if (pintaComLaranja && !sobrePreto) achados.push(`${arquivo}: ${seletor!.trim()} usa o laranja como cor de texto/linha`);
    }
  } else if (/["'`]var\(--cor-laranja\)["'`]|stroke=["']#ff8c00|fill=["']#ff8c00/i.test(fonte)) {
    achados.push(`${arquivo}: laranja usado como traço/preenchimento de gráfico ou ícone`);
  }
  return achados;
}

describe("regra do laranja", () => {
  it("o código não usa o laranja como texto, ícone, linha ou marca de gráfico sobre fundo claro", () => {
    const achados = arquivos(path.join(raiz, "src")).flatMap((a) =>
      usosProibidosDoLaranja(fs.readFileSync(a, "utf8"), path.relative(raiz, a)),
    );
    expect(achados).toEqual([]);
  });

  it.each([
    ["x.tsx", '<p className="text-laranja">a</p>'],
    ["x.tsx", '<Line stroke="var(--cor-laranja)" />'],
    ["x.css", ".a { color: var(--cor-laranja); }"],
  ])("detecta violação em %s: %s", (arquivo, fonte) => {
    expect(usosProibidosDoLaranja(fonte, arquivo)).not.toEqual([]);
  });

  it("libera fill-laranja só nas ilustrações sobre fundo preto, e só o preenchimento", () => {
    const fachada = path.join("src", "modulos", "catalogo", "componentes", "FachadaIlustrada.tsx");
    expect(usosProibidosDoLaranja('<rect className="fill-laranja" />', fachada)).toEqual([]);
    expect(usosProibidosDoLaranja('<path className="stroke-laranja" />', fachada)).not.toEqual([]);
    expect(usosProibidosDoLaranja('<p className="text-laranja">a</p>', fachada)).not.toEqual([]);
    expect(usosProibidosDoLaranja('<rect className="fill-laranja" />', "src/outro/Grafico.tsx")).not.toEqual([]);
  });

  it("permite laranja como fundo e como texto sobre preto", () => {
    expect(usosProibidosDoLaranja(".a { background: var(--cor-laranja); color: var(--cor-preto); }", "x.css")).toEqual([]);
    expect(usosProibidosDoLaranja(".b { background: var(--cor-preto); color: var(--cor-laranja); }", "x.css")).toEqual([]);
    expect(usosProibidosDoLaranja('<div className="bg-laranja text-preto" />', "x.tsx")).toEqual([]);
  });
});
