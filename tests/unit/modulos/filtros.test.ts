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
    expect(passam(perfilCom({ quartos: ["studio"] }))).toEqual(["studio-cidade-baixa"]);
    expect(passam(perfilCom({ quartos: ["1"] }))).toEqual(["edificio-mirante-petropolis"]);
    expect(passam(perfilCom({ quartos: ["4+"] }))).toEqual(["bela-vista-prime", "recanto-da-tristeza"]);
    expect(passam(perfilCom({ quartos: ["1", "studio"] }))).toEqual(["edificio-mirante-petropolis", "studio-cidade-baixa"]);
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
