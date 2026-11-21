import { afterAll, describe, expect, it } from "vitest";
import { urlDoPapel } from "../../scripts/db/config";
import { comContexto, encerrarBanco } from "@/server/db";
import { CONTAS, URL_BANCO, comCliente, comoApp, erroDe } from "./apoio";

afterAll(() => encerrarBanco());

const VISITANTE = "6f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f";
const IMPERSONACAO = "00000000-0000-4000-8009-0000000000aa";

type Ctx = { contaId?: string | null; impersonacaoId?: string | null; visitanteId?: string };

async function consulta(contexto: Ctx, funcao: string) {
  return comoApp({ contaId: contexto.contaId, impersonacaoId: contexto.impersonacaoId }, async (c) => {
    if (contexto.visitanteId !== undefined) await c.query("select set_config('app.visitante_id', $1, true)", [contexto.visitanteId]);
    // O nome da função vem destes testes, nunca de entrada de usuário.
    return (await c.query(`select ${funcao} as v`)).rows[0].v;
  });
}

describe("app.current_visitante_id", () => {
  it("devolve o visitante da transação e nulo quando não há", async () => {
    expect(await consulta({ visitanteId: VISITANTE }, "app.current_visitante_id()")).toBe(VISITANTE);
    expect(await consulta({}, "app.current_visitante_id()")).toBeNull();
    expect(await consulta({ visitanteId: "" }, "app.current_visitante_id()")).toBeNull();
  });
});

describe("app.grava_como_comprador", () => {
  it("o visitante sem conta, com cookie, grava como ele mesmo", async () => {
    expect(await consulta({ visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(true);
  });

  it("sem conta e sem visitante, não grava", async () => {
    expect(await consulta({}, "app.grava_como_comprador()")).toBe(false);
  });

  it("o comprador ativo grava, com ou sem cookie de visitante", async () => {
    expect(await consulta({ contaId: CONTAS.comprador }, "app.grava_como_comprador()")).toBe(true);
    expect(await consulta({ contaId: CONTAS.comprador, visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(true);
  });

  it("conta de comprador desativada não grava, nem com cookie de visitante", async () => {
    expect(await consulta({ contaId: CONTAS.compradorInativo, visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(false);
  });

  it("god mode não grava, nem com cookie de visitante (regra 12)", async () => {
    expect(await consulta({ contaId: CONTAS.godMode }, "app.grava_como_comprador()")).toBe(false);
    expect(await consulta({ contaId: CONTAS.godMode, visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(false);
  });

  it("impersonate não grava: nem como comprador, nem como visitante (regra 12)", async () => {
    expect(await consulta({ contaId: CONTAS.comprador, impersonacaoId: IMPERSONACAO }, "app.grava_como_comprador()")).toBe(false);
    expect(await consulta({ impersonacaoId: IMPERSONACAO, visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(false);
  });

  it("incorporadora, house e equipe não gravam como comprador", async () => {
    for (const contaId of [CONTAS.horizonteSuperadmin, CONTAS.valeSuperadmin, CONTAS.houseAnalista, CONTAS.equipePlataforma]) {
      expect(await consulta({ contaId, visitanteId: VISITANTE }, "app.grava_como_comprador()")).toBe(false);
    }
  });
});

describe("isolamento do contexto do visitante", () => {
  it("set_config(…, true) não vaza para a transação seguinte, na mesma conexão", async () => {
    const depois = await comCliente(URL_BANCO.app, async (c) => {
      await c.query("begin");
      await c.query("select set_config('app.visitante_id', $1, true)", [VISITANTE]);
      await c.query("commit");
      return (await c.query("select app.current_visitante_id() as v, app.grava_como_comprador() as g")).rows[0];
    });
    expect(depois).toEqual({ v: null, g: false });
  });

  it("dois visitantes ao mesmo tempo no mesmo pool não se misturam", async () => {
    const outro = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
    const rodada = (visitanteId: string) =>
      comContexto({ contaId: null, visitanteId }, async (tx) => {
        await tx.execute((await import("drizzle-orm")).sql`select pg_sleep(0.05)`);
        const r = await tx.execute((await import("drizzle-orm")).sql`select app.current_visitante_id() as v`);
        return { visitanteId, visto: String(r.rows[0]!.v) };
      });
    const resultados = await Promise.all(Array.from({ length: 10 }, (_, i) => rodada(i % 2 === 0 ? VISITANTE : outro)));
    for (const r of resultados) expect(r.visto).toBe(r.visitanteId);
  });
});

describe("GRANTs das funções do visitante", () => {
  it("o worker executa current_visitante_id, mas não grava como comprador", async () => {
    await comCliente(urlDoPapel("worker", "teste"), async (c) => {
      await c.query("select app.current_visitante_id()");
      const e = await erroDe(c.query("select app.grava_como_comprador()"));
      expect(e.code).toBe("42501");
    });
  });

  it("auth_service não executa nenhuma das duas", async () => {
    await comCliente(urlDoPapel("auth_service", "teste"), async (c) => {
      expect((await erroDe(c.query("select app.current_visitante_id()"))).code).toBe("42501");
    });
  });
});
