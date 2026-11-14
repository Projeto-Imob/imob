import { describe, expect, it } from "vitest";
import { resolveHomeState, type EntradaHome } from "@/dominio/homeState";

const vazio: EntradaHome = { usuario: null, eventos: 0, questionarioConcluido: false, favoritos: 0, alertas: 0, visitas: [], propostas: [] };
const com = (alt: Partial<EntradaHome>): EntradaHome => ({ ...vazio, ...alt });

describe("resolveHomeState (2.10)", () => {
  it("novo: sem eventos, perfil, favoritos nem visitas", () => {
    expect(resolveHomeState(vazio)).toBe("novo");
  });

  it("navegou: tem eventos, sem questionário concluído", () => {
    expect(resolveHomeState(com({ eventos: 3 }))).toBe("navegou");
  });

  it("perfil: questionário concluído, sem favoritos nem alertas", () => {
    expect(resolveHomeState(com({ eventos: 10, questionarioConcluido: true }))).toBe("perfil");
  });

  it("ativo: questionário concluído com favorito ou alerta (Proposta)", () => {
    expect(resolveHomeState(com({ questionarioConcluido: true, favoritos: 1 }))).toBe("ativo");
    expect(resolveHomeState(com({ questionarioConcluido: true, alertas: 1 }))).toBe("ativo");
  });

  it("negociando: visita agendada vence qualquer outro estado", () => {
    expect(resolveHomeState(com({ questionarioConcluido: true, favoritos: 2, visitas: [{ status: "agendada" }] }))).toBe("negociando");
    expect(resolveHomeState(com({ usuario: { contaId: "c" }, visitas: [{ status: "confirmada" }] }))).toBe("negociando");
  });

  it("negociando: proposta em análise", () => {
    expect(resolveHomeState(com({ propostas: [{ status: "em_analise" }] }))).toBe("negociando");
  });

  it("visita realizada ou cancelada e proposta recusada não contam como negociação", () => {
    expect(resolveHomeState(com({ eventos: 1, visitas: [{ status: "realizada" }, { status: "cancelada" }], propostas: [{ status: "recusada" }] }))).toBe("navegou");
  });

  it("é determinística", () => {
    const e = com({ eventos: 4, questionarioConcluido: true, favoritos: 1 });
    expect(resolveHomeState(e)).toBe(resolveHomeState(structuredClone(e)));
  });
});
