/** Eventos de uso anônimos (spec analytics/eventos-e-engajamento). Schemas Zod estritos. */
import { z } from "zod";
import { dataHoraIso, id } from "@/lib/esquemas";

export const TIPOS_EVENTO = [
  "quiz_start", "quiz_answer", "quiz_option_disabled", "quiz_widen_accepted", "quiz_complete", "contact_submitted",
  "result_view", "result_why_open", "result_map_open", "map_open", "map_geo_permission", "map_move", "map_pin_click",
  "map_empty_area", "map_area_alert_created", "project_view", "costs_simulated", "manager_contact", "visit_started",
  "visit_scheduled", "favorite_add", "alert_created", "mode_changed",
] as const;
export const tipoEvento = z.enum(TIPOS_EVENTO);
export type TipoEvento = z.infer<typeof tipoEvento>;

const valorEvento = z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]);

export const evento = z.strictObject({
  id,
  /** ID anônimo do navegador; nunca IP nem posição exata. */
  visitorId: id,
  contaId: id.nullable(),
  tipo: tipoEvento,
  empreendimentoId: id.nullable(),
  dados: z.record(z.string(), valorEvento),
  criadoEm: dataHoraIso,
});
export type Evento = z.infer<typeof evento>;

/** Dono dos dados do comprador: a conta, se logado; senão o visitante anônimo. */
export type Dono = { visitorId: string; contaId: string | null };

export type NovoEvento = {
  tipo: TipoEvento;
  empreendimentoId?: string | null;
  dados?: Record<string, unknown>;
};

export type ContextoEvento = Dono & {
  /** God mode ou impersonate: navegação privilegiada não gera evento (regra 12). */
  privilegiado: boolean;
};
