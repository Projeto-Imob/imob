/** Lead e atendimento (spec house). Schemas Zod estritos. */
import { z } from "zod";
import { dataHoraIso, exemplo, id, reais } from "@/lib/esquemas";
import { perfil } from "@/modulos/busca";

export const origemLead = z.enum(["busca", "contato_direto", "visita", "proposta", "campanha", "proprio"]);

export const lead = z.strictObject({
  id,
  origem: origemLead,
  /** Lead de campanha: só vê e recebe opções da incorporadora da campanha (regra 6). */
  campanhaTenantId: id.nullable(),
  contaId: id.nullable(),
  visitorId: id.nullable(),
  perfil: perfil.nullable(),
  /** Texto original dos requisitos, que vai também para o analista. */
  requisitosTextoOriginal: z.string().nullable(),
  criadoEm: dataHoraIso,
  exemplo,
});
export type Lead = z.infer<typeof lead>;

/** Contato em tabela separada (design D4): liberado à incorporadora só com interesse confirmado. */
export const leadContato = z.strictObject({
  leadId: id,
  nome: z.string().min(1),
  whatsapp: z.string().regex(/^\+?\d{10,13}$/),
  email: z.email().nullable(),
  optInWhatsapp: z.boolean(),
  exemplo,
});
export type LeadContato = z.infer<typeof leadContato>;

export const atendimento = z.strictObject({
  id,
  leadId: id,
  empreendimentoId: id,
  etapaId: id.nullable(),
  analistaContaId: id.nullable(),
  valorPotencial: reais.nullable(),
  proximaAcao: z.string().nullable(),
  etiquetas: z.array(z.string().min(1)),
  criadoEm: dataHoraIso,
  exemplo,
});
export type Atendimento = z.infer<typeof atendimento>;
