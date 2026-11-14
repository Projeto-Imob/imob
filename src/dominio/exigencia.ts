/**
 * Exigência por plano (tarefa 2.5; CLAUDE.md "Exigência por plano").
 * Entrada = preço × sinal%. Parcela = preço × mensais% ÷ número de parcelas (nula sem o número).
 * Só "À vista" marcado, ou sem planos: a entrada é o preço inteiro.
 */
import type { FormaPagamento, Perfil, Plano, Unidade } from "./tipos";

export type Exigencia = {
  unidadeId: string;
  planoId: string | null;
  preco: number;
  entrada: number;
  parcela: number | null;
};

const centavos = (v: number) => Math.round(v * 100) / 100;

export function soAVista(formas: FormaPagamento[]): boolean {
  return formas.length === 1 && formas[0] === "a_vista";
}

export function exigenciaDoPlano(unidade: Pick<Unidade, "id" | "preco">, plano: Plano | null, aVista: boolean): Exigencia {
  if (aVista || plano === null) {
    return { unidadeId: unidade.id, planoId: null, preco: unidade.preco, entrada: unidade.preco, parcela: null };
  }
  const parcela =
    plano.numeroParcelas === null ? null : centavos((unidade.preco * plano.mensaisPercentual) / 100 / plano.numeroParcelas);
  return {
    unidadeId: unidade.id,
    planoId: plano.id,
    preco: unidade.preco,
    entrada: centavos((unidade.preco * plano.sinalPercentual) / 100),
    parcela,
  };
}

/** Cabe quando a entrada exigida ≤ a informada e, havendo parcela máxima, a parcela existe e é ≤ a ela. */
export function cabe(ex: Exigencia, pagamento: Perfil["pagamento"]): boolean {
  if (pagamento.entrada !== null && ex.entrada > pagamento.entrada) return false;
  if (pagamento.parcelaMaxima !== null && (ex.parcela === null || ex.parcela > pagamento.parcelaMaxima)) return false;
  return true;
}

/** A melhor exigência é a de menor entrada; no empate, a de menor preço. */
export function compararExigencias(a: Exigencia, b: Exigencia): number {
  return a.entrada - b.entrada || a.preco - b.preco || a.unidadeId.localeCompare(b.unidadeId);
}

/** Melhor exigência que cabe, entre todas as combinações unidade × plano. Nula se nenhuma cabe. */
export function melhorExigencia(
  unidades: Array<Pick<Unidade, "id" | "preco">>,
  planos: Plano[],
  pagamento: Perfil["pagamento"],
): Exigencia | null {
  const aVista = soAVista(pagamento.formas) || planos.length === 0;
  const candidatos = unidades.flatMap((u) =>
    aVista ? [exigenciaDoPlano(u, null, true)] : planos.map((p) => exigenciaDoPlano(u, p, false)),
  );
  const cabem = candidatos.filter((c) => cabe(c, pagamento)).sort(compararExigencias);
  return cabem[0] ?? null;
}
