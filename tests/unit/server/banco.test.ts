import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Pool e conexão falsos: o teste olha a ordem dos comandos e a devolução da conexão ao pool.
const falso = vi.hoisted(() => {
  class ConexaoFalsa {
    comandos: string[] = [];
    parametros: unknown[][] = [];
    devolvida: unknown[] = [];
    falhas = new Map<string, Error>();
    async query(texto: string | { text: string }, valores?: unknown[]) {
      const comando = typeof texto === "string" ? texto : texto.text;
      this.comandos.push(comando);
      if (valores) this.parametros.push(valores);
      const falha = this.falhas.get(comando);
      if (falha) throw falha;
      return { rows: [], rowCount: 0, fields: [], command: "SELECT" };
    }
    release(erro?: unknown) {
      this.devolvida.push(erro);
    }
  }
  class PoolFalso {
    static criados: PoolFalso[] = [];
    ouvintes = new Map<string, (erro: Error) => void>();
    conexao = new ConexaoFalsa();
    encerrado = false;
    constructor(public opcoes: Record<string, unknown>) {
      PoolFalso.criados.push(this);
    }
    on(evento: string, ouvinte: (erro: Error) => void) {
      this.ouvintes.set(evento, ouvinte);
      return this;
    }
    async connect() {
      return this.conexao;
    }
    async end() {
      this.encerrado = true;
    }
  }
  return { PoolFalso };
});

vi.mock("server-only", () => ({}));
vi.mock("pg", () => ({ Pool: falso.PoolFalso, default: { Pool: falso.PoolFalso } }));

const CONTA = "00000000-0000-4000-8000-000000000001";
const { PoolFalso } = falso;

async function carregar(ambiente: Record<string, string> = {}) {
  vi.resetModules();
  for (const [nome, valor] of Object.entries(ambiente)) vi.stubEnv(nome, valor);
  return import("@/server/db");
}

const ultimoPool = () => PoolFalso.criados.at(-1)!;

beforeEach(() => {
  PoolFalso.criados = [];
  delete (globalThis as { __imobBanco?: unknown }).__imobBanco;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("transação do banco (src/server/db)", () => {
  it("comContexto: begin, contexto da conta como parâmetro, callback, commit e devolve a conexão", async () => {
    const banco = await carregar();
    expect(await banco.comContexto({ contaId: CONTA }, async () => 42)).toBe(42);
    const conexao = ultimoPool().conexao;
    expect(conexao.comandos).toEqual(["begin", expect.stringContaining("set_config('app.conta_id', $1, true)"), "commit"]);
    expect(conexao.parametros).toEqual([[CONTA, "", ""]]);
    expect(conexao.devolvida).toEqual([undefined]);
  });

  it("comContexto grava o visitante no set_config e recusa id fora do formato", async () => {
    const banco = await carregar();
    const VISITANTE = "6f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f";
    await banco.comContexto({ contaId: null, visitanteId: VISITANTE }, async () => null);
    const conexao = ultimoPool().conexao;
    expect(conexao.comandos[1]).toContain("set_config('app.visitante_id', $3, true)");
    expect(conexao.parametros).toEqual([["", "", VISITANTE]]);
    await expect(banco.comContexto({ contaId: null, visitanteId: "1; select 1" }, async () => null)).rejects.toThrow();
  });

  it("consultaPublica abre transação só de leitura e sem conta", async () => {
    const banco = await carregar();
    await banco.consultaPublica(async () => null);
    const conexao = ultimoPool().conexao;
    expect(conexao.comandos[0]).toBe("begin read only");
    expect(conexao.parametros).toEqual([["", "", ""]]);
    expect(conexao.comandos.at(-1)).toBe("commit");
  });

  it("erro no callback: rollback, devolve o erro original e a conexão volta ao pool", async () => {
    const banco = await carregar();
    const erro = new Error("falhou no meio");
    await expect(banco.comContexto({ contaId: null }, async () => Promise.reject(erro))).rejects.toBe(erro);
    const conexao = ultimoPool().conexao;
    expect(conexao.comandos.at(-1)).toBe("rollback");
    expect(conexao.comandos).not.toContain("commit");
    expect(conexao.devolvida).toEqual([undefined]);
  });

  it("falha no begin não deixa a conexão presa", async () => {
    const banco = await carregar();
    await banco.consultaPublica(async () => null);
    const conexao = ultimoPool().conexao;
    conexao.devolvida = [];
    conexao.falhas.set("begin read only", new Error("conexão caiu"));
    await expect(banco.consultaPublica(async () => null)).rejects.toThrow("conexão caiu");
    expect(conexao.devolvida).toHaveLength(1);
  });

  it("rollback que falha descarta a conexão e mantém o erro original", async () => {
    const banco = await carregar();
    await banco.consultaPublica(async () => null);
    const conexao = ultimoPool().conexao;
    conexao.devolvida = [];
    conexao.falhas.set("rollback", new Error("socket fechado"));
    const erro = new Error("falhou no meio");
    await expect(banco.comContexto({ contaId: null }, async () => Promise.reject(erro))).rejects.toBe(erro);
    expect(conexao.devolvida).toHaveLength(1);
    expect(conexao.devolvida[0]).toBeInstanceOf(Error);
  });

  it("contexto inválido é recusado antes de pegar conexão", async () => {
    const banco = await carregar();
    await expect(banco.comContexto({ contaId: "1; drop table contas" }, async () => null)).rejects.toThrow();
    expect(PoolFalso.criados).toHaveLength(0);
  });
});

describe("pool do banco", () => {
  it("limita a espera por conexão, ouve erro de conexão ociosa e lê o máximo do ambiente", async () => {
    const banco = await carregar({ DB_POOL_MAX: "3" });
    await banco.consultaPublica(async () => null);
    const pool = ultimoPool();
    expect(pool.opcoes).toMatchObject({ max: 3, connectionTimeoutMillis: 5_000 });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => pool.ouvintes.get("error")?.(new Error("terminating connection"))).not.toThrow();
    expect(log).toHaveBeenCalledOnce();
  });

  it("máximo inválido no ambiente cai no padrão de 10", async () => {
    const banco = await carregar({ DB_POOL_MAX: "muitos" });
    await banco.consultaPublica(async () => null);
    expect(ultimoPool().opcoes).toMatchObject({ max: 10 });
  });

  it("fora de produção, o pool sobrevive ao recarregamento do módulo", async () => {
    await (await carregar()).consultaPublica(async () => null);
    await (await carregar()).consultaPublica(async () => null);
    expect(PoolFalso.criados).toHaveLength(1);
  });

  it("em produção, exige DATABASE_URL", async () => {
    const banco = await carregar({ NODE_ENV: "production", DATABASE_URL: "" });
    await expect(banco.consultaPublica(async () => null)).rejects.toThrow("DATABASE_URL");
  });

  it("encerrarBanco fecha o pool e o próximo uso abre outro", async () => {
    const banco = await carregar();
    await banco.consultaPublica(async () => null);
    const primeiro = ultimoPool();
    await banco.encerrarBanco();
    expect(primeiro.encerrado).toBe(true);
    await banco.consultaPublica(async () => null);
    expect(PoolFalso.criados).toHaveLength(2);
  });
});
