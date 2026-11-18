import { describe, expect, it } from "vitest";
import { filtrar, tipologiaAtende, unidadesCompativeis, type ContextoBusca, type Perfil } from "@/modulos/busca";
import { baseElegivel, type Tipologia } from "@/modulos/catalogo";
import { HOJE, comEmpreendimento, completos, perfilCom, porSlug } from "./apoio";

const base = baseElegivel(completos(), { hoje: HOJE });
const ctx: ContextoBusca = { hoje: HOJE };
const passam = (perfil: Perfil, c: ContextoBusca = ctx) =>
  base
    .filter((e) => filtrar(e, perfil, c).passa)
    .map((e) => e.empreendimento.slug)
    .sort();

describe("filtros do questionário (2.4)", () => {
  it("perfil vazio não filtra a base elegível", () => {
    expect(passam(perfilCom({}))).toHaveLength(6);
  });

  it("prazo agora deixa só pronto para morar (status pronto ou entrega vencida)", () => {
    expect(passam(perfilCom({ prazo: "agora" }))).toEqual(["recanto-da-tristeza", "residencial-jardim-das-aguas"]);
    // Bela Vista entrega em 2026-12-10: a partir dessa data conta como pronto para morar.
    expect(passam(perfilCom({ prazo: "agora" }), { hoje: "2026-12-10" })).toContain("bela-vista-prime");
  });

  it("prazo posso esperar não filtra", () => {
    expect(passam(perfilCom({ prazo: "posso_esperar" }))).toHaveLength(6);
  });

  it("quartos: unidade disponível com aqueles quartos; studio separado de 1 quarto", () => {
    // Bela Vista Prime tem um Loft de 1 dormitório, que é studio.
    expect(passam(perfilCom({ quartos: ["studio"] }))).toEqual(["bela-vista-prime", "studio-cidade-baixa"]);
    expect(passam(perfilCom({ quartos: ["1"] }))).toEqual(["edificio-mirante-petropolis"]);
    expect(passam(perfilCom({ quartos: ["4+"] }))).toEqual(["bela-vista-prime", "recanto-da-tristeza"]);
    expect(passam(perfilCom({ quartos: ["1", "studio"] }))).toEqual(["bela-vista-prime", "edificio-mirante-petropolis", "studio-cidade-baixa"]);
  });

  it("torre que o público não vê não entra: 4+ sem Vila Menino Deus e 3 sem Mirante (A1)", () => {
    expect(passam(perfilCom({ quartos: ["4+"] }))).not.toContain("vila-menino-deus");
    expect(passam(perfilCom({ quartos: ["3"] }))).not.toContain("edificio-mirante-petropolis");
    const vila = porSlug(base, "vila-menino-deus");
    const futura = vila.subcondominios.find((s) => s.dataLancamento !== null && s.dataLancamento > HOJE)!;
    expect(unidadesCompativeis(vila, perfilCom({}), HOJE).some((u) => u.subcondominioId === futura.id)).toBe(false);
    // Com o pré-lançamento ligado a torre passa a contar.
    const ligado = comEmpreendimento(vila, { preLancamentoAtivo: true });
    expect(unidadesCompativeis(ligado, perfilCom({ quartos: ["4+"] }), HOJE).some((u) => u.subcondominioId === futura.id)).toBe(true);
  });

  it("Loft só aparece em studio, nunca em 1 quarto (A2)", () => {
    const bela = porSlug(base, "bela-vista-prime");
    const loft = (p: Partial<Perfil>) =>
      unidadesCompativeis(bela, perfilCom(p), HOJE).some((u) => bela.tipologias.find((t) => t.id === u.tipologiaId)!.tipo === "Loft");
    expect(loft({ quartos: ["studio"] })).toBe(true);
    expect(loft({ quartos: ["1"] })).toBe(false);
    expect(passam(perfilCom({ quartos: ["1"] }))).not.toContain("bela-vista-prime");
  });

  it("Loja, Lote e aluguel ficam fora, mesmo sem filtro de quartos (A2)", () => {
    const tristeza = porSlug(base, "recanto-da-tristeza");
    const tipos = (e: typeof tristeza) =>
      new Set(unidadesCompativeis(e, perfilCom({}), HOJE).map((u) => e.tipologias.find((t) => t.id === u.tipologiaId)!.tipo));
    expect(tipos(tristeza).has("Loja")).toBe(false);
    expect(tristeza.tipologias.some((t) => t.tipo === "Loja")).toBe(true);
    const lote = structuredClone(tristeza);
    lote.tipologias.forEach((t) => (t.tipo = "Lote"));
    expect(unidadesCompativeis(lote, perfilCom({}), HOJE)).toEqual([]);
    const aluguel = structuredClone(tristeza);
    aluguel.tipologias.forEach((t) => (t.finalidade = "aluguel"));
    expect(unidadesCompativeis(aluguel, perfilCom({}), HOJE)).toEqual([]);
    const mista = structuredClone(tristeza);
    mista.tipologias.forEach((t) => (t.finalidade = "venda_ou_aluguel"));
    expect(unidadesCompativeis(mista, perfilCom({}), HOJE).length).toBeGreaterThan(0);
  });

  it("Kitnet não é studio e só entra sem filtro de quartos (A2, Proposta)", () => {
    const kitnet = { tipo: "Kitnet", dormitorios: 0 } as Tipologia;
    expect(tipologiaAtende(kitnet, ["studio"])).toBe(false);
    expect(tipologiaAtende(kitnet, ["1"])).toBe(false);
    expect(tipologiaAtende(kitnet, [])).toBe(true);
    expect(tipologiaAtende({ tipo: "Loft", dormitorios: 1 } as Tipologia, ["studio"])).toBe(true);
    expect(tipologiaAtende({ tipo: "Loft", dormitorios: 1 } as Tipologia, ["1"])).toBe(false);
  });

  it("4 ou mais aceita 5 dormitórios", () => {
    const t = { tipo: "Apartamento", dormitorios: 5 } as Tipologia;
    expect(tipologiaAtende(t, ["4+"])).toBe(true);
    expect(tipologiaAtende(t, ["3"])).toBe(false);
  });

  it("unidade reservada ou vendida não é compatível", () => {
    const e = porSlug(base, "residencial-jardim-das-aguas");
    const compat = unidadesCompativeis(e, perfilCom({}), HOJE);
    expect(compat.every((u) => u.status === "disponivel")).toBe(true);
    expect(compat.length).toBeLessThan(e.unidades.length);
  });

  it("região por bairro e por bairro vizinho acrescentado; vazia não filtra", () => {
    expect(passam(perfilCom({ regiao: { bairros: ["Petrópolis"], bairrosVizinhos: [], pertoDeMim: false } }))).toEqual([
      "edificio-mirante-petropolis",
    ]);
    expect(
      passam(perfilCom({ regiao: { bairros: ["Petrópolis"], bairrosVizinhos: ["Bela Vista"], pertoDeMim: false } })),
    ).toEqual(["bela-vista-prime", "edificio-mirante-petropolis"]);
  });

  it("Perto de mim filtra por raio de 5 km com posição e não filtra sem posição", () => {
    const perfil = perfilCom({ regiao: { bairros: [], bairrosVizinhos: [], pertoDeMim: true } });
    const tristeza = { lat: -30.1095, lng: -51.254 };
    expect(passam(perfil, { hoje: HOJE, posicao: tristeza })).toEqual(["recanto-da-tristeza"]);
    expect(passam(perfil, { hoje: HOJE, posicao: null })).toHaveLength(6);
  });

  it("permuta sim deixa só quem aceita permuta", () => {
    expect(passam(perfilCom({ permuta: "sim" }))).toEqual([
      "recanto-da-tristeza",
      "residencial-jardim-das-aguas",
      "vila-menino-deus",
    ]);
    expect(passam(perfilCom({ permuta: "nao" }))).toHaveLength(6);
  });

  it("comodidades: precisa ter todas; quem não tem o dado cadastrado não é filtrado", () => {
    const r = passam(perfilCom({ requisitos: { chips: ["piscina", "academia"], textoLivre: null } }));
    // Studio Cidade Baixa não tem comodidades cadastradas (nulo) e por isso não é filtrado.
    expect(r).toEqual(["bela-vista-prime", "residencial-jardim-das-aguas", "studio-cidade-baixa"]);
    const semDado = comEmpreendimento(porSlug(base, "edificio-mirante-petropolis"), { comodidades: null });
    expect(filtrar(semDado, perfilCom({ requisitos: { chips: ["piscina"], textoLivre: null } }), ctx).passa).toBe(true);
  });

  it("texto livre dos requisitos não filtra", () => {
    expect(passam(perfilCom({ requisitos: { chips: [], textoLivre: "quero piscina" } }))).toHaveLength(6);
  });

  it("pagamento: entrada e parcela compatíveis", () => {
    const perfil = perfilCom({ pagamento: { formas: ["direto_construtora"], entrada: 45000, parcelaMaxima: 3500 } });
    for (const e of base) {
      const r = filtrar(e, perfil, ctx);
      if (r.passa) {
        expect(r.exigencia!.entrada).toBeLessThanOrEqual(45000);
        expect(r.exigencia!.parcela).not.toBeNull();
        expect(r.exigencia!.parcela!).toBeLessThanOrEqual(3500);
      }
    }
    const resultado = passam(perfil);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.length).toBeLessThan(6);
  });
});
