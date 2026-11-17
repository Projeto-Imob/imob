import { describe, expect, it } from "vitest";
import { montarEvento, sanitizarDados } from "@/modulos/analytics";

const VISITANTE = "00000000-0000-4000-8000-000000000001";
const ID = "00000000-0000-4000-8000-0000000000aa";
const AGORA = new Date("2026-11-16T12:00:00Z");

describe("eventos anônimos (regras 9 e 12)", () => {
  it("tira IP e posição exata, e descarta objetos aninhados", () => {
    expect(
      sanitizarDados({
        ip: "203.0.113.5",
        latitude: -30.03,
        coords: [-30.03, -51.21],
        perfil: { lat: -30.03 },
        bairro: "Menino Deus",
        quartos: ["2", "3"],
        aberto: true,
        nota: 87,
        vazio: null,
        infinito: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({ bairro: "Menino Deus", quartos: ["2", "3"], aberto: true, nota: 87, vazio: null });
  });

  it("monta o evento com id anônimo e dados limpos", () => {
    const evento = montarEvento(
      { tipo: "project_view", empreendimentoId: null, dados: { lng: -51.2, slug: "vila-menino-deus" } },
      { visitorId: VISITANTE, contaId: null, privilegiado: false },
      () => ID,
      AGORA,
    );
    expect(evento).toEqual({
      id: ID,
      visitorId: VISITANTE,
      contaId: null,
      tipo: "project_view",
      empreendimentoId: null,
      dados: { slug: "vila-menino-deus" },
      criadoEm: "2026-11-16T12:00:00.000Z",
    });
  });

  it("não grava nada da navegação de god mode ou impersonate", () => {
    expect(montarEvento({ tipo: "project_view" }, { visitorId: VISITANTE, contaId: null, privilegiado: true }, () => ID, AGORA)).toBeNull();
  });

  it("recusa tipo de evento fora da lista", () => {
    expect(() =>
      montarEvento({ tipo: "inventado" as never }, { visitorId: VISITANTE, contaId: null, privilegiado: false }, () => ID, AGORA),
    ).toThrow();
  });
});
