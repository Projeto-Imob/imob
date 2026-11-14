/**
 * Marca centralizada (CLAUDE.md, seção 1 e 12). Nome e logotipo são provisórios:
 * trocar aqui altera cabeçalho, rodapé e `<title>` em toda a aplicação.
 * Evite o nome em textos do catálogo; use sempre `brand.nome`.
 */
export type Logotipo = {
  /** Caminho em /public. */
  src: string;
  largura: number;
  altura: number;
};

export type Brand = {
  nome: string;
  /** `null` enquanto não houver arquivo de logotipo aprovado: o cabeçalho mostra o nome em texto. */
  logotipo: Logotipo | null;
};

export const brand: Brand = {
  nome: "Vieza",
  logotipo: null,
};
