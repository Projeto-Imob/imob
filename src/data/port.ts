/**
 * Portas dos repositórios (tarefa 2.12; design D3). Componentes falam só com estas interfaces;
 * os adaptadores são `local.ts` (LocalStorage, modo demo) e `postgres.ts` (grupo 4).
 * A mesma suíte de contrato (tests/contrato) roda contra os dois.
 * Repositórios de lead, CRM, house e conteúdo entram nos grupos que os usam.
 */
import type { EmpreendimentoCompleto } from "@/dominio/catalogo";
import type { Evento, Perfil, TipoEvento } from "@/dominio/tipos";

/** Dono dos dados do comprador: a conta, se logado; senão o visitante anônimo. */
export type Dono = { visitorId: string; contaId: string | null };

export type ContextoLeitura = {
  /** Hoje, AAAA-MM-DD. */
  hoje: string;
  campanhaTenantId?: string | null;
};

export interface EmpreendimentoRepo {
  /** Base elegível do comprador (contador, resultado, mapa, alertas). */
  listarBaseElegivel(ctx: ContextoLeitura): Promise<EmpreendimentoCompleto[]>;
  /** Página pública: só elegíveis; não listado só com login (regra aplicada na rota). */
  obterPorSlug(slug: string): Promise<EmpreendimentoCompleto | null>;
}

export type ProgressoQuestionario = {
  perfil: Perfil;
  /** Id da pergunta em que a pessoa parou. */
  perguntaAtual: string;
  concluido: boolean;
  atualizadoEm: string;
};

export interface ProfileRepo {
  obter(dono: Dono): Promise<ProgressoQuestionario | null>;
  salvar(dono: Dono, progresso: ProgressoQuestionario): Promise<void>;
  remover(dono: Dono): Promise<void>;
}

export interface FavoriteRepo {
  listar(dono: Dono): Promise<string[]>;
  adicionar(dono: Dono, empreendimentoId: string): Promise<void>;
  remover(dono: Dono, empreendimentoId: string): Promise<void>;
}

export type TipoAlerta = "perfil" | "favorito" | "area" | "preco" | "obra";
export type CanalAlerta = "whatsapp" | "email" | "push";
export type EstadoAlerta = "ativo" | "pausado" | "desligado";

export type Alerta = {
  id: string;
  tipo: TipoAlerta;
  canal: CanalAlerta;
  frequencia: "imediata" | "diaria" | "semanal";
  estado: EstadoAlerta;
  /** Empreendimento (favorito, preço, obra) ou recorte (área). */
  empreendimentoId: string | null;
  area: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null;
  vistoEm: string | null;
  criadoEm: string;
};

export type NovoAlerta = Omit<Alerta, "id" | "estado" | "vistoEm" | "criadoEm">;

export interface AlertRepo {
  listar(dono: Dono): Promise<Alerta[]>;
  criar(dono: Dono, alerta: NovoAlerta): Promise<Alerta>;
  alterarEstado(dono: Dono, id: string, estado: EstadoAlerta): Promise<void>;
  marcarVisto(dono: Dono, id: string): Promise<void>;
}

export type NovoEvento = {
  tipo: TipoEvento;
  empreendimentoId?: string | null;
  dados?: Record<string, unknown>;
};

export type ContextoEvento = Dono & {
  /** God mode ou impersonate: navegação privilegiada não gera evento (regra 12). */
  privilegiado: boolean;
};

export interface EventRepo {
  /** Grava o evento anônimo; devolve nulo quando não grava (navegação privilegiada). */
  registrar(evento: NovoEvento, ctx: ContextoEvento): Promise<Evento | null>;
  listar(dono: Dono): Promise<Evento[]>;
}

export type Repositorios = {
  empreendimentos: EmpreendimentoRepo;
  perfis: ProfileRepo;
  favoritos: FavoriteRepo;
  alertas: AlertRepo;
  eventos: EventRepo;
};
