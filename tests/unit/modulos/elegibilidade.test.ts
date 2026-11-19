import { describe, expect, it } from "vitest";
import { baseElegivel, elegivel, emStandBy, esgotado, faseVenda, motivosExclusao, subcondominioVisivel } from "@/modulos/catalogo";
import { CASOS_EXCLUSAO } from "@/seed/seed";
import { HOJE, comEmpreendimento, completos, porSlug } from "./apoio";

const todos = completos();
const ctx = { hoje: HOJE };
const elegivelBase = porSlug(todos, "residencial-jardim-das-aguas");

describe("elegibilidade da base (2.3)", () => {
  it("a base do seed tem os 6 empreendimentos elegíveis", () => {
    expect(baseElegivel(todos, ctx).map((e) => e.empreendimento.slug).sort()).toEqual(
      ["bela-vista-prime", "edificio-mirante-petropolis", "recanto-da-tristeza", "residencial-jardim-das-aguas", "studio-cidade-baixa", "vila-menino-deus"].sort(),
    );
  });

  it.each([
    ["sem R.I.", CASOS_EXCLUSAO.semRI, "sem_ri"],
    ["esgotado", CASOS_EXCLUSAO.esgotado, "esgotado"],
    ["pré-lançamento", CASOS_EXCLUSAO.preLancamento, "pre_lancamento"],
    ["exclusivo", CASOS_EXCLUSAO.exclusivo, "exclusivo"],
    ["não listado", CASOS_EXCLUSAO.naoListado, "nao_listado"],
  ])("exclui o caso %s do seed", (_, slug, motivo) => {
    const e = porSlug(todos, slug);
    expect(elegivel(e, ctx)).toBe(false);
    expect(motivosExclusao(e, ctx)).toContain(motivo);
  });

  it("exclui publicado sem R.I. (mesmo que o banco já recuse publicar)", () => {
    expect(motivosExclusao(comEmpreendimento(elegivelBase, { ri: null }), ctx)).toEqual(["sem_ri"]);
  });

  it("exclui rascunho", () => {
    expect(motivosExclusao(comEmpreendimento(elegivelBase, { publicacao: "rascunho" }), ctx)).toEqual(["rascunho"]);
  });

  it("exclui sem aprovação da curadoria", () => {
    expect(motivosExclusao(comEmpreendimento(elegivelBase, { curadoriaAprovada: false }), ctx)).toEqual(["sem_curadoria"]);
  });

  it("lead de campanha só vê a incorporadora da campanha", () => {
    const outra = "00000000-0000-4000-8999-000000000001";
    expect(motivosExclusao(elegivelBase, { hoje: HOJE, campanhaTenantId: outra })).toEqual(["fora_da_campanha"]);
    expect(elegivel(elegivelBase, { hoje: HOJE, campanhaTenantId: elegivelBase.empreendimento.tenantId })).toBe(true);
  });

  it("fase de venda é calculada pela data de lançamento e pelos subcondomínios", () => {
    expect(faseVenda(porSlug(todos, CASOS_EXCLUSAO.preLancamento), HOJE)).toBe("pre_lancamento");
    expect(faseVenda(porSlug(todos, CASOS_EXCLUSAO.esgotado), HOJE)).toBe("esgotado");
    expect(faseVenda(elegivelBase, HOJE)).toBe("vendas_abertas");
    // O pré-lançamento passa a vendas abertas quando a data chega, sem edição manual.
    expect(faseVenda(porSlug(todos, CASOS_EXCLUSAO.preLancamento), "2030-03-01")).toBe("vendas_abertas");
  });

  it("último subcondomínio vendido torna o empreendimento esgotado sem campo manual", () => {
    const e = structuredClone(elegivelBase);
    for (const u of e.unidades) u.status = "vendida";
    expect(faseVenda(e, HOJE)).toBe("esgotado");
    expect(motivosExclusao(e, ctx)).toEqual(["esgotado"]);
  });

  it("pré-lançamento ativado (com consentimento) sai do stand-by", () => {
    const pre = comEmpreendimento(porSlug(todos, CASOS_EXCLUSAO.preLancamento), { preLancamentoAtivo: true });
    expect(motivosExclusao(pre, ctx)).toEqual([]);
  });

  describe("paridade com o banco (A1, regra 11)", () => {
    const comTorreSemData = (e: typeof elegivelBase) => {
      const c = structuredClone(e);
      c.subcondominios = c.subcondominios.map((s) => ({ ...s, dataLancamento: null }));
      return c;
    };

    it("torre sem data de lançamento continua em stand-by, não conta como lançada", () => {
      const e = comTorreSemData(elegivelBase);
      expect(emStandBy(e, HOJE)).toBe(true);
      expect(faseVenda(e, HOJE)).toBe("pre_lancamento");
      expect(motivosExclusao(e, ctx)).toEqual(["pre_lancamento"]);
      expect(subcondominioVisivel(e.subcondominios[0]!, e, HOJE)).toBe(false);
    });

    it("torre sem data ao lado de torre lançada não tira o empreendimento do ar", () => {
      const e = porSlug(todos, "edificio-mirante-petropolis");
      expect(e.subcondominios.some((s) => s.dataLancamento === null)).toBe(true);
      expect(emStandBy(e, HOJE)).toBe(false);
      expect(elegivel(e, ctx)).toBe(true);
    });

    it("esgotado olha só as torres visíveis: lançada vendida e torre futura livre é esgotado", () => {
      const e = structuredClone(porSlug(todos, "vila-menino-deus"));
      const futura = e.subcondominios.find((s) => s.dataLancamento !== null && s.dataLancamento > HOJE)!;
      for (const u of e.unidades) if (u.subcondominioId !== futura.id) u.status = "vendida";
      expect(esgotado(e, HOJE)).toBe(true);
      expect(motivosExclusao(e, ctx)).toEqual(["esgotado"]);
    });

    it("com o pré-lançamento ligado e tudo vendido, também é esgotado", () => {
      const e = structuredClone(porSlug(todos, CASOS_EXCLUSAO.preLancamento));
      e.empreendimento.preLancamentoAtivo = true;
      for (const u of e.unidades) u.status = "vendida";
      expect(esgotado(e, HOJE)).toBe(true);
      expect(motivosExclusao(e, ctx)).toEqual(["esgotado"]);
    });

    it("com o pré-lançamento ligado e a torre futura livre, a torre conta e não é esgotado", () => {
      const e = structuredClone(porSlug(todos, "vila-menino-deus"));
      e.empreendimento.preLancamentoAtivo = true;
      const futura = e.subcondominios.find((s) => s.dataLancamento !== null && s.dataLancamento > HOJE)!;
      for (const u of e.unidades) if (u.subcondominioId !== futura.id) u.status = "vendida";
      expect(subcondominioVisivel(futura, e, HOJE)).toBe(true);
      expect(esgotado(e, HOJE)).toBe(false);
    });

    it("sem torre visível não é esgotado", () => {
      expect(esgotado(porSlug(todos, CASOS_EXCLUSAO.preLancamento), HOJE)).toBe(false);
    });
  });
});
