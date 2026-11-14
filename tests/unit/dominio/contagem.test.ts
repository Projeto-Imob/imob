import { describe, expect, it } from "vitest";
import {
  PERTO_DE_MIM,
  ampliar,
  bairrosDaBase,
  bairrosVizinhos,
  contar,
  contarOpcao,
  contarOpcoes,
  deveSugerirAmpliar,
} from "@/dominio/contagem";
import { baseElegivel } from "@/dominio/elegibilidade";
import type { ContextoBusca } from "@/dominio/filtros";
import { HOJE, completos, perfilCom } from "./apoio";

const todos = completos();
const base = baseElegivel(todos, { hoje: HOJE });
const ctx: ContextoBusca = { hoje: HOJE };

describe("contagem total (2.6)", () => {
  it("conta a base elegível inteira com perfil vazio e ignora excluídos", () => {
    expect(contar(base, perfilCom({}), ctx)).toBe(6);
  });

  it("Quero receber agora reduz ao número de prontos para morar", () => {
    expect(contar(base, perfilCom({ prazo: "agora" }), ctx)).toBe(2);
  });
});

describe("contagem por opção", () => {
  it("em pergunta ou, considera só aquela opção (ignora as outras já marcadas)", () => {
    const perfil = perfilCom({ quartos: ["studio"] });
    expect(contarOpcao(base, perfil, "quartos", "2", ctx)).toBe(3);
    expect(contarOpcao(base, perfil, "quartos", "4+", ctx)).toBe(2);
  });

  it("em requisitos (e), soma a opção às já marcadas", () => {
    const perfil = perfilCom({ requisitos: { chips: ["piscina"], textoLivre: null } });
    const soPiscina = contar(base, perfil, ctx);
    const piscinaEAcademia = contarOpcao(base, perfil, "requisitos", "academia", ctx);
    expect(piscinaEAcademia).toBeLessThan(soPiscina);
    expect(piscinaEAcademia).toBe(contar(base, perfilCom({ requisitos: { chips: ["piscina", "academia"], textoLivre: null } }), ctx));
  });

  it("regra do zero: opção sem resultado fica desabilitada", () => {
    // Nenhum elegível pronto para morar tem studio.
    const r = contarOpcoes(base, perfilCom({ prazo: "agora" }), "quartos", ["studio", "1", "2", "3", "4+"], ctx);
    expect(r.find((o) => o.opcao === "studio")).toEqual({ opcao: "studio", contagem: 0, desabilitada: true });
    expect(r.find((o) => o.opcao === "2")?.desabilitada).toBe(false);
  });

  it("Perto de mim sem posição não é contado nem desabilitado", () => {
    const [o] = contarOpcoes(base, perfilCom({}), "regiao", [PERTO_DE_MIM], ctx);
    expect(o).toEqual({ opcao: PERTO_DE_MIM, contagem: null, desabilitada: false });
    expect(contarOpcao(base, perfilCom({}), "regiao", PERTO_DE_MIM, { hoje: HOJE, posicao: { lat: -30.1095, lng: -51.254 } })).toBe(1);
  });

  it("opções de região são os bairros da base elegível", () => {
    expect(bairrosDaBase(base)).toEqual(["Bela Vista", "Cidade Baixa", "Menino Deus", "Moinhos de Vento", "Petrópolis", "Tristeza"]);
  });
});

describe("ampliação", () => {
  it("sugere ampliar com menos de 3", () => {
    expect(deveSugerirAmpliar(2)).toBe(true);
    expect(deveSugerirAmpliar(3)).toBe(false);
  });

  it("na região, inclui bairros da base a até 3,5 km de algum empreendimento dos escolhidos", () => {
    const vizinhos = bairrosVizinhos(base, ["Petrópolis"]);
    expect(vizinhos).toContain("Bela Vista");
    expect(vizinhos).not.toContain("Tristeza");
    expect(vizinhos).not.toContain("Petrópolis");
    // Excluídos da base (ex.: Três Figueiras em pré-lançamento) não viram vizinhos.
    expect(vizinhos).not.toContain("Três Figueiras");

    const perfil = perfilCom({ regiao: { bairros: ["Petrópolis"], bairrosVizinhos: [], pertoDeMim: false } });
    const antes = contar(base, perfil, ctx);
    const ampliado = ampliar("regiao", perfil, base);
    expect(ampliado.regiao.bairros).toEqual(["Petrópolis"]);
    expect(contar(base, ampliado, ctx)).toBeGreaterThan(antes);
  });

  it.each([
    ["prazo", perfilCom({ prazo: "agora" }), (p: ReturnType<typeof perfilCom>) => p.prazo === "posso_esperar"],
    ["quartos", perfilCom({ quartos: ["4+"] }), (p: ReturnType<typeof perfilCom>) => p.quartos.length === 0],
    [
      "pagamento",
      perfilCom({ pagamento: { formas: ["fgts"], entrada: 10, parcelaMaxima: 10 } }),
      (p: ReturnType<typeof perfilCom>) => p.pagamento.entrada === null && p.pagamento.parcelaMaxima === null && p.pagamento.formas[0] === "fgts",
    ],
    ["permuta", perfilCom({ permuta: "sim" }), (p: ReturnType<typeof perfilCom>) => p.permuta === "nao"],
    [
      "requisitos",
      perfilCom({ requisitos: { chips: ["piscina"], textoLivre: "pet" } }),
      (p: ReturnType<typeof perfilCom>) => p.requisitos.chips.length === 0 && p.requisitos.textoLivre === "pet",
    ],
  ] as const)("ampliar %s relaxa o filtro conforme a especificação", (pergunta, perfil, conferir) => {
    const ampliado = ampliar(pergunta, perfil, base);
    expect(conferir(ampliado)).toBe(true);
    expect(contar(base, ampliado, ctx)).toBeGreaterThanOrEqual(contar(base, perfil, ctx));
  });

  it("não altera o perfil original", () => {
    const perfil = perfilCom({ prazo: "agora" });
    ampliar("prazo", perfil, base);
    expect(perfil.prazo).toBe("agora");
  });
});
