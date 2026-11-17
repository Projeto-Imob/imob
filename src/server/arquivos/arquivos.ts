/**
 * Porta ArquivoStorage e validação comum de arquivos (design D15). Só roda no servidor.
 * Adaptadores: disco local (./disco.ts, desenvolvimento e e2e) e, na fatia 1.8, o R2 (S3 compatível).
 * Imagens: só JPG, PNG e WebP, até 10 MB; SVG nunca. O tipo é conferido pelos bytes.
 */

export type TipoImagem = "image/jpeg" | "image/png" | "image/webp";
export const TIPOS_ACEITOS: readonly TipoImagem[] = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export type ArquivoGravado = { chave: string; tipo: TipoImagem; tamanho: number };
export type ArquivoLido = { bytes: Uint8Array; tipo: TipoImagem };

export interface ArquivoStorage {
  gravar(chave: string, bytes: Uint8Array, tipoDeclarado: string): Promise<ArquivoGravado>;
  ler(chave: string): Promise<ArquivoLido | null>;
  remover(chave: string): Promise<void>;
}

export type MotivoRecusa = "tipo" | "tamanho" | "chave";

export class ArquivoRecusado extends Error {
  constructor(
    readonly motivo: MotivoRecusa,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ArquivoRecusado";
  }
}

const comeca = (b: Uint8Array, assinatura: number[], deslocamento = 0) =>
  assinatura.every((byte, i) => b[deslocamento + i] === byte);

/** Tipo real pelos primeiros bytes; nulo para qualquer outro formato (inclusive SVG). */
export function detectarTipo(bytes: Uint8Array): TipoImagem | null {
  if (comeca(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (comeca(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (comeca(bytes, [0x52, 0x49, 0x46, 0x46]) && comeca(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/**
 * Chaves por tenant (design D15): empreendimentos/{tenant}/{empreendimento}/{arquivo}
 * ou conteudo-plataforma/{arquivo}. Sem "..", barra invertida ou caracteres fora do conjunto seguro.
 */
const SEGMENTO = "[A-Za-z0-9][A-Za-z0-9._-]*";
const CHAVE_VALIDA = new RegExp(`^(?:empreendimentos/${SEGMENTO}/${SEGMENTO}|conteudo-plataforma)(?:/${SEGMENTO})+$`);

export function validarChave(chave: string): void {
  if (!CHAVE_VALIDA.test(chave) || chave.split("/").some((s) => s === ".." || s === ".")) {
    throw new ArquivoRecusado("chave", `Chave de arquivo inválida: ${chave}`);
  }
}

/** Valida chave, tamanho e tipo (declarado e real precisam ser JPG, PNG ou WebP e coincidir). */
export function validarImagem(chave: string, bytes: Uint8Array, tipoDeclarado: string): TipoImagem {
  validarChave(chave);
  if (bytes.byteLength > TAMANHO_MAXIMO_BYTES) {
    throw new ArquivoRecusado("tamanho", "Arquivo acima de 10 MB.");
  }
  const real = detectarTipo(bytes);
  if (!real || !TIPOS_ACEITOS.includes(tipoDeclarado as TipoImagem) || real !== tipoDeclarado) {
    throw new ArquivoRecusado("tipo", "Formato não aceito. Envie JPG, PNG ou WebP.");
  }
  return real;
}
