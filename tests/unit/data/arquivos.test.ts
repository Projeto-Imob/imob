import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ArquivoRecusado, TAMANHO_MAXIMO_BYTES, detectarTipo, type ArquivoStorage } from "@/data/arquivos";
import { criarImagensPlataformaIdb } from "@/data/imagens-plataforma-idb";
import { criarArmazenamentoEmDisco } from "@/server/storage/disco";

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1]);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

const CHAVE_EMP = "empreendimentos/tenant-1/emp-1/capa.jpg";
const CHAVE_PLAT = "conteudo-plataforma/logotipo.png";

async function recusa(p: Promise<unknown>, motivo: ArquivoRecusado["motivo"]) {
  await expect(p).rejects.toBeInstanceOf(ArquivoRecusado);
  await expect(p).rejects.toMatchObject({ motivo });
}

describe("detecção de tipo pelos bytes", () => {
  it("reconhece JPG, PNG e WebP e recusa SVG", () => {
    expect(detectarTipo(JPG)).toBe("image/jpeg");
    expect(detectarTipo(PNG)).toBe("image/png");
    expect(detectarTipo(WEBP)).toBe("image/webp");
    expect(detectarTipo(SVG)).toBeNull();
  });
});

function suiteArquivos(nome: string, criar: () => ArquivoStorage, chave: string) {
  describe(`ArquivoStorage: ${nome}`, () => {
    let s: ArquivoStorage;
    beforeEach(() => {
      s = criar();
    });

    it("grava, lê e remove", async () => {
      expect(await s.gravar(chave, PNG, "image/png")).toEqual({ chave, tipo: "image/png", tamanho: PNG.byteLength });
      const lido = await s.ler(chave);
      expect(lido?.tipo).toBe("image/png");
      expect([...lido!.bytes]).toEqual([...PNG]);
      await s.remover(chave);
      expect(await s.ler(chave)).toBeNull();
    });

    it("lê nulo para chave inexistente", async () => {
      expect(await s.ler(chave.replace(/[^/]+$/, "nao-existe.png"))).toBeNull();
    });

    it("recusa SVG com a lista de formatos aceitos", async () => {
      const p = s.gravar(chave, SVG, "image/svg+xml");
      await recusa(p, "tipo");
      await expect(s.gravar(chave, SVG, "image/svg+xml")).rejects.toThrow("JPG, PNG ou WebP");
    });

    it("recusa tipo declarado diferente do real", async () => {
      await recusa(s.gravar(chave, JPG, "image/png"), "tipo");
    });

    it("recusa arquivo acima de 10 MB", async () => {
      const grande = new Uint8Array(TAMANHO_MAXIMO_BYTES + 1);
      grande.set(PNG);
      await recusa(s.gravar(chave, grande, "image/png"), "tamanho");
    });

    it("aceita exatamente 10 MB", async () => {
      const limite = new Uint8Array(TAMANHO_MAXIMO_BYTES);
      limite.set(PNG);
      await expect(s.gravar(chave, limite, "image/png")).resolves.toMatchObject({ tamanho: TAMANHO_MAXIMO_BYTES });
    });

    it("recusa chave com subida de diretório ou fora dos prefixos", async () => {
      await recusa(s.gravar("empreendimentos/t/e/../../segredo.png", PNG, "image/png"), "chave");
      await recusa(s.gravar("outro/arquivo.png", PNG, "image/png"), "chave");
    });
  });
}

let pasta: string;
beforeEach(() => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "imob-arquivos-"));
});
afterEach(() => fs.rmSync(pasta, { recursive: true, force: true }));

suiteArquivos("disco local", () => criarArmazenamentoEmDisco(pasta), CHAVE_EMP.replace(".jpg", ".png"));
suiteArquivos("IndexedDB (imagens da plataforma)", () => criarImagensPlataformaIdb(new IDBFactory()), CHAVE_PLAT);

describe("IndexedDB só guarda imagens da plataforma", () => {
  it("recusa imagem de empreendimento", async () => {
    await recusa(criarImagensPlataformaIdb(new IDBFactory()).gravar(CHAVE_EMP, JPG, "image/jpeg"), "chave");
  });
});

describe("disco local grava por tenant e empreendimento", () => {
  it("cria o arquivo no caminho da chave", async () => {
    await criarArmazenamentoEmDisco(pasta).gravar(CHAVE_EMP, JPG, "image/jpeg");
    expect(fs.existsSync(path.join(pasta, "empreendimentos", "tenant-1", "emp-1", "capa.jpg"))).toBe(true);
  });
});
