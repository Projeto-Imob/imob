/**
 * Motivo por template, sem IA (tarefa 2.9; CLAUDE.md "Motivo").
 * Usa o componente de maior peso × nota e junta o segundo, se couber em 140 caracteres.
 * Marcador sem valor tira a frase inteira. Sem frase possível, usa o texto padrão da especificação.
 * Todo número vem do cadastro ou das respostas da pessoa e é interpolado pelo sistema.
 */
import { interpolar, ptBR, type ChaveTexto, type Sobreposicoes } from "@/i18n/pt-BR";
import type { EmpreendimentoCompleto } from "./catalogo";
import { minutosAPe } from "./geo";
import { CATEGORIAS_PONTOS_NOTA, type Avaliacao, type Componente } from "./nota";

export const LIMITE_MOTIVO = 140;

export type Motivo = {
  texto: string;
  /** Valores interpolados, para auditoria e para o teste de números. */
  valores: string[];
  /** Componentes usados, em ordem. */
  componentes: Componente["chave"][];
};

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Frase = { chave: ChaveTexto; vars: Record<string, string | null> };

function frase(c: Componente, e: EmpreendimentoCompleto): Frase | null {
  const d = c.detalhe;
  switch (c.chave) {
    case "financeiro":
      return { chave: "motivo.financeiro", vars: { entrada: typeof d.entradaExigida === "number" ? reais.format(d.entradaExigida) : null } };
    case "tipologia": {
      const n = typeof d.unidadesCompativeis === "number" ? d.unidadesCompativeis : null;
      return { chave: n === 1 ? "motivo.tipologia.one" : "motivo.tipologia", vars: { n: n === null ? null : String(n) } };
    }
    case "localizacao": {
      if (d.regiao !== null && d.regiao !== undefined) return { chave: "motivo.localizacao.regiao", vars: { bairro: e.empreendimento.bairro } };
      const ponto = e.empreendimento.pontosProximos
        .filter((p) => CATEGORIAS_PONTOS_NOTA.includes(p.categoria))
        .sort((a, b) => a.distanciaM - b.distanciaM)[0];
      return { chave: "motivo.localizacao.pontos", vars: { minutos: ponto ? String(minutosAPe(ponto.distanciaM)) : null, ponto: ponto?.nome ?? null } };
    }
    case "requisitos":
      return {
        chave: "motivo.requisitos",
        vars: {
          atendidos: typeof d.atendidos === "number" && d.atendidos > 0 ? String(d.atendidos) : null,
          pedidos: typeof d.pedidos === "number" ? String(d.pedidos) : null,
        },
      };
    case "comportamento":
      return { chave: "motivo.comportamento", vars: {} };
  }
}

/** Monta a frase; nula se algum marcador do modelo ficar sem valor. */
function montar(f: Frase, sobreposicoes?: Sobreposicoes): { texto: string; valores: string[] } | null {
  const modelo = sobreposicoes?.[f.chave] ?? ptBR[f.chave];
  const marcadores = [...modelo.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const valores: string[] = [];
  for (const m of marcadores) {
    const v = f.vars[m];
    if (v === null || v === undefined || v === "") return null;
    valores.push(v);
  }
  return { texto: interpolar(modelo, f.vars as Record<string, string>), valores };
}

function encurtar(texto: string): string {
  return texto.length <= LIMITE_MOTIVO ? texto : `${texto.slice(0, LIMITE_MOTIVO - 1).trimEnd()}…`;
}

export function motivoPorTemplate(a: Avaliacao, e: EmpreendimentoCompleto, sobreposicoes?: Sobreposicoes): Motivo {
  const ordenados = a.componentes
    .filter((c): c is Componente & { valor: number } => c.valor !== null && c.valor > 0)
    .sort((x, y) => y.peso * y.valor - x.peso * x.valor);

  const frases: Array<{ chave: Componente["chave"]; texto: string; valores: string[] }> = [];
  for (const c of ordenados) {
    const f = frase(c, e);
    const montada = f && montar(f, sobreposicoes);
    if (montada && montada.texto.length <= LIMITE_MOTIVO) frases.push({ chave: c.chave, ...montada });
    if (frases.length === 2) break;
  }

  const [primeira, segunda] = frases;
  if (primeira) {
    const junta = segunda ? `${primeira.texto} ${segunda.texto}` : null;
    if (junta && segunda && junta.length <= LIMITE_MOTIVO) {
      return { texto: junta, valores: [...primeira.valores, ...segunda.valores], componentes: [primeira.chave, segunda.chave] };
    }
    return { texto: primeira.texto, valores: primeira.valores, componentes: [primeira.chave] };
  }

  const { nome, bairro } = e.empreendimento;
  const padrao = interpolar(sobreposicoes?.["motivo.padrao"] ?? ptBR["motivo.padrao"], { nome, bairro });
  return { texto: encurtar(padrao), valores: [nome, bairro], componentes: [] };
}
