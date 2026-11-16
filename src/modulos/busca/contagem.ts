/**
 * Contagem ao vivo do questionário e ampliação (tarefa 2.6; spec busca/questionario).
 * Recebe a base já elegível. No modo postgres, a mesma regra roda em SQL (teste de paridade no grupo 4).
 */
import { scoringConfig } from "@config/scoring.config";
import { distanciaM } from "@/lib/geo";
import type { EmpreendimentoCompleto } from "@/modulos/catalogo";
import { filtrar, type ContextoBusca } from "./filtros";
import type { OpcaoQuartos, Perfil } from "./tipos";

/** Perguntas que reduzem a base e têm contagem por opção. */
export type PerguntaFiltro = "prazo" | "quartos" | "regiao" | "permuta" | "requisitos" | "pagamento";

/** Valor especial de região para "Perto de mim". */
export const PERTO_DE_MIM = "perto_de_mim";

export function contar(base: EmpreendimentoCompleto[], perfil: Perfil, ctx: ContextoBusca): number {
  return base.reduce((n, e) => (filtrar(e, perfil, ctx).passa ? n + 1 : n), 0);
}

/**
 * Perfil com a opção aplicada para contar.
 * Perguntas "ou" (prazo, quartos, região, permuta): considera só aquela opção.
 * Pergunta "e" (requisitos): soma a opção às já marcadas.
 */
export function perfilComOpcao(perfil: Perfil, pergunta: Exclude<PerguntaFiltro, "pagamento">, opcao: string): Perfil {
  const p = structuredClone(perfil);
  switch (pergunta) {
    case "prazo":
      p.prazo = opcao as Perfil["prazo"];
      break;
    case "quartos":
      p.quartos = [opcao as OpcaoQuartos];
      break;
    case "regiao":
      p.regiao =
        opcao === PERTO_DE_MIM
          ? { bairros: [], bairrosVizinhos: [], pertoDeMim: true }
          : { bairros: [opcao], bairrosVizinhos: [], pertoDeMim: false };
      break;
    case "permuta":
      p.permuta = opcao as Perfil["permuta"];
      break;
    case "requisitos":
      p.requisitos = { ...p.requisitos, chips: [...new Set([...p.requisitos.chips, opcao])] };
      break;
  }
  return p;
}

/** Contagem de uma opção. "Perto de mim" sem posição não é contado (nulo). */
export function contarOpcao(
  base: EmpreendimentoCompleto[],
  perfil: Perfil,
  pergunta: Exclude<PerguntaFiltro, "pagamento">,
  opcao: string,
  ctx: ContextoBusca,
): number | null {
  if (pergunta === "regiao" && opcao === PERTO_DE_MIM && !ctx.posicao) return null;
  return contar(base, perfilComOpcao(perfil, pergunta, opcao), ctx);
}

export type ContagemOpcao = { opcao: string; contagem: number | null; desabilitada: boolean };

/** Regra do zero: a opção que levaria a zero fica desabilitada ("nenhum no momento"). */
export function contarOpcoes(
  base: EmpreendimentoCompleto[],
  perfil: Perfil,
  pergunta: Exclude<PerguntaFiltro, "pagamento">,
  opcoes: readonly string[],
  ctx: ContextoBusca,
): ContagemOpcao[] {
  return opcoes.map((opcao) => {
    const contagem = contarOpcao(base, perfil, pergunta, opcao, ctx);
    return { opcao, contagem, desabilitada: contagem === 0 };
  });
}

/** Bairros da base elegível, em ordem alfabética (opções da pergunta de região). */
export function bairrosDaBase(base: EmpreendimentoCompleto[]): string[] {
  return [...new Set(base.map((e) => e.empreendimento.bairro))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Com menos de 3 no conjunto, o sistema sugere ampliar. */
export const LIMITE_SUGERIR_AMPLIAR = 3;
export function deveSugerirAmpliar(contagem: number): boolean {
  return contagem < LIMITE_SUGERIR_AMPLIAR;
}

/**
 * Bairros da base a até o raio de ampliação (3,5 km, Proposta) de algum empreendimento
 * dos bairros escolhidos, sem repetir os já escolhidos.
 */
export function bairrosVizinhos(base: EmpreendimentoCompleto[], escolhidos: string[], raioKm = scoringConfig.proposta.raioAmpliacaoRegiaoKm): string[] {
  const doEscolhido = base.filter((e) => escolhidos.includes(e.empreendimento.bairro));
  const vizinhos = base
    .filter((e) => !escolhidos.includes(e.empreendimento.bairro))
    .filter((e) => doEscolhido.some((d) => distanciaM(d.empreendimento.localizacao, e.empreendimento.localizacao) <= raioKm * 1000))
    .map((e) => e.empreendimento.bairro);
  return [...new Set(vizinhos)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Ampliar relaxa o último filtro: na região, inclui bairros vizinhos; prazo vira "posso esperar";
 * quartos fica vazio; pagamento perde os valores; permuta vira "não"; requisitos fica sem chips.
 */
export function ampliar(pergunta: PerguntaFiltro, perfil: Perfil, base: EmpreendimentoCompleto[]): Perfil {
  const p = structuredClone(perfil);
  switch (pergunta) {
    case "regiao": {
      const novos = bairrosVizinhos(base, p.regiao.bairros);
      p.regiao.bairrosVizinhos = [...new Set([...p.regiao.bairrosVizinhos, ...novos])];
      break;
    }
    case "prazo":
      p.prazo = "posso_esperar";
      break;
    case "quartos":
      p.quartos = [];
      break;
    case "pagamento":
      p.pagamento = { ...p.pagamento, entrada: null, parcelaMaxima: null };
      break;
    case "permuta":
      p.permuta = "nao";
      break;
    case "requisitos":
      p.requisitos = { ...p.requisitos, chips: [] };
      break;
  }
  return p;
}
