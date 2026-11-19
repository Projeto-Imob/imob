import { describe, expect, it } from "vitest";
import {
  avaliar,
  avaliarBase,
  compararAvaliacoes,
  escolher,
  notaFinal,
  sorteioFixo,
  type Avaliacao,
  type Componente,
  type ContextoNota,
} from "@/modulos/busca";
import { baseElegivel, montarCompletos } from "@/modulos/catalogo";
import { gerarSeed } from "@/seed/seed";
import { HOJE, completos, perfilCom, porSlug, seed } from "./apoio";

const base = baseElegivel(completos(), { hoje: HOJE });
const ctx: ContextoNota = { hoje: HOJE, sementePerfil: "perfil-a", comodidades: seed.comodidades };

const perfilCompleto = perfilCom({
  modo: "morar",
  quartos: ["2", "3"],
  regiao: { bairros: ["Petrópolis", "Moinhos de Vento"], bairrosVizinhos: ["Bela Vista"], pertoDeMim: false },
  pagamento: { formas: ["direto_construtora"], entrada: 150000, parcelaMaxima: 6000 },
  permuta: "nao",
  requisitos: { chips: ["garagem"], textoLivre: "quero piscina e churrasqueira" },
});

const comp = (chave: Componente["chave"], peso: number, valor: number | null): Componente => ({ chave, peso, valor, detalhe: {} });

