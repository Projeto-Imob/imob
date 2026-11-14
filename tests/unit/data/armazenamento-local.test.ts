import { describe, expect, it } from "vitest";
import {
  CHAVE_DADOS,
  VERSAO_ATUAL,
  armazenamentoEmMemoria,
  carregar,
  lerMigracoes,
} from "@/data/armazenamento-local";
import { chaveDono, criarRepositoriosLocais } from "@/data/local";

const agora = new Date("2026-11-13T13:00:00.000Z");
const FAV = "00000000-0000-4000-8003-000000000001";

describe("LocalStorage versionado (2.12)", () => {
  it("grava com a versão atual", async () => {
    const arm = armazenamentoEmMemoria();
    const r = criarRepositoriosLocais({ armazenamento: arm, agora: () => agora });
    await r.favoritos.adicionar({ visitorId: "v", contaId: null }, FAV);
    expect(JSON.parse(arm.getItem(CHAVE_DADOS)!).versao).toBe(VERSAO_ATUAL);
  });

  it("migra o formato v0 e registra o que removeu", () => {
    const arm = armazenamentoEmMemoria();
    arm.setItem(
      CHAVE_DADOS,
      JSON.stringify({
        favoritos: { [chaveDono({ visitorId: "v", contaId: null })]: [FAV], "visitante:x": ["nao-e-uuid"] },
        carrinho: { a: 1 },
      }),
    );
    const dados = carregar(arm, agora);
    expect(dados.versao).toBe(1);
    expect(dados.colecoes.favoritos).toEqual({ "visitante:v": [FAV] });

    const [registro] = lerMigracoes(arm);
    expect(registro).toMatchObject({ deVersao: 0, paraVersao: 1 });
    expect(registro!.removidos).toEqual([expect.objectContaining({ colecao: "favoritos", chave: "visitante:x" })]);
    // Depois de migrar, o armazenamento fica na versão atual.
    expect(JSON.parse(arm.getItem(CHAVE_DADOS)!).versao).toBe(1);
  });

  it("registra coleção desconhecida na versão atual", () => {
    const arm = armazenamentoEmMemoria();
    arm.setItem(CHAVE_DADOS, JSON.stringify({ versao: 1, colecoes: { perfis: {}, antigo: { a: 1 } } }));
    carregar(arm, agora);
    expect(lerMigracoes(arm)[0]!.removidos).toEqual([{ colecao: "antigo", chave: "*", motivo: "coleção desconhecida" }]);
  });

  it("JSON ilegível vira armazenamento vazio, com registro", () => {
    const arm = armazenamentoEmMemoria();
    arm.setItem(CHAVE_DADOS, "{quebrado");
    expect(carregar(arm, agora).colecoes.perfis).toEqual({});
    expect(lerMigracoes(arm)[0]!.removidos[0]!.motivo).toBe("JSON ilegível");
  });

  it("versão futura desconhecida não é lida, com registro", () => {
    const arm = armazenamentoEmMemoria();
    arm.setItem(CHAVE_DADOS, JSON.stringify({ versao: 99, colecoes: {} }));
    carregar(arm, agora);
    expect(lerMigracoes(arm)[0]).toMatchObject({ deVersao: 99, removidos: [{ motivo: "versão 99 desconhecida" }] });
  });

  it("leitura limpa não gera registro de migração", async () => {
    const arm = armazenamentoEmMemoria();
    const r = criarRepositoriosLocais({ armazenamento: arm, agora: () => agora });
    await r.favoritos.adicionar({ visitorId: "v", contaId: null }, FAV);
    await r.favoritos.listar({ visitorId: "v", contaId: null });
    expect(lerMigracoes(arm)).toEqual([]);
  });
});
