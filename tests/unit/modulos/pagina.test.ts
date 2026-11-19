import { describe, expect, it } from "vitest";
import {
  entradaMinima,
  escassezVisivel,
  fluxoDoPlano,
  fraseVizinhanca,
  lerModo,
  linkEmail,
  linkTelefone,
  linkWhatsapp,
  ordemDosBlocos,
  pontosPorCategoria,
  restamPorTipologia,
  tipologiaDeVenda,
  totalRestam,
  unidadePadrao,
  unidadesDeVenda,
  type PontoProximo,
} from "@/modulos/catalogo";
import { exigenciaDoPlano } from "@/modulos/busca";
import { ptBR } from "@/i18n/pt-BR";
import { gerarSeed } from "@/seed/seed";

const AGORA = new Date("2026-11-17T12:00:00-03:00");
const horasAtras = (h: number) => new Date(AGORA.getTime() - h * 3_600_000).toISOString();

describe("ordem dos blocos por modo", () => {
  it("Morar segue docs/specs/comprador.md", () => {
    expect(ordemDosBlocos("morar")).toEqual([
      "galeria", "resumo", "custos", "plantas", "vizinhanca", "numeros", "comodidades", "escritorio", "legais",
    ]);
  });

  it("Investir abre com resumo, números, custos, vizinhança e galeria, e o resto segue o Morar", () => {
    expect(ordemDosBlocos("investir")).toEqual([
      "resumo", "numeros", "custos", "vizinhanca", "galeria", "plantas", "comodidades", "escritorio", "legais",
    ]);
  });

  it("os dois modos têm os mesmos blocos", () => {
    expect([...ordemDosBlocos("morar")].sort()).toEqual([...ordemDosBlocos("investir")].sort());
  });

  it("lê o modo da URL; sem valor ou inválido, Morar", () => {
    expect(lerModo("investir")).toBe("investir");
    expect(lerModo("morar")).toBe("morar");
    for (const v of [undefined, "", "INVESTIR", "vender", ["investir", "morar"]]) expect(lerModo(v), String(v)).toBe("morar");
  });
});

describe("escassez (regra 10)", () => {
  it("aparece com o espelho de 23 h", () => expect(escassezVisivel(horasAtras(23), AGORA)).toBe(true));
  it("não aparece com 24 h, 30 h ou espelho nulo", () => {
    expect(escassezVisivel(horasAtras(24), AGORA)).toBe(false);
    expect(escassezVisivel(horasAtras(30), AGORA)).toBe(false);
    expect(escassezVisivel(null, AGORA)).toBe(false);
  });
  it("data no futuro ou inválida não vale", () => {
    expect(escassezVisivel(horasAtras(-1), AGORA)).toBe(false);
    expect(escassezVisivel("lixo", AGORA)).toBe(false);
  });

  const unidades = [
    { tipologiaId: "a", status: "disponivel" as const },
    { tipologiaId: "a", status: "reservada" as const },
    { tipologiaId: "a", status: "vendida" as const },
    { tipologiaId: "b", status: "disponivel" as const },
    { tipologiaId: "b", status: "disponivel" as const },
    ...Array.from({ length: 6 }, () => ({ tipologiaId: "c", status: "disponivel" as const })),
  ];

  it("conta só as disponíveis, com x entre 1 e 5, e só com o espelho fresco", () => {
    expect(restamPorTipologia(unidades, horasAtras(23), AGORA)).toEqual({ a: 1, b: 2 });
    expect(restamPorTipologia(unidades, horasAtras(24), AGORA)).toEqual({});
    expect(restamPorTipologia(unidades, null, AGORA)).toEqual({});
  });
});

