// Papéis do banco na fatia 0.4: limites de tempo gravados no papel e a conferência do papel do app.
import { describe, expect, it } from "vitest";
import { conferirPapel } from "../../scripts/conferir-papel";
import { LIMITES_DO_PAPEL, urlDoPapel, type PapelBanco } from "../../scripts/db/config";
import { comCliente } from "./apoio";

/** "15s" → 15000 (milissegundos, como em pg_settings). */
function emMs(valor: string): string {
  const m = /^(\d+)(ms|s|min)$/.exec(valor);
  if (!m) throw new Error(`limite fora do formato: ${valor}`);
  const fator = { ms: 1, s: 1_000, min: 60_000 }[m[2] as "ms" | "s" | "min"];
  return String(Number(m[1]) * fator);
}

function limitesEmVigor(papel: PapelBanco) {
  return comCliente(urlDoPapel(papel, "teste"), async (c) => {
    const r = await c.query<{ name: string; setting: string }>(
      "select name, setting from pg_settings where name in ('statement_timeout', 'idle_in_transaction_session_timeout')",
    );
    return Object.fromEntries(r.rows.map((l) => [l.name, l.setting]));
  });
}

describe("limites de tempo por papel", () => {
  it.each(Object.entries(LIMITES_DO_PAPEL))("%s conecta já com os limites da Proposta", async (papel, limites) => {
    await expect(limitesEmVigor(papel as PapelBanco)).resolves.toEqual({
      statement_timeout: emMs(limites!.statementTimeout),
      idle_in_transaction_session_timeout: emMs(limites!.idleInTransactionSessionTimeout),
    });
  });

  it("o migrator fica sem limite, porque uma migration pode demorar", async () => {
    await expect(limitesEmVigor("migrator")).resolves.toEqual({ statement_timeout: "0", idle_in_transaction_session_timeout: "0" });
  });

  it("uma consulta do app_user acima do limite é cancelada pelo banco", async () => {
    await comCliente(urlDoPapel("app_user", "teste"), async (c) => {
      await c.query("set statement_timeout = '100ms'");
      await expect(c.query("select pg_sleep(1)")).rejects.toThrow(/statement timeout/);
    });
  });
});

describe("conferirPapel (o app sobe só como app_user)", () => {
  it("aceita a conexão do app_user", async () => {
    await expect(conferirPapel(urlDoPapel("app_user", "teste"))).resolves.toBeNull();
  });

  it("recusa a conexão do migrator", async () => {
    await expect(conferirPapel(urlDoPapel("migrator", "teste"))).resolves.toContain('conectou como "migrator"');
  });

  it("recusa sem URL e quando o banco não responde", async () => {
    await expect(conferirPapel(undefined)).resolves.toBe("DATABASE_URL não definida.");
    await expect(conferirPapel("postgres://app_user@127.0.0.1:1/imob_teste")).resolves.toContain("não conectou ao banco");
  });
});
