/**
 * Regras dos eventos anônimos (tarefa 2.13; spec analytics/eventos-e-engajamento), comuns aos adaptadores:
 * ID anônimo, sem IP, sem posição exata e nenhum registro em god mode ou impersonate.
 */
import { tipoEvento, type Evento } from "@/dominio/tipos";
import type { ContextoEvento, NovoEvento } from "./port";

/** Chaves que nunca são gravadas: IP e posição exata (regra 9). */
const CHAVES_PROIBIDAS = /^(ip|ips|endereco_?ip|ip_?address|x_?forwarded_?for|lat|lng|lon|long|latitude|longitude|posicao|coords?|coordenadas|geo|localizacao|accuracy|precisao)$/i;

type ValorEvento = Evento["dados"][string];

function valorPermitido(v: unknown): v is ValorEvento {
  if (v === null || typeof v === "string" || typeof v === "boolean") return true;
  if (typeof v === "number") return Number.isFinite(v);
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Remove IP, posição e valores não serializáveis. Objetos aninhados são descartados (podem esconder coordenadas). */
export function sanitizarDados(dados: Record<string, unknown> | undefined): Evento["dados"] {
  const limpo: Evento["dados"] = {};
  for (const [chave, valor] of Object.entries(dados ?? {})) {
    if (CHAVES_PROIBIDAS.test(chave)) continue;
    if (valorPermitido(valor)) limpo[chave] = valor;
  }
  return limpo;
}

export function montarEvento(
  e: NovoEvento,
  ctx: ContextoEvento,
  gerarId: () => string,
  agora: Date,
): Evento | null {
  if (ctx.privilegiado) return null;
  return {
    id: gerarId(),
    visitorId: ctx.visitorId,
    contaId: ctx.contaId,
    tipo: tipoEvento.parse(e.tipo),
    empreendimentoId: e.empreendimentoId ?? null,
    dados: sanitizarDados(e.dados),
    criadoEm: agora.toISOString(),
  };
}