describe("total do Restam no resumo", () => {
  const livres = (n: number) => Array.from({ length: n }, () => ({ status: "disponivel" as const }));

  it("só aparece de 1 a 5 disponíveis (a reservada não conta), como o Restam por tipologia", () => {
    expect(totalRestam(livres(1), horasAtras(1), AGORA)).toBe(1);
    expect(totalRestam(livres(5), horasAtras(1), AGORA)).toBe(5);
    expect(totalRestam(livres(6), horasAtras(1), AGORA)).toBeNull();
    expect(totalRestam([], horasAtras(1), AGORA)).toBeNull();
    expect(totalRestam([{ status: "reservada" }, { status: "vendida" }], horasAtras(1), AGORA)).toBeNull();
    expect(totalRestam([...livres(2), { status: "reservada" }], horasAtras(1), AGORA)).toBe(2);
  });

  it("sem espelho fresco, nunca aparece", () => {
    expect(totalRestam(livres(3), horasAtras(24), AGORA)).toBeNull();
    expect(totalRestam(livres(3), null, AGORA)).toBeNull();
  });

  it("o plural vem do catálogo", () => {
    expect(ptBR["empreendimento.resta_resumo"]).toBe("Resta {n} unidade");
    expect(ptBR["empreendimento.restam_resumo"]).toBe("Restam {n} unidades");
  });
});

describe("unidades de venda: só tipologia residencial à venda", () => {
  const tipologias: Array<{ id: string; tipo: string; finalidade: "venda" | "aluguel" | "venda_ou_aluguel" }> = [
    { id: "ap", tipo: "Apartamento", finalidade: "venda" },
    { id: "ap-alug", tipo: "Apartamento", finalidade: "aluguel" },
    { id: "ap-ambos", tipo: "Apartamento", finalidade: "venda_ou_aluguel" },
    { id: "loja", tipo: "Loja", finalidade: "venda" },
    { id: "lote", tipo: "Lote", finalidade: "venda" },
  ];
  const unidades = [
    { tipologiaId: "ap", status: "disponivel" as const, preco: 600000, identificador: "101" },
    { tipologiaId: "ap-alug", status: "disponivel" as const, preco: 1000, identificador: "102" },
    { tipologiaId: "ap-ambos", status: "disponivel" as const, preco: 650000, identificador: "103" },
    { tipologiaId: "loja", status: "disponivel" as const, preco: 420000, identificador: "L1" },
    { tipologiaId: "lote", status: "disponivel" as const, preco: 300000, identificador: "T1" },
  ];

  it("tipologiaDeVenda recusa comercial, terreno e só aluguel", () => {
    expect(tipologias.filter(tipologiaDeVenda).map((t) => t.id)).toEqual(["ap", "ap-ambos"]);
  });

  it("a loja barata não vira unidade padrão nem puxa a entrada mínima", () => {
    const deVenda = unidadesDeVenda(unidades, tipologias);
    expect(deVenda.map((u) => u.identificador)).toEqual(["101", "103"]);
    expect(unidadePadrao(unidades)?.identificador).toBe("102");
    expect(unidadePadrao(deVenda)?.identificador).toBe("101");
    expect(entradaMinima(unidades, [{ sinalPercentual: 15 }])).toBe(150);
    expect(entradaMinima(deVenda, [{ sinalPercentual: 15 }])).toBe(90000);
  });
});

