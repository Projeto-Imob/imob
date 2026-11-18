// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BlocoComodidades, BlocoCustos, BlocoEscritorio, BlocoGaleria, BlocoLegais, BlocoVizinhanca, type PaginaEmpreendimento } from "@/modulos/catalogo";
import { gerarSeed } from "@/seed/seed";

afterEach(cleanup);

const seed = gerarSeed();

/** Monta a página pública de um empreendimento do seed, sem o banco. */
function paginaDe(slug: string, ajuste: Partial<PaginaEmpreendimento> = {}): PaginaEmpreendimento {
  const e = seed.empreendimentos.find((x) => x.slug === slug)!;
  const cartao = seed.escritorios.find((o) => o.empreendimentoId === e.id);
  return {
    slug: e.slug, nome: e.nome, bairro: e.bairro, cidade: e.cidade, uf: e.uf, descricao: e.descricao,
    percentualObra: e.percentualObra, construtora: "Horizonte Sul", entrega: "2027-10-30",
    ri: { ...e.ri!, patrimonioAfetacao: e.ri!.patrimonioAfetacao },
    exemplo: true,
    comodidades: e.comodidades,
    espelhoAtualizadoEm: e.espelhoAtualizadoEm,
    tipologias: seed.tipologias.filter((t) => t.empreendimentoId === e.id),
    unidades: seed.unidades.filter((u) => u.empreendimentoId === e.id),
    planos: seed.planos.filter((p) => p.empreendimentoId === e.id),
    pontos: e.pontosProximos,
    escritorio: cartao ? { origem: cartao.origem, nome: cartao.nome, cargo: cartao.cargo, experiencia: cartao.experiencia, fotoPath: cartao.fotoPath, whatsapp: cartao.whatsapp, email: cartao.email, telefone: cartao.telefone } : null,
    ...ajuste,
  };
}

describe("campo vazio vira Não informado", () => {
  it("sem cartão de escritório, cada campo do cartão é Não informado e não há link de contato", () => {
    const { container } = render(<BlocoEscritorio e={paginaDe("studio-cidade-baixa")} modo="morar" />);
    expect(screen.getAllByText("Não informado").length).toBeGreaterThanOrEqual(5);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("com cartão, WhatsApp (wa.me com mensagem pronta), e-mail e telefone são links", () => {
    const { container } = render(<BlocoEscritorio e={paginaDe("residencial-jardim-das-aguas")} modo="morar" />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs[0]).toMatch(/^https:\/\/wa\.me\/5551900000003\?text=Ol%C3%A1!%20Vi%20o%20Residencial/);
    expect(hrefs[1]).toBe("mailto:helena.contas@exemplo.invalid");
    expect(hrefs[2]).toBe("tel:+555130000003");
  });

  it("patrimônio de afetação sem dado, comodidades sem dado e vizinhança sem ponto", () => {
    const base = paginaDe("studio-cidade-baixa");
    const { container } = render(
      <>
        <BlocoLegais e={{ ...base, ri: { ...base.ri, patrimonioAfetacao: null } }} modo="morar" />
        <BlocoComodidades e={base} modo="morar" />
        <BlocoVizinhanca e={{ ...base, pontos: [] }} modo="morar" />
      </>,
    );
    expect(screen.getAllByText("Não informado").length).toBe(1 + 1 + 6);
    expect(container.textContent).not.toMatch(/CRECI/i);
  });

  it("os dados legais mostram R.I., cartório, data e patrimônio, sem CRECI", () => {
    const { container } = render(<BlocoLegais e={paginaDe("residencial-jardim-das-aguas")} modo="morar" />);
    expect(container.textContent).toContain("Registro de incorporação");
    expect(container.textContent).toContain("Patrimônio de afetação");
    expect(container.textContent).not.toMatch(/CRECI/i);
  });
});

describe("BlocoCustos", () => {
  it("usa a unidade disponível de menor preço e nunca mostra o nome do índice", () => {
    const e = paginaDe("edificio-mirante-petropolis");
    const { container } = render(<BlocoCustos unidades={e.unidades} tipologias={e.tipologias} planos={e.planos} modo="morar" />);
    const select = container.querySelector("select")!;
    expect(select.value).toBe("00000000-0000-4000-8006-000000002001");
    expect(container.textContent).toContain("corrigidas pelo índice do contrato");
    expect(container.textContent).not.toMatch(/INCC|IGP|IPCA/);
    expect(container.textContent).toContain("ITBI e registro");
  });

  it("sem unidade disponível, avisa em vez de calcular", () => {
    const e = paginaDe("edificio-mirante-petropolis");
    const vendidas = e.unidades.map((u) => ({ ...u, status: "vendida" as const }));
    const { container } = render(<BlocoCustos unidades={vendidas} tipologias={e.tipologias} planos={e.planos} modo="investir" />);
    expect(container.querySelector("select")).toBeNull();
    expect(container.textContent).toContain("Não há unidade disponível");
  });
});

describe("BlocoGaleria: o laranja das fachadas fica só sobre o fundo preto (regra 15)", () => {
  it("cada fachada tem o fundo preto inteiro, e nenhum laranja aparece fora dela", () => {
    const { container } = render(<BlocoGaleria slug="residencial-jardim-das-aguas" />);
    const fachadas = [...container.querySelectorAll("svg")];
    expect(fachadas.length).toBeGreaterThan(0);
    for (const svg of fachadas) {
      const fundo = svg.firstElementChild!;
      expect(fundo.tagName.toLowerCase()).toBe("rect");
      expect(fundo.getAttribute("class")).toBe("fill-preto");
      expect(fundo.getAttribute("width")).toBe("400");
      expect(fundo.getAttribute("height")).toBe("300");
      expect(svg.querySelectorAll(".fill-laranja").length).toBeGreaterThan(0);
    }
    const laranjaForaDaFachada = [...container.querySelectorAll(".fill-laranja")].filter((el) => !el.closest("svg"));
    expect(laranjaForaDaFachada).toEqual([]);
  });
});
