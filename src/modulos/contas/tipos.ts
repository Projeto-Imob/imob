/** Tenants, contas e papéis (spec acesso-e-visibilidade). Schemas Zod estritos. */
import { z } from "zod";
import { exemplo, id } from "@/lib/esquemas";

export const situacaoTenant = z.enum(["implantacao", "ativo", "suspenso", "encerrado"]);

export const incorporadora = z.strictObject({
  id,
  tipo: z.literal("incorporadora"),
  nomeComercial: z.string().min(1),
  razaoSocial: z.string().min(1),
  situacao: situacaoTenant,
  exemplo,
});
export type Incorporadora = z.infer<typeof incorporadora>;

export const papel = z.enum([
  "buyer",
  "client_superadmin",
  "client_manager",
  "sales_member",
  "internal_seller",
  "internal_account_manager",
  "internal_admin",
  "internal_superadmin",
  "god_mode",
]);
export type Papel = z.infer<typeof papel>;

export const conta = z.strictObject({
  id,
  nome: z.string().min(1),
  email: z.email(),
  papel,
  /** Nulo para buyer e equipe da plataforma (inclui a house). */
  tenantId: id.nullable(),
  cargo: z.string().nullable(),
  whatsapp: z
    .string()
    .regex(/^\+?\d{10,13}$/)
    .nullable(),
  telefone: z
    .string()
    .regex(/^\+?\d{10,13}$/)
    .nullable(),
  ativa: z.boolean(),
  exemplo,
});
export type Conta = z.infer<typeof conta>;