describe("custos", () => {
  const plano = { sinalPercentual: 10, mensaisPercentual: 20, numeroParcelas: 36, intercaladasPercentual: 10, chavesPercentual: 10, saldoPercentual: 50 };

  it("calcula cada parte do plano em centavos", () => {
    const f = fluxoDoPlano({ preco: 690000 }, plano);
    expect(f).toMatchObject({ sinal: 69000, mensais: 138000, parcela: 3833.33, intercaladas: 69000, chaves: 69000, saldo: 345000, entrada: 69000 });
  });

  it("sem número de parcelas, a parcela é nula", () => {
    expect(fluxoDoPlano({ preco: 600000 }, { ...plano, numeroParcelas: null }).parcela).toBeNull();
  });

  it("é igual à exigência da busca, para todas as unidades e planos do seed", () => {
    const seed = gerarSeed();
    for (const u of seed.unidades) {
      for (const p of seed.planos.filter((x) => x.empreendimentoId === u.empreendimentoId)) {
        const ex = exigenciaDoPlano(u, p, false);
        const f = fluxoDoPlano(u, p);
        expect(f.entrada, `${u.id}/${p.id}`).toBe(ex.entrada);
        expect(f.parcela, `${u.id}/${p.id}`).toBe(ex.parcela);
      }
    }
  });

  it("unidade padrão: a disponível de menor preço; sem disponível, nula", () => {
    const lista = [
      { identificador: "301", status: "disponivel" as const, preco: 700 },
      { identificador: "201", status: "disponivel" as const, preco: 600 },
      { identificador: "101", status: "reservada" as const, preco: 500 },
    ];
    expect(unidadePadrao(lista)?.identificador).toBe("201");
    expect(unidadePadrao(lista.filter((u) => u.status !== "disponivel"))).toBeNull();
  });

  it("entrada mínima: o menor sinal entre as disponíveis e os planos", () => {
    const unidades = [
      { status: "disponivel" as const, preco: 600000 },
      { status: "vendida" as const, preco: 100000 },
    ];
    expect(entradaMinima(unidades, [{ sinalPercentual: 20 }, { sinalPercentual: 10 }])).toBe(60000);
    expect(entradaMinima(unidades, [])).toBeNull();
    expect(entradaMinima([{ status: "vendida", preco: 1 }], [{ sinalPercentual: 10 }])).toBeNull();
  });
});

describe("vizinhança", () => {
  const pontos: PontoProximo[] = [
    { categoria: "parque", nome: "Parque A", distanciaM: 800 },
    { categoria: "escola", nome: "Escola Longe", distanciaM: 900 },
    { categoria: "escola", nome: "Escola Perto", distanciaM: 480 },
    { categoria: "mercado", nome: "Mercado", distanciaM: 81 },
  ];

  it("traz as 6 categorias na ordem fixa, com o ponto mais próximo e os minutos a pé (80 m/min)", () => {
    const r = pontosPorCategoria(pontos);
    expect(r.map((c) => c.categoria)).toEqual(["escola", "parque", "hospital", "academia", "mercado", "transporte"]);
    expect(r[0]?.ponto).toMatchObject({ nome: "Escola Perto", minutos: 6 });
    expect(r[1]?.ponto?.minutos).toBe(10);
    expect(r[2]?.ponto).toBeNull();
    expect(r[4]?.ponto?.minutos).toBe(2);
  });

  it("a frase usa as 2 primeiras categorias com dado", () => {
    expect(fraseVizinhanca(pontos)).toEqual([
      { categoria: "escola", minutos: 6 },
      { categoria: "parque", minutos: 10 },
    ]);
    expect(fraseVizinhanca(pontos.filter((p) => p.categoria !== "escola"))).toEqual([
      { categoria: "parque", minutos: 10 },
      { categoria: "mercado", minutos: 2 },
    ]);
    expect(fraseVizinhanca([])).toEqual([]);
  });
});

describe("contato do escritório", () => {
  it("monta wa.me com a mensagem pronta, mailto e tel", () => {
    expect(linkWhatsapp("+55 51 90000-0100", "Olá! Vi o Edifício X.")).toBe("https://wa.me/5551900000100?text=Ol%C3%A1!%20Vi%20o%20Edif%C3%ADcio%20X.");
    expect(linkEmail("a@exemplo.invalid")).toBe("mailto:a@exemplo.invalid");
    expect(linkTelefone("+555130000100")).toBe("tel:+555130000100");
  });
});

describe("catálogo da página", () => {
  it("não tem palavra proibida, nome de índice nem CRECI", () => {
    const textos = Object.entries(ptBR).filter(([k]) => k.startsWith("empreendimento.") || k.startsWith("comodidade."));
    expect(textos.length).toBeGreaterThan(20);
    for (const [k, v] of textos) {
      expect(v, k).not.toMatch(/oportunidade imperdível|garantid|lucro certo|últimas unidades|INCC|IGP|IPCA|Selic|CRECI/i);
    }
  });

  it("todo id de comodidade do seed tem texto no catálogo", () => {
    for (const c of gerarSeed().comodidades) expect(ptBR, c.id).toHaveProperty(`comodidade.${c.id}`);
  });
});
