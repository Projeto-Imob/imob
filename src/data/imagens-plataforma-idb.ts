/**
 * Imagens da plataforma no modo local (logotipos, favicon, destaque editados pelo god mode),
 * guardadas no IndexedDB e não no LocalStorage, por causa do limite de cerca de 5 MB (seção 11).
 * Aceita só chaves conteudo-plataforma/...; imagens de empreendimento nunca ficam no navegador.
 */
import { ArquivoRecusado, validarChave, validarImagem, type ArquivoLido, type ArquivoStorage } from "./arquivos";

const BANCO = "imob-imagens";
const LOJA = "arquivos";

function abrir(fabrica: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolver, rejeitar) => {
    const pedido = fabrica.open(BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

function operar<T>(db: IDBDatabase, modo: IDBTransactionMode, fn: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolver, rejeitar) => {
    const tx = db.transaction(LOJA, modo);
    const pedido = fn(tx.objectStore(LOJA));
    tx.oncomplete = () => resolver(pedido.result);
    tx.onerror = () => rejeitar(tx.error);
    tx.onabort = () => rejeitar(tx.error);
  });
}

function apenasPlataforma(chave: string) {
  validarChave(chave);
  if (!chave.startsWith("conteudo-plataforma/")) {
    throw new ArquivoRecusado("chave", "No navegador ficam só as imagens da plataforma.");
  }
}

/** `fabrica` é o indexedDB do navegador; nos testes, o fake-indexeddb. */
export function criarImagensPlataformaIdb(fabrica: IDBFactory = globalThis.indexedDB): ArquivoStorage {
  let conexao: Promise<IDBDatabase> | null = null;
  const db = () => (conexao ??= abrir(fabrica));

  return {
    async gravar(chave, bytes, tipoDeclarado) {
      apenasPlataforma(chave);
      const tipo = validarImagem(chave, bytes, tipoDeclarado);
      const registro: ArquivoLido = { bytes: new Uint8Array(bytes), tipo };
      await operar(await db(), "readwrite", (l) => l.put(registro, chave));
      return { chave, tipo, tamanho: bytes.byteLength };
    },
    async ler(chave) {
      apenasPlataforma(chave);
      const r = await operar<ArquivoLido | undefined>(await db(), "readonly", (l) => l.get(chave));
      return r ? { bytes: new Uint8Array(r.bytes), tipo: r.tipo } : null;
    },
    async remover(chave) {
      apenasPlataforma(chave);
      await operar(await db(), "readwrite", (l) => l.delete(chave));
    },
  };
}
