/**
 * Adaptador de disco local do ArquivoStorage (desenvolvimento e e2e; design D15).
 * Só roda no servidor. Cada arquivo tem um .meta.json com o tipo.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ArquivoRecusado, validarChave, validarImagem, type ArquivoLido, type ArquivoStorage, type TipoImagem } from "@/data/arquivos";

export function criarArmazenamentoEmDisco(raiz: string): ArquivoStorage {
  const raizAbsoluta = path.resolve(raiz);

  function caminho(chave: string): string {
    validarChave(chave);
    const destino = path.resolve(raizAbsoluta, ...chave.split("/"));
    // Defesa extra contra saída da raiz, além da validação da chave.
    if (!destino.startsWith(raizAbsoluta + path.sep)) throw new ArquivoRecusado("chave", `Chave fora da raiz: ${chave}`);
    return destino;
  }

  return {
    async gravar(chave, bytes, tipoDeclarado) {
      const tipo = validarImagem(chave, bytes, tipoDeclarado);
      const destino = caminho(chave);
      await fs.mkdir(path.dirname(destino), { recursive: true });
      await fs.writeFile(destino, bytes);
      await fs.writeFile(`${destino}.meta.json`, JSON.stringify({ tipo }));
      return { chave, tipo, tamanho: bytes.byteLength };
    },

    async ler(chave): Promise<ArquivoLido | null> {
      const origem = caminho(chave);
      try {
        const [bytes, meta] = await Promise.all([fs.readFile(origem), fs.readFile(`${origem}.meta.json`, "utf8")]);
        return { bytes: new Uint8Array(bytes), tipo: (JSON.parse(meta) as { tipo: TipoImagem }).tipo };
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw erro;
      }
    },

    async remover(chave) {
      const alvo = caminho(chave);
      await fs.rm(alvo, { force: true });
      await fs.rm(`${alvo}.meta.json`, { force: true });
    },
  };
}
