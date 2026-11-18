import { beforeEach, describe, expect, it, vi } from "vitest";

const falso = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  gravados: [] as { nome: string; valor: string; opcoes: Record<string, unknown> }[],
  host: "localhost:3000",
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nome: string) => (falso.cookies.has(nome) ? { name: nome, value: falso.cookies.get(nome)! } : undefined),
    set: (nome: string, valor: string, opcoes: Record<string, unknown>) => {
      falso.gravados.push({ nome, valor, opcoes });
      falso.cookies.set(nome, valor);
    },
  }),
  headers: async () => new Headers({ host: falso.host }),
}));

import { COOKIE_VISITANTE, VALIDADE_COOKIE_SEGUNDOS, exigirContexto, lerContexto, opcoesDoCookie } from "@/server/contexto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID = "6f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f";

beforeEach(() => {
  falso.cookies.clear();
  falso.gravados.length = 0;
  falso.host = "localhost:3000";
});

describe("opções do cookie do visitante", () => {
  it("httpOnly, SameSite=Lax, 90 dias e caminho raiz", () => {
    const o = opcoesDoCookie("imob.exemplo.com.br");
    expect(o).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 90 * 24 * 60 * 60 });
    expect(VALIDADE_COOKIE_SEGUNDOS).toBe(7_776_000);
  });

  it("Secure fora do localhost, sem Secure nele", () => {
    expect(opcoesDoCookie("imob.exemplo.com.br").secure).toBe(true);
    expect(opcoesDoCookie("localhost:3100").secure).toBe(false);
    expect(opcoesDoCookie("127.0.0.1:3000").secure).toBe(false);
    expect(opcoesDoCookie("[::1]:3000").secure).toBe(false);
    expect(opcoesDoCookie("localhost.evil.com").secure).toBe(true);
    expect(opcoesDoCookie(null).secure).toBe(true);
  });
});

describe("exigirContexto", () => {
  it("sem cookie, cria um UUID aleatório e grava o cookie", async () => {
    const contexto = await exigirContexto();
    expect(contexto.contaId).toBeNull();
    expect(contexto.visitanteId).toMatch(UUID);
    expect(falso.gravados).toHaveLength(1);
    expect(falso.gravados[0]).toMatchObject({ nome: COOKIE_VISITANTE, valor: contexto.visitanteId });
    expect(falso.gravados[0]!.opcoes).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
  });

  it("com cookie válido, reaproveita o id e não grava de novo", async () => {
    falso.cookies.set(COOKIE_VISITANTE, ID);
    const contexto = await exigirContexto();
    expect(contexto.visitanteId).toBe(ID);
    expect(falso.gravados).toHaveLength(0);
  });

  it("cookie malformado é descartado e substituído", async () => {
    falso.cookies.set(COOKIE_VISITANTE, "1; select 1");
    const contexto = await exigirContexto();
    expect(contexto.visitanteId).toMatch(UUID);
    expect(falso.gravados).toHaveLength(1);
  });

  it("dois visitantes sem cookie recebem ids diferentes", async () => {
    const a = (await exigirContexto()).visitanteId;
    falso.cookies.clear();
    const b = (await exigirContexto()).visitanteId;
    expect(a).not.toBe(b);
  });

  it("fora do localhost, grava com Secure", async () => {
    falso.host = "homolog.exemplo.com.br";
    await exigirContexto();
    expect(falso.gravados[0]!.opcoes.secure).toBe(true);
  });
});

describe("lerContexto", () => {
  it("só lê: nunca cria nem grava cookie", async () => {
    expect((await lerContexto()).visitanteId).toBeNull();
    expect(falso.gravados).toHaveLength(0);
  });

  it("devolve o visitante do cookie válido e ignora o malformado", async () => {
    falso.cookies.set(COOKIE_VISITANTE, ID);
    expect(await lerContexto()).toEqual({ contaId: null, visitanteId: ID });
    falso.cookies.set(COOKIE_VISITANTE, "x");
    expect((await lerContexto()).visitanteId).toBeNull();
  });
});
