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

  it("devolve só o resumo público, sem dado comercial", async () => {
    const e = await lerEmpreendimentoPublico("edificio-mirante-petropolis");
    expect(Object.keys(e ?? {}).sort()).toEqual(
      ["bairro", "cidade", "construtora", "descricao", "entrega", "nome", "percentualObra", "ri", "slug", "uf"].sort(),
    );
  });
});
