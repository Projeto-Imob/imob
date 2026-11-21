import { afterAll, describe, expect, it } from "vitest";
import { lerEmpreendimentoPublico } from "@/modulos/catalogo/consultas";
import { CASOS_EXCLUSAO } from "@/seed/seed";
import { encerrarBanco } from "@/server/db";

afterAll(() => encerrarBanco());

describe("lerEmpreendimentoPublico (vitrine pública, fatia 0.3)", () => {
  it("lê o resumo de um empreendimento elegível do seed", async () => {
    const e = await lerEmpreendimentoPublico("residencial-jardim-das-aguas");
    expect(e).toMatchObject({
      slug: "residencial-jardim-das-aguas",
      nome: "Residencial Jardim das Águas",
      bairro: "Moinhos de Vento",
      cidade: "Porto Alegre",
      uf: "RS",
      construtora: "Horizonte Sul",
      percentualObra: 100,
      entrega: "2025-12-15",
    });
    expect(e?.ri.numero).toBeTruthy();
    expect(e?.ri.cartorio).toBeTruthy();
  });

  it.each(Object.entries(CASOS_EXCLUSAO))("caso de exclusão %s: não encontrado", async (_caso, slug) => {
    expect(await lerEmpreendimentoPublico(slug)).toBeNull();
  });

  it("slug inexistente ou fora do formato: não encontrado", async () => {
    for (const slug of ["nao-existe", "Residencial-Jardim", "../contas", "a".repeat(200), ""]) {
      expect(await lerEmpreendimentoPublico(slug), slug).toBeNull();
    }
  });

  it("a torre futura não aparece: a entrega vem só das torres lançadas (D15)", async () => {
    // No banco de testes, vila-menino-deus tem a Torre B com lançamento em 2031 e entrega em 2034.
    expect((await lerEmpreendimentoPublico("vila-menino-deus"))?.entrega).toBe("2028-12-20");
  });

  it("devolve só dado público, sem dado comercial (regra 7)", async () => {
    const e = await lerEmpreendimentoPublico("edificio-mirante-petropolis");
    expect(Object.keys(e ?? {}).sort()).toEqual(
      [
        "bairro", "cidade", "comodidades", "construtora", "descricao", "entrega", "escritorio", "espelhoAtualizadoEm", "exemplo",
        "nome", "percentualObra", "planos", "pontos", "ri", "slug", "tipologias", "uf", "unidades",
      ].sort(),
    );
    const json = JSON.stringify(e);
    for (const proibido of ["comissao", "tenant", "tenantId", "escritorio\":\"house", "indiceCorrecao", "INCC"]) {
      expect(json, proibido).not.toContain(proibido);
    }
  });

  it("traz tipologias, unidades, planos, pontos e o cartão do escritório", async () => {
    const e = await lerEmpreendimentoPublico("edificio-mirante-petropolis");
    expect(e?.tipologias).toHaveLength(2);
    expect(e?.unidades).toHaveLength(11);
    expect(e?.planos).toHaveLength(2);
    expect(e?.pontos).toHaveLength(6);
    expect(e?.escritorio).toMatchObject({ origem: "house", nome: "Helena Exemplo", cargo: "Gerente de contas" });
    expect(e?.planos[0]?.financiamento).toHaveProperty("aceita");
  });

  it("o Studio Cidade Baixa não tem cartão nem comodidades cadastradas", async () => {
    const e = await lerEmpreendimentoPublico("studio-cidade-baixa");
    expect(e?.escritorio).toBeNull();
    expect(e?.comodidades).toBeNull();
  });
});
