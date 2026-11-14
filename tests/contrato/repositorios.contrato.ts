/**
 * Suíte de contrato dos repositórios (design D3). A mesma suíte roda contra o adaptador local
 * (aqui) e contra o adaptador Postgres sobre PGlite (grupo 4, tarefa 4.16).
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { Dono, Repositorios } from "@/data/port";
import { CASOS_EXCLUSAO } from "@/seed/seed";
import { PERFIL_VAZIO } from "@/dominio/tipos";

export type FabricaRepositorios = () => Promise<Repositorios> | Repositorios;

const HOJE = "2026-11-13";
const visitante: Dono = { visitorId: "00000000-0000-4000-8abc-000000000001", contaId: null };
const outroVisitante: Dono = { visitorId: "00000000-0000-4000-8abc-000000000002", contaId: null };
const conta: Dono = { visitorId: visitante.visitorId, contaId: "00000000-0000-4000-8002-000000000100" };
const EMP_A = "00000000-0000-4000-8003-000000000001";
const EMP_B = "00000000-0000-4000-8003-000000000002";

export function suiteContratoRepositorios(nome: string, fabrica: FabricaRepositorios) {
  describe(`contrato dos repositórios: ${nome}`, () => {
    let r: Repositorios;
    beforeEach(async () => {
      r = await fabrica();
    });

    describe("EmpreendimentoRepo", () => {
      it("lista só a base elegível", async () => {
        const base = await r.empreendimentos.listarBaseElegivel({ hoje: HOJE });
        const slugs = base.map((e) => e.empreendimento.slug);
        expect(slugs).toHaveLength(6);
        for (const excluido of Object.values(CASOS_EXCLUSAO)) expect(slugs).not.toContain(excluido);
      });

      it("traz subcondomínios, tipologias, unidades e planos de cada empreendimento", async () => {
        const [e] = await r.empreendimentos.listarBaseElegivel({ hoje: HOJE });
        expect(e!.subcondominios.length).toBeGreaterThan(0);
        expect(e!.tipologias.length).toBeGreaterThan(0);
        expect(e!.unidades.every((u) => u.empreendimentoId === e!.empreendimento.id)).toBe(true);
        expect(e!.planos.length).toBeGreaterThan(0);
      });

      it("nunca expõe dados comerciais (comissão) na leitura do comprador", async () => {
        const base = await r.empreendimentos.listarBaseElegivel({ hoje: HOJE });
        expect(JSON.stringify(base)).not.toMatch(/comiss/i);
      });

      it("respeita a campanha", async () => {
        const todos = await r.empreendimentos.listarBaseElegivel({ hoje: HOJE });
        const tenant = todos[0]!.empreendimento.tenantId;
        const daCampanha = await r.empreendimentos.listarBaseElegivel({ hoje: HOJE, campanhaTenantId: tenant });
        expect(daCampanha.length).toBeGreaterThan(0);
        expect(daCampanha.every((e) => e.empreendimento.tenantId === tenant)).toBe(true);
      });

      it("obtém por slug e devolve nulo para slug inexistente", async () => {
        expect((await r.empreendimentos.obterPorSlug("vila-menino-deus"))?.empreendimento.nome).toBe("Vila Menino Deus");
        expect(await r.empreendimentos.obterPorSlug("nao-existe")).toBeNull();
      });

      it("devolve cópias: alterar o retorno não altera o repositório", async () => {
        const e = (await r.empreendimentos.obterPorSlug("vila-menino-deus"))!;
        e.empreendimento.nome = "Alterado";
        expect((await r.empreendimentos.obterPorSlug("vila-menino-deus"))!.empreendimento.nome).toBe("Vila Menino Deus");
      });
    });

    describe("ProfileRepo", () => {
      const progresso = { perfil: { ...PERFIL_VAZIO, modo: "morar" as const }, perguntaAtual: "regiao", concluido: false, atualizadoEm: "2026-11-13T10:00:00.000Z" };

      it("salva, obtém e remove por dono", async () => {
        expect(await r.perfis.obter(visitante)).toBeNull();
        await r.perfis.salvar(visitante, progresso);
        expect(await r.perfis.obter(visitante)).toEqual(progresso);
        expect(await r.perfis.obter(outroVisitante)).toBeNull();
        await r.perfis.remover(visitante);
        expect(await r.perfis.obter(visitante)).toBeNull();
      });

      it("conta e visitante são donos distintos", async () => {
        await r.perfis.salvar(visitante, progresso);
        expect(await r.perfis.obter(conta)).toBeNull();
      });
    });

    describe("FavoriteRepo", () => {
      it("adiciona sem duplicar, lista e remove", async () => {
        await r.favoritos.adicionar(visitante, EMP_A);
        await r.favoritos.adicionar(visitante, EMP_A);
        await r.favoritos.adicionar(visitante, EMP_B);
        expect(await r.favoritos.listar(visitante)).toEqual([EMP_A, EMP_B]);
        await r.favoritos.remover(visitante, EMP_A);
        expect(await r.favoritos.listar(visitante)).toEqual([EMP_B]);
        expect(await r.favoritos.listar(outroVisitante)).toEqual([]);
      });
    });

    describe("AlertRepo", () => {
      it("cria ativo, pausa, desliga e marca como visto", async () => {
        const a = await r.alertas.criar(conta, { tipo: "preco", canal: "whatsapp", frequencia: "diaria", empreendimentoId: EMP_A, area: null });
        expect(a).toMatchObject({ estado: "ativo", vistoEm: null, tipo: "preco" });
        await r.alertas.alterarEstado(conta, a.id, "pausado");
        await r.alertas.marcarVisto(conta, a.id);
        const [lido] = await r.alertas.listar(conta);
        expect(lido!.estado).toBe("pausado");
        expect(lido!.vistoEm).not.toBeNull();
        await r.alertas.alterarEstado(conta, a.id, "desligado");
        expect((await r.alertas.listar(conta))[0]!.estado).toBe("desligado");
        expect(await r.alertas.listar(visitante)).toEqual([]);
      });

      it("guarda o recorte do alerta de área", async () => {
        const area = { minLng: -51.25, minLat: -30.06, maxLng: -51.18, maxLat: -30.01 };
        const a = await r.alertas.criar(conta, { tipo: "area", canal: "email", frequencia: "semanal", empreendimentoId: null, area });
        expect((await r.alertas.listar(conta)).find((x) => x.id === a.id)?.area).toEqual(area);
      });
    });

    describe("EventRepo (eventos anônimos)", () => {
      it("grava com o ID anônimo, sem IP e sem posição exata", async () => {
        const e = await r.eventos.registrar(
          { tipo: "map_open", dados: { origem: "browser", ip: "203.0.113.5", lat: -30.03, lng: -51.2, latitude: -30, posicao: "x", zoom: 12 } },
          { ...visitante, privilegiado: false },
        );
        expect(e).not.toBeNull();
        expect(e!.visitorId).toBe(visitante.visitorId);
        expect(e!.dados).toEqual({ origem: "browser", zoom: 12 });
        const [gravado] = await r.eventos.listar(visitante);
        expect(JSON.stringify(gravado)).not.toMatch(/203\.0\.113\.5|-30\.03|-51\.2/);
      });

      it("descarta objetos aninhados que poderiam esconder coordenadas", async () => {
        const e = await r.eventos.registrar({ tipo: "map_move", dados: { centro: { a: -30, b: -51 }, zoom: 11 } }, { ...visitante, privilegiado: false });
        expect(e!.dados).toEqual({ zoom: 11 });
      });

      it("navegação privilegiada (god mode ou impersonate) não gera evento", async () => {
        expect(await r.eventos.registrar({ tipo: "project_view", empreendimentoId: EMP_A }, { ...visitante, privilegiado: true })).toBeNull();
        expect(await r.eventos.listar(visitante)).toEqual([]);
      });

      it("recusa tipo fora do catálogo", async () => {
        await expect(r.eventos.registrar({ tipo: "page_view" as never }, { ...visitante, privilegiado: false })).rejects.toThrow();
      });

      it("grava quiz_answer com pergunta, valor e contagens", async () => {
        await r.eventos.registrar(
          { tipo: "quiz_answer", dados: { pergunta: "prazo", valor: "agora", contagemAntes: 6, contagemDepois: 2 } },
          { ...visitante, privilegiado: false },
        );
        expect((await r.eventos.listar(visitante))[0]).toMatchObject({ tipo: "quiz_answer", dados: { pergunta: "prazo", contagemDepois: 2 } });
      });
    });
  });
}
