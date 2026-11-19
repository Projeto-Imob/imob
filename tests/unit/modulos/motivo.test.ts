import { describe, expect, it } from "vitest";
import {
  LIMITE_MOTIVO,
  avaliar,
  avaliarBase,
  extrairRequisitos,
  motivoPorTemplate,
  type Avaliacao,
  type ContextoNota,
  type Perfil,
} from "@/modulos/busca";
import { baseElegivel } from "@/modulos/catalogo";
import { HOJE, comEmpreendimento, completos, perfilCom, porSlug, seed } from "./apoio";

const base = baseElegivel(completos(), { hoje: HOJE });
const ctx: ContextoNota = { hoje: HOJE, sementePerfil: "p", comodidades: seed.comodidades };

const PERFIS: Perfil[] = [
  perfilCom({}),
  perfilCom({ quartos: ["2"] }),
  perfilCom({ quartos: ["3", "4+"], regiao: { bairros: ["Tristeza"], bairrosVizinhos: [], pertoDeMim: false } }),
  perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: 200000, parcelaMaxima: 8000 }, permuta: "sim" }),
  perfilCom({ requisitos: { chips: ["piscina"], textoLivre: "quero varanda gourmet e pet place" } }),
  perfilCom({ pagamento: { formas: ["a_vista"], entrada: 2000000, parcelaMaxima: null }, quartos: ["1", "studio"] }),
];

/** Todo número do motivo precisa estar dentro de um valor interpolado pelo sistema. */
function numerosForaDosValores(texto: string, valores: string[]): string[] {
  return [...texto.matchAll(/\d[\d.,]*/g)].map((m) => m[0].replace(/[.,]$/, "")).filter((n) => !valores.some((v) => v.includes(n)));
}

describe("motivo por template (2.9)", () => {
  const casos = PERFIS.flatMap((perfil) =>
    avaliarBase(base, perfil, ctx).map((a) => ({ a, e: base.find((e) => e.empreendimento.id === a.empreendimentoId)! })),
  );

  it("há casos suficientes para o teste", () => {
    expect(casos.length).toBeGreaterThan(15);
  });

  it("nenhum motivo passa de 140 caracteres", () => {
    for (const { a, e } of casos) expect(motivoPorTemplate(a, e).texto.length).toBeLessThanOrEqual(LIMITE_MOTIVO);
  });

  it("nenhum motivo traz número que não venha do cadastro ou da conta", () => {
    for (const { a, e } of casos) {
      const m = motivoPorTemplate(a, e);
      expect(numerosForaDosValores(m.texto, m.valores)).toEqual([]);
    }
  });

  it("usa o componente de maior peso × nota e junta o segundo se couber", () => {
    const e = porSlug(base, "vila-menino-deus");
    const a = avaliar(e, perfilCom({ quartos: ["2"], pagamento: { formas: ["direto_construtora"], entrada: 200000, parcelaMaxima: null } }), ctx)!;
    const m = motivoPorTemplate(a, e);
    const ordem = a.componentes.filter((c) => c.valor).sort((x, y) => y.peso * y.valor! - x.peso * x.valor!).map((c) => c.chave);
    expect(m.componentes[0]).toBe(ordem[0]);
    expect(m.componentes).toHaveLength(2);
  });

  it("quando a junção passa de 140, usa só a primeira frase", () => {
    const e = porSlug(base, "vila-menino-deus");
    const a = avaliar(e, perfilCom({ quartos: ["2"] }), ctx)!;
    const longa = "x".repeat(100);
    const m = motivoPorTemplate(a, e, { "motivo.tipologia": `${longa} {n}.`, "motivo.localizacao.pontos": `${longa} {minutos} {ponto}.` });
    expect(m.componentes).toHaveLength(1);
    expect(m.texto.length).toBeLessThanOrEqual(LIMITE_MOTIVO);
  });

  it("marcador sem valor tira a frase inteira, sem marcador aparente", () => {
    const e = comEmpreendimento(porSlug(base, "vila-menino-deus"), { pontosProximos: [] });
    const a: Avaliacao = {
      empreendimentoId: e.empreendimento.id,
      nota: 80,
      exigencia: null,
      unidadesCompativeis: 1,
      sorteio: 0,
      componentes: [
        { chave: "localizacao", peso: 0.2, valor: 1, detalhe: { regiao: null, pontos: 1 } }, // sem ponto: frase sai
        { chave: "requisitos", peso: 0.1, valor: 0.5, detalhe: { atendidos: 1, pedidos: 2 } },
      ],
    };
    const m = motivoPorTemplate(a, e);
    expect(m.componentes).toEqual(["requisitos"]);
    expect(m.texto).not.toMatch(/[{}]/);
  });

  it("sem componente com dado, usa a frase padrão da especificação", () => {
    const e = porSlug(base, "vila-menino-deus");
    const a: Avaliacao = { empreendimentoId: e.empreendimento.id, nota: null, componentes: [], exigencia: null, unidadesCompativeis: 1, sorteio: 0 };
    expect(motivoPorTemplate(a, e).texto).toBe("Vila Menino Deus fica em Menino Deus e tem unidade disponível no seu perfil.");
  });

  it("frase padrão com nome longo é encurtada para 140", () => {
    const e = comEmpreendimento(porSlug(base, "vila-menino-deus"), { nome: "N".repeat(200) });
    const a: Avaliacao = { empreendimentoId: e.empreendimento.id, nota: null, componentes: [], exigencia: null, unidadesCompativeis: 1, sorteio: 0 };
    expect(motivoPorTemplate(a, e).texto.length).toBeLessThanOrEqual(LIMITE_MOTIVO);
  });
});

