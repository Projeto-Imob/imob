import ts from "typescript";

/** Atributos JSX cujo valor é lido pela pessoa ou pelo leitor de tela. */
const ATRIBUTOS_VISIVEIS = new Set(["aria-label", "aria-description", "alt", "title", "placeholder", "label"]);

export type Achado = { arquivo: string; linha: number; trecho: string };

/** Literal com letra é texto de interface; só pontuação, números e espaço ficam liberados. */
const temLetra = (s: string) => /\p{L}/u.test(s);

export function literaisEmJsx(codigo: string, arquivo: string): Achado[] {
  const fonte = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const achados: Achado[] = [];
  const registrar = (no: ts.Node, trecho: string) => {
    const { line } = fonte.getLineAndCharacterOfPosition(no.getStart(fonte));
    achados.push({ arquivo, linha: line + 1, trecho: trecho.trim().slice(0, 60) });
  };

  const visitar = (no: ts.Node): void => {
    if (ts.isJsxText(no) && temLetra(no.text)) registrar(no, no.text);

    if (ts.isJsxExpression(no) && no.expression && (ts.isJsxElement(no.parent) || ts.isJsxFragment(no.parent))) {
      const e = no.expression;
      if (ts.isStringLiteralLike(e) && temLetra(e.text)) registrar(no, e.text);
    }

    if (ts.isJsxAttribute(no) && ATRIBUTOS_VISIVEIS.has(no.name.getText(fonte)) && no.initializer) {
      const ini = no.initializer;
      const valor = ts.isStringLiteral(ini)
        ? ini.text
        : ts.isJsxExpression(ini) && ini.expression && ts.isStringLiteralLike(ini.expression)
          ? ini.expression.text
          : null;
      if (valor !== null && temLetra(valor)) registrar(no, `${no.name.getText(fonte)}="${valor}"`);
    }

    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return achados;
}

/** Chaves usadas em <T k="…"> e texto("…") que não existem no catálogo. */
export function chavesInexistentes(codigo: string, arquivo: string, chaves: Set<string>): Achado[] {
  const achados: Achado[] = [];
  const padroes = [/<T\s+k=["']([^"']+)["']/g, /\btexto\(\s*["']([^"']+)["']/g];
  for (const padrao of padroes) {
    for (const m of codigo.matchAll(padrao)) {
      const chave = m[1] ?? "";
      if (!chaves.has(chave)) {
        const linha = codigo.slice(0, m.index).split("\n").length;
        achados.push({ arquivo, linha, trecho: `chave inexistente: ${chave}` });
      }
    }
  }
  return achados;
}
