/**
 * Armazenamento do navegador com versão de schema e migração sem perda silenciosa (design D3):
 * tudo o que a migração remove fica registrado em `imob:migracoes`.
 * Só este módulo e os adaptadores de src/data tocam o LocalStorage (regra de lint).
 */
import { z } from "zod";
import { evento, perfil } from "@/dominio/tipos";

/** Interface mínima do LocalStorage, para trocar por memória nos testes. */
export type ArmazenamentoChaveValor = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const CHAVE_DADOS = "imob:dados";
export const CHAVE_MIGRACOES = "imob:migracoes";
export const VERSAO_ATUAL = 1;

const progresso = z.strictObject({
  perfil,
  perguntaAtual: z.string().min(1),
  concluido: z.boolean(),
  atualizadoEm: z.iso.datetime({ offset: true }),
});

const alerta = z.strictObject({
  id: z.string().min(1),
  tipo: z.enum(["perfil", "favorito", "area", "preco", "obra"]),
  canal: z.enum(["whatsapp", "email", "push"]),
  frequencia: z.enum(["imediata", "diaria", "semanal"]),
  estado: z.enum(["ativo", "pausado", "desligado"]),
  empreendimentoId: z.string().nullable(),
  area: z.strictObject({ minLng: z.number(), minLat: z.number(), maxLng: z.number(), maxLat: z.number() }).nullable(),
  vistoEm: z.iso.datetime({ offset: true }).nullable(),
  criadoEm: z.iso.datetime({ offset: true }),
});

/** Coleções por dono (chave = conta ou visitante) e seus validadores. */
const COLECOES = {
  perfis: progresso,
  favoritos: z.array(z.uuid()),
  alertas: z.array(alerta),
  eventos: z.array(evento),
} as const;

export type NomeColecao = keyof typeof COLECOES;
export type ValorColecao<N extends NomeColecao> = z.infer<(typeof COLECOES)[N]>;

export type DadosLocais = {
  versao: number;
  colecoes: { [N in NomeColecao]: Record<string, ValorColecao<N>> };
};

export type RegistroMigracao = {
  em: string;
  deVersao: number | null;
  paraVersao: number;
  removidos: Array<{ colecao: string; chave: string; motivo: string }>;
};

const vazio = (): DadosLocais => ({ versao: VERSAO_ATUAL, colecoes: { perfis: {}, favoritos: {}, alertas: {}, eventos: {} } });

/**
 * Migrações por versão de origem. Cada uma recebe o objeto bruto da versão anterior.
 * v0 → v1: formato antigo sem `versao` nem `colecoes` (protótipo); só as coleções conhecidas são aproveitadas.
 */
const MIGRACOES: Record<number, (bruto: Record<string, unknown>) => Record<string, unknown>> = {
  0: (bruto) => ({ versao: 1, colecoes: { perfis: bruto.perfis, favoritos: bruto.favoritos, alertas: bruto.alertas, eventos: bruto.eventos } }),
};

function registrar(armazenamento: ArmazenamentoChaveValor, registro: RegistroMigracao) {
  if (registro.removidos.length === 0 && registro.deVersao === registro.paraVersao) return;
  let historico: RegistroMigracao[] = [];
  try {
    historico = JSON.parse(armazenamento.getItem(CHAVE_MIGRACOES) ?? "[]") as RegistroMigracao[];
  } catch {
    historico = [];
  }
  historico.push(registro);
  armazenamento.setItem(CHAVE_MIGRACOES, JSON.stringify(historico.slice(-20)));
}

/** Lê, migra e valida. Entradas inválidas são removidas e registradas, nunca descartadas em silêncio. */
export function carregar(armazenamento: ArmazenamentoChaveValor, agora: Date): DadosLocais {
  const texto = armazenamento.getItem(CHAVE_DADOS);
  if (texto === null) return vazio();

  const removidos: RegistroMigracao["removidos"] = [];
  let bruto: Record<string, unknown>;
  try {
    bruto = JSON.parse(texto) as Record<string, unknown>;
    if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) throw new Error("formato");
  } catch {
    registrar(armazenamento, { em: agora.toISOString(), deVersao: null, paraVersao: VERSAO_ATUAL, removidos: [{ colecao: "*", chave: "*", motivo: "JSON ilegível" }] });
    return vazio();
  }

  const deVersao = typeof bruto.versao === "number" ? bruto.versao : 0;
  if (deVersao > VERSAO_ATUAL) {
    registrar(armazenamento, { em: agora.toISOString(), deVersao, paraVersao: VERSAO_ATUAL, removidos: [{ colecao: "*", chave: "*", motivo: `versão ${deVersao} desconhecida` }] });
    return vazio();
  }
  for (let v = deVersao; v < VERSAO_ATUAL; v++) {
    const migrar = MIGRACOES[v];
    if (!migrar) throw new Error(`Migração ausente para a versão ${v}`);
    bruto = migrar(bruto);
  }

  const dados = vazio();
  const colecoes = (bruto.colecoes ?? {}) as Record<string, unknown>;
  for (const nome of Object.keys(colecoes)) {
    if (!(nome in COLECOES)) removidos.push({ colecao: nome, chave: "*", motivo: "coleção desconhecida" });
  }
  for (const nome of Object.keys(COLECOES) as NomeColecao[]) {
    const entradas = colecoes[nome];
    if (entradas === undefined || entradas === null) continue;
    if (typeof entradas !== "object" || Array.isArray(entradas)) {
      removidos.push({ colecao: nome, chave: "*", motivo: "formato inválido" });
      continue;
    }
    for (const [chave, valor] of Object.entries(entradas as Record<string, unknown>)) {
      const r = COLECOES[nome].safeParse(valor);
      if (r.success) (dados.colecoes[nome] as Record<string, unknown>)[chave] = r.data;
      else removidos.push({ colecao: nome, chave, motivo: r.error.issues[0]?.message ?? "inválido" });
    }
  }

  registrar(armazenamento, { em: agora.toISOString(), deVersao, paraVersao: VERSAO_ATUAL, removidos });
  if (deVersao !== VERSAO_ATUAL || removidos.length > 0) salvar(armazenamento, dados);
  return dados;
}

export function salvar(armazenamento: ArmazenamentoChaveValor, dados: DadosLocais): void {
  armazenamento.setItem(CHAVE_DADOS, JSON.stringify(dados));
}

export function lerMigracoes(armazenamento: ArmazenamentoChaveValor): RegistroMigracao[] {
  try {
    return JSON.parse(armazenamento.getItem(CHAVE_MIGRACOES) ?? "[]") as RegistroMigracao[];
  } catch {
    return [];
  }
}

/** Armazenamento em memória (testes e navegador sem LocalStorage). */
export function armazenamentoEmMemoria(): ArmazenamentoChaveValor & { dump(): Record<string, string> } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

/** LocalStorage do navegador, ou memória quando indisponível (navegação privada, servidor). */
export function armazenamentoDoNavegador(): ArmazenamentoChaveValor {
  try {
    const ls = globalThis.localStorage;
    const teste = "imob:teste";
    ls.setItem(teste, "1");
    ls.removeItem(teste);
    return ls;
  } catch {
    return armazenamentoEmMemoria();
  }
}
