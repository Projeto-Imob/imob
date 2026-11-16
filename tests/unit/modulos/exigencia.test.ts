import { describe, expect, it } from "vitest";
import { cabe, compararExigencias, exigenciaDoPlano, melhorExigencia, type FormaPagamento, type Perfil } from "@/modulos/busca";
import type { Plano } from "@/modulos/catalogo";

const plano = (id: string, alt: Partial<Plano> = {}): Plano => ({
  id,
  empreendimentoId: "e",
  nome: id,
  sinalPercentual: 10,
  mensaisPercentual: 24,
  numeroParcelas: 24,
  intercaladasPercentual: 0,
  chavesPercentual: 0,
  saldoPercentual: 66,
  indiceCorrecao: "INCC",
  financiamento: { aceita: true, momento: "chaves", percentualMaximo: 80, fgts: true, dacao: false, parcelamentoDireto: true },
  exemplo: true,
  ...alt,
});

const pg = (alt: Partial<Perfil["pagamento"]> = {}): Perfil["pagamento"] => ({
  formas: [] as FormaPagamento[],
  entrada: null,
  parcelaMaxima: null,
  ...alt,
});

describe("exigência por plano (2.5)", () => {
  it("entrada = preço × sinal% e parcela = preço × mensais% ÷ número de parcelas", () => {
    expect(exigenciaDoPlano({ id: "u", preco: 500000 }, plano("p"), false)).toEqual({
      unidadeId: "u",
      planoId: "p",
      preco: 500000,
      entrada: 50000,
      parcela: 5000,
    });
  });

  it("plano sem número de parcelas tem parcela nula", () => {
    expect(exigenciaDoPlano({ id: "u", preco: 500000 }, plano("p", { numeroParcelas: null }), false).parcela).toBeNull();
  });

  it("só À vista marcado, ou sem planos, a entrada é o preço inteiro", () => {
    expect(melhorExigencia([{ id: "u", preco: 400000 }], [plano("p")], pg({ formas: ["a_vista"] }))).toMatchObject({
      entrada: 400000,
      parcela: null,
      planoId: null,
    });
    expect(melhorExigencia([{ id: "u", preco: 400000 }], [], pg())).toMatchObject({ entrada: 400000, planoId: null });
  });

  it("À vista junto com outra forma usa os planos", () => {
    expect(melhorExigencia([{ id: "u", preco: 400000 }], [plano("p")], pg({ formas: ["a_vista", "fgts"] }))?.planoId).toBe("p");
  });

  it("parcela acima do limite não cabe (R$ 3.200 > R$ 3.000)", () => {
    const ex = { unidadeId: "u", planoId: "p", preco: 1, entrada: 10000, parcela: 3200 };
    expect(cabe(ex, pg({ parcelaMaxima: 3000 }))).toBe(false);
    expect(cabe(ex, pg({ parcelaMaxima: 3200 }))).toBe(true);
  });

  it("com parcela máxima informada, plano sem número de parcelas não cabe", () => {
    expect(melhorExigencia([{ id: "u", preco: 500000 }], [plano("p", { numeroParcelas: null })], pg({ parcelaMaxima: 99999 }))).toBeNull();
  });

  it("entrada exigida acima da informada não cabe", () => {
    expect(melhorExigencia([{ id: "u", preco: 500000 }], [plano("p")], pg({ entrada: 49999 }))).toBeNull();
    expect(melhorExigencia([{ id: "u", preco: 500000 }], [plano("p")], pg({ entrada: 50000 }))).not.toBeNull();
  });

  it("a melhor é a de menor entrada", () => {
    const r = melhorExigencia([{ id: "u", preco: 500000 }], [plano("p20", { sinalPercentual: 20 }), plano("p10")], pg());
    expect(r?.planoId).toBe("p10");
  });

  it("entre unidades, vence a de menor entrada", () => {
    const r = melhorExigencia(
      [
        { id: "cara", preco: 600000 },
        { id: "barata", preco: 300000 },
      ],
      [plano("p10")],
      pg(),
    );
    expect(r).toMatchObject({ unidadeId: "barata", entrada: 30000 });
  });

  it("no empate de entrada, vence a de menor preço", () => {
    // 10% de 600 mil e 20% de 300 mil exigem os mesmos 60 mil.
    const cara = { unidadeId: "cara", planoId: "p10", preco: 600000, entrada: 60000, parcela: null };
    const barata = { unidadeId: "barata", planoId: "p20", preco: 300000, entrada: 60000, parcela: null };
    expect([cara, barata].sort(compararExigencias)[0]).toBe(barata);
    expect([barata, cara].sort(compararExigencias)[0]).toBe(barata);
  });
});