describe("nota (2.7)", () => {
  it("é a média ponderada dos cinco componentes, em 0 a 100", () => {
    const n = notaFinal([comp("financeiro", 0.35, 1), comp("tipologia", 0.25, 0.5), comp("localizacao", 0.2, 1), comp("requisitos", 0.1, 0), comp("comportamento", 0.1, 1)]);
    expect(n).toBe(Math.round(100 * (0.35 + 0.125 + 0.2 + 0 + 0.1)));
  });

  it("meio ponto sobe: 57,5 vira 58 e 49,5 vira 50 e entra no corte", () => {
    expect(notaFinal([comp("financeiro", 0.35, 0.575)])).toBe(58);
    expect(notaFinal([comp("tipologia", 0.25, 0.495)])).toBe(50);
    const a = { empreendimentoId: "a", nota: notaFinal([comp("tipologia", 0.25, 0.495)]), componentes: [], exigencia: null, unidadesCompativeis: 1, sorteio: 0 };
    expect(escolher([a]).opcoes).toHaveLength(1);
    expect(notaFinal([comp("financeiro", 0.35, 0.4949)])).toBe(49);
  });

  it("grade de centésimos: igual a uma referência em inteiros, em várias combinações de pesos", () => {
    const referencia = (itens: Array<[number, number]>) => {
      // peso em centésimos, valor em centésimos; nota = soma ÷ pesos, com o meio para cima.
      const soma = itens.reduce((s, [p, v]) => s + p * v, 0);
      const pesos = itens.reduce((s, [p]) => s + p, 0);
      return Math.floor((2 * soma + pesos) / (2 * pesos));
    };
    const pesos: Array<[Componente["chave"], number, number]> = [
      ["financeiro", 0.35, 35],
      ["tipologia", 0.25, 25],
      ["localizacao", 0.2, 20],
      ["requisitos", 0.1, 10],
      ["comportamento", 0.1, 10],
    ];
    for (let v1 = 0; v1 <= 100; v1++) {
      for (let v2 = 0; v2 <= 100; v2 += 3) {
        const esperado = referencia([
          [35, v1],
          [25, v2],
          [20, (v1 + v2) % 101],
        ]);
        const obtido = notaFinal([
          comp(pesos[0]![0], pesos[0]![1], v1 / 100),
          comp(pesos[1]![0], pesos[1]![1], v2 / 100),
          comp(pesos[2]![0], pesos[2]![1], ((v1 + v2) % 101) / 100),
          comp(pesos[3]![0], pesos[3]![1], null),
        ]);
        expect(obtido, `${v1}/${v2}`).toBe(esperado);
      }
    }
  });

  it("componente sem dado fica fora e os pesos são reponderados", () => {
    expect(notaFinal([comp("financeiro", 0.35, null), comp("tipologia", 0.25, 1), comp("localizacao", 0.2, 0.5)])).toBe(
      Math.round((100 * (0.25 + 0.1)) / 0.45),
    );
    expect(notaFinal([comp("financeiro", 0.35, null)])).toBeNull();
  });

  it("sem entrada nem parcela, o financeiro fica fora da conta", () => {
    const a = avaliar(porSlug(base, "vila-menino-deus"), perfilCom({ quartos: ["2"] }), ctx)!;
    expect(a.componentes.find((c) => c.chave === "financeiro")?.valor).toBeNull();
  });

  it("financeiro segue a fórmula e soma o bônus de permuta", () => {
    const e = porSlug(base, "vila-menino-deus");
    const p = perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: 122000, parcelaMaxima: null }, permuta: "sim" });
    const a = avaliar(e, p, ctx)!;
    const f = a.componentes.find((c) => c.chave === "financeiro")!;
    const esperado = Math.min(1, 1 - (0.5 * a.exigencia!.entrada) / 122000 + 0.1);
    expect(f.valor).toBeCloseTo(esperado, 10);
  });

  it("tipologia = unidades compatíveis ÷ 6, até 1, e fica fora sem quartos", () => {
    const a = avaliar(porSlug(base, "studio-cidade-baixa"), perfilCom({ quartos: ["studio"] }), ctx)!;
    const t = a.componentes.find((c) => c.chave === "tipologia")!;
    expect(t.valor).toBe(Math.min(1, a.unidadesCompativeis / 6));
    expect(avaliar(porSlug(base, "studio-cidade-baixa"), perfilCom({}), ctx)!.componentes.find((c) => c.chave === "tipologia")!.valor).toBeNull();
  });

  it("localização: bairro escolhido 1, vizinho 0,6, misturado com pontos 0,6/0,4", () => {
    const escolhido = avaliar(porSlug(base, "edificio-mirante-petropolis"), perfilCompleto, ctx)!.componentes.find((c) => c.chave === "localizacao")!;
    expect(escolhido.detalhe.regiao).toBe(1);
    const semPagamento = { ...perfilCompleto, pagamento: { formas: [], entrada: null, parcelaMaxima: null } };
    const vizinho = avaliar(porSlug(base, "bela-vista-prime"), semPagamento, ctx)!.componentes.find((c) => c.chave === "localizacao")!;
    expect(vizinho.detalhe.regiao).toBe(0.6);
    expect(vizinho.valor).toBeCloseTo(0.6 * 0.6 + 0.4 * (vizinho.detalhe.pontos as number), 10);
  });

  it("requisitos = atendidos ÷ pedidos, com chips e itens do texto livre", () => {
    const a = avaliar(porSlug(base, "edificio-mirante-petropolis"), perfilCompleto, ctx)!;
    // Pedidos: garagem (chip), piscina e churrasqueira (texto). Petrópolis tem garagem e churrasqueira.
    expect(a.componentes.find((c) => c.chave === "requisitos")!.detalhe).toEqual({ atendidos: 2, pedidos: 3 });
  });

  it("comportamento: (aberturas + 2 × favoritos) ÷ 4, até 1; fora sem histórico", () => {
    const e = porSlug(base, "vila-menino-deus");
    const id = e.empreendimento.id;
    const comHist = avaliar(e, perfilCom({}), { ...ctx, historico: { aberturas: { [id]: 1 }, favoritos: [id] } })!;
    expect(comHist.componentes.find((c) => c.chave === "comportamento")!.valor).toBe(0.75);
    expect(avaliar(e, perfilCom({}), ctx)!.componentes.find((c) => c.chave === "comportamento")!.valor).toBeNull();
  });

  it("mesmo perfil, mesma nota e mesmos componentes", () => {
    expect(avaliarBase(base, perfilCompleto, ctx)).toEqual(avaliarBase(baseElegivel(completos(), { hoje: HOJE }), perfilCompleto, ctx));
  });

  it("imparcialidade: trocar comissão, destaque e incorporadora não muda nota nem ordem", () => {
    const antes = avaliarBase(base, perfilCompleto, ctx);

    const alterado = gerarSeed();
    for (const c of alterado.comerciais) c.comissaoPercentual = 30; // comissão
    for (const c of alterado.comerciais) c.escritorio = "plantao";
    const tenants = alterado.empreendimentos.map((e) => e.tenantId).reverse();
    alterado.empreendimentos.forEach((e, i) => (e.tenantId = tenants[i]!)); // incorporadora
    for (const i of alterado.incorporadoras) i.nomeComercial = `${i.nomeComercial} Patrocinada`;
    const depois = avaliarBase(baseElegivel(montarCompletos(alterado), { hoje: HOJE }), perfilCompleto, ctx);

    const resumo = (as: Avaliacao[]) => as.map((a) => [a.empreendimentoId, a.nota]);
    expect(resumo(depois)).toEqual(resumo(antes));
  });

  it("empate: sorteio fixo por perfil, estável e variável entre perfis", () => {
    const a = (id: string, semente: string): Avaliacao => ({ empreendimentoId: id, nota: 70, componentes: [], exigencia: null, unidadesCompativeis: 1, sorteio: sorteioFixo(semente, id) });
    const ordem = (semente: string) => [a("x", semente), a("y", semente), a("z", semente), a("w", semente)].sort(compararAvaliacoes).map((v) => v.empreendimentoId);
    expect(ordem("perfil-1")).toEqual(ordem("perfil-1"));
    const ordens = new Set(["perfil-1", "perfil-2", "perfil-3", "perfil-4", "perfil-5"].map((s) => ordem(s).join()));
    expect(ordens.size).toBeGreaterThan(1);
  });
});

