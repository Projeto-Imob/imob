/**
 * Adaptador local dos repositórios (tarefa 2.12): catálogo do seed fictício em memória e dados do
 * comprador no LocalStorage versionado. É o modo padrão (NEXT_PUBLIC_DATA_SOURCE=local).
 */
import { montarCompletos, type EmpreendimentoCompleto } from "@/dominio/catalogo";
import { baseElegivel } from "@/dominio/elegibilidade";
import type { Evento } from "@/dominio/tipos";
import { gerarSeed, type Seed } from "@/seed/seed";
import { carregar, salvar, type ArmazenamentoChaveValor, type DadosLocais, type NomeColecao, type ValorColecao } from "./armazenamento-local";
import { montarEvento } from "./eventos";
import type { Alerta, Dono, Repositorios } from "./port";

export type OpcoesLocais = {
  armazenamento: ArmazenamentoChaveValor;
  /** Relógio injetável. */
  agora?: () => Date;
  gerarId?: () => string;
  seed?: Seed;
};

/** Chave do dono: a conta, se houver; senão o visitante. */
export const chaveDono = (d: Dono) => (d.contaId ? `conta:${d.contaId}` : `visitante:${d.visitorId}`);

/** Limite de eventos guardados por dono no navegador. */
const LIMITE_EVENTOS_LOCAIS = 500;

export function criarRepositoriosLocais(opcoes: OpcoesLocais): Repositorios {
  const agora = opcoes.agora ?? (() => new Date());
  const gerarId = opcoes.gerarId ?? (() => crypto.randomUUID());
  const catalogo: EmpreendimentoCompleto[] = montarCompletos(opcoes.seed ?? gerarSeed());
  const arm = opcoes.armazenamento;

  const ler = (): DadosLocais => carregar(arm, agora());
  function alterar<N extends NomeColecao>(nome: N, dono: Dono, fn: (atual: ValorColecao<N> | undefined) => ValorColecao<N> | undefined) {
    const dados = ler();
    const colecao = dados.colecoes[nome] as Record<string, ValorColecao<N>>;
    const chave = chaveDono(dono);
    const novo = fn(colecao[chave]);
    if (novo === undefined) delete colecao[chave];
    else colecao[chave] = novo;
    salvar(arm, dados);
  }
  const obter = <N extends NomeColecao>(nome: N, dono: Dono) =>
    (ler().colecoes[nome] as Record<string, ValorColecao<N>>)[chaveDono(dono)];

  return {
    empreendimentos: {
      async listarBaseElegivel(ctx) {
        return structuredClone(baseElegivel(catalogo, ctx));
      },
      async obterPorSlug(slug) {
        const e = catalogo.find((c) => c.empreendimento.slug === slug);
        return e ? structuredClone(e) : null;
      },
    },

    perfis: {
      async obter(dono) {
        return obter("perfis", dono) ?? null;
      },
      async salvar(dono, progresso) {
        alterar("perfis", dono, () => structuredClone(progresso));
      },
      async remover(dono) {
        alterar("perfis", dono, () => undefined);
      },
    },

    favoritos: {
      async listar(dono) {
        return [...(obter("favoritos", dono) ?? [])];
      },
      async adicionar(dono, id) {
        alterar("favoritos", dono, (atual = []) => (atual.includes(id) ? atual : [...atual, id]));
      },
      async remover(dono, id) {
        alterar("favoritos", dono, (atual = []) => atual.filter((f) => f !== id));
      },
    },

    alertas: {
      async listar(dono) {
        return structuredClone(obter("alertas", dono) ?? []);
      },
      async criar(dono, novo) {
        const alerta: Alerta = { ...structuredClone(novo), id: gerarId(), estado: "ativo", vistoEm: null, criadoEm: agora().toISOString() };
        alterar("alertas", dono, (atual = []) => [...atual, alerta]);
        return structuredClone(alerta);
      },
      async alterarEstado(dono, id, estado) {
        alterar("alertas", dono, (atual = []) => atual.map((a) => (a.id === id ? { ...a, estado } : a)));
      },
      async marcarVisto(dono, id) {
        const em = agora().toISOString();
        alterar("alertas", dono, (atual = []) => atual.map((a) => (a.id === id ? { ...a, vistoEm: em } : a)));
      },
    },

    eventos: {
      async registrar(novo, ctx) {
        const e = montarEvento(novo, ctx, gerarId, agora());
        if (!e) return null;
        alterar("eventos", ctx, (atual = []) => [...atual, e].slice(-LIMITE_EVENTOS_LOCAIS));
        return structuredClone(e);
      },
      async listar(dono): Promise<Evento[]> {
        return structuredClone(obter("eventos", dono) ?? []);
      },
    },
  };
}