describe("motivo fiel ao que a pessoa informou (A4)", () => {
  const motivoDe = (slug: string, perfil: Perfil, extra: Partial<ContextoNota> = {}) => {
    const e = porSlug(base, slug);
    const av = avaliar(e, perfil, { ...ctx, ...extra })!;
    return { m: motivoPorTemplate(av, e), av, e };
  };
  const SEM_ENTRADA = { formas: [] as Perfil["pagamento"]["formas"], entrada: null, parcelaMaxima: null };

  it("financeiro: entrada informada usa o modelo da entrada", () => {
    const { m } = motivoDe("vila-menino-deus", perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: 200000, parcelaMaxima: null } }));
    expect(m.texto.startsWith("A entrada de R")).toBe(true);
  });

  it("financeiro: só a parcela informada usa o modelo da parcela, nunca o da entrada", () => {
    const { m, av } = motivoDe("vila-menino-deus", perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: null, parcelaMaxima: 8000 } }));
    expect(av.componentes.find((c) => c.chave === "financeiro")!.valor).not.toBeNull();
    expect(m.texto.startsWith("A parcela de R")).toBe(true);
    expect(m.texto).not.toMatch(/entrada/i);
  });

  it("localização: escolhido, vizinho e perto de mim usam cada um o seu modelo", () => {
    const regiao = (bairros: string[], vizinhos: string[], perto = false) =>
      perfilCom({ pagamento: { ...SEM_ENTRADA }, regiao: { bairros, bairrosVizinhos: vizinhos, pertoDeMim: perto } });
    const escolhido = motivoDe("bela-vista-prime", regiao(["Bela Vista"], []));
    expect(escolhido.av.componentes.find((c) => c.chave === "localizacao")!.detalhe.origemRegiao).toBe("escolhido");
    expect(escolhido.m.texto).toBe("Fica em Bela Vista, na região que você escolheu.");
    expect(motivoDe("bela-vista-prime", regiao(["Petrópolis"], ["Bela Vista"])).m.texto).toBe(
      "Fica em Bela Vista, vizinho aos bairros que você escolheu.",
    );
    const perto = motivoDe("recanto-da-tristeza", regiao([], [], true), { posicao: { lat: -30.1095, lng: -51.254 } });
    expect(perto.m.texto).toContain("Fica em Tristeza, perto de você.");
  });

  it("comportamento: favoritou, só viu e o modelo sem histórico", () => {
    const e = porSlug(base, "vila-menino-deus");
    const id = e.empreendimento.id;
    const perfil = perfilCom({ pagamento: { ...SEM_ENTRADA } });
    const texto = (historico: ContextoNota["historico"]) => {
      const av = avaliar(e, perfil, { ...ctx, historico })!;
      return motivoPorTemplate(av, e).texto;
    };
    expect(texto({ aberturas: {}, favoritos: [id] })).toContain("Você favoritou este empreendimento.");
    expect(texto({ aberturas: { [id]: 2 }, favoritos: [] })).toContain("Você já viu este empreendimento.");
    expect(texto({ aberturas: { [id]: 2 }, favoritos: [id] })).toContain("Você favoritou este empreendimento.");
    expect(texto(undefined)).not.toMatch(/viu|favoritou/);
  });

  it("varredura: sem entrada informada, o modelo da entrada nunca aparece", () => {
    const semEntrada = [
      perfilCom({}),
      perfilCom({ quartos: ["2"] }),
      perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: null, parcelaMaxima: 8000 } }),
      perfilCom({ pagamento: { formas: ["a_vista"], entrada: 0, parcelaMaxima: 5000 }, permuta: "sim" }),
      perfilCom({ regiao: { bairros: ["Tristeza"], bairrosVizinhos: ["Bela Vista"], pertoDeMim: false } }),
    ];
    let n = 0;
    for (const perfil of semEntrada) {
      for (const av of avaliarBase(base, perfil, ctx)) {
        const e = base.find((x) => x.empreendimento.id === av.empreendimentoId)!;
        expect(motivoPorTemplate(av, e).texto, perfil.pagamento.formas.join()).not.toMatch(/A entrada de/);
        n++;
      }
    }
    expect(n).toBeGreaterThan(10);
  });
});

describe("requisitos por palavras-chave (IA desligada)", () => {
  it("reconhece itens do catálogo no texto livre", () => {
    expect(extrairRequisitos("quero varanda gourmet e pet place", seed.comodidades)).toEqual(["pet_place", "varanda_gourmet"]);
  });

  it("ignora acento, caixa e pontuação", () => {
    expect(extrairRequisitos("PISCINA, Salão de Festas; bicicletário!", seed.comodidades)).toEqual(["piscina", "salao_festas", "bicicletario"]);
  });

  it("não confunde palavras parecidas e aceita texto vazio", () => {
    expect(extrairRequisitos("academiazinha", seed.comodidades)).toEqual([]);
    expect(extrairRequisitos(null, seed.comodidades)).toEqual([]);
  });
});