const av = (id: string, nota: number | null): Avaliacao => ({ empreendimentoId: id, nota, componentes: [], exigencia: null, unidadesCompativeis: 1, sorteio: 0 });

describe("escolha de 2 a 3 opções (2.8)", () => {
  it("notas 88, 80 e 70: só as duas primeiras (terceira a 18 pontos)", () => {
    expect(escolher([av("a", 88), av("b", 80), av("c", 70)]).opcoes.map((o) => o.empreendimentoId)).toEqual(["a", "b"]);
  });

  it("terceira exatamente a 15 pontos entra; a 16 não", () => {
    expect(escolher([av("a", 85), av("b", 80), av("c", 70)]).opcoes).toHaveLength(3);
    expect(escolher([av("a", 86), av("b", 80), av("c", 70)]).opcoes).toHaveLength(2);
  });

  it("nota 50 entra; 49 não", () => {
    expect(escolher([av("a", 50)]).opcoes.map((o) => o.empreendimentoId)).toEqual(["a"]);
    expect(escolher([av("a", 60), av("b", 49)]).opcoes.map((o) => o.empreendimentoId)).toEqual(["a"]);
  });

  it("nenhuma acima do mínimo: diz isso em vez de forçar indicação", () => {
    expect(escolher([av("a", 49), av("b", 30), av("c", null)])).toEqual({ opcoes: [], nenhumaAcimaDoMinimo: true });
  });

  it("nunca mais de 3", () => {
    expect(escolher([av("a", 90), av("b", 90), av("c", 90), av("d", 90)]).opcoes).toHaveLength(3);
  });

  it("sobre o seed, um perfil completo recebe de 2 a 3 opções", () => {
    const { opcoes } = escolher(avaliarBase(base, perfilCompleto, ctx));
    expect(opcoes.length).toBeGreaterThanOrEqual(2);
    expect(opcoes.length).toBeLessThanOrEqual(3);
  });
});
