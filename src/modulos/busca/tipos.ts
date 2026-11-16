/** Perfil: as respostas do questionário (spec busca-e-recomendacao). Schemas Zod estritos. */
import { z } from "zod";
import { reais } from "@/lib/esquemas";

export const modo = z.enum(["morar", "investir"]);
export type Modo = z.infer<typeof modo>;

export const opcaoQuartos = z.enum(["studio", "1", "2", "3", "4+"]);
export type OpcaoQuartos = z.infer<typeof opcaoQuartos>;

export const formaPagamento = z.enum(["a_vista", "financiamento_bancario", "direto_construtora", "fgts"]);
export type FormaPagamento = z.infer<typeof formaPagamento>;

export const perfil = z.strictObject({
  modo: modo.nullable(),
  prazo: z.enum(["agora", "posso_esperar"]).nullable(),
  quartos: z.array(opcaoQuartos),
  regiao: z.strictObject({
    bairros: z.array(z.string().min(1)),
    /** Bairros acrescentados pela ampliação (nota 0,6 na localização). */
    bairrosVizinhos: z.array(z.string().min(1)),
    pertoDeMim: z.boolean(),
  }),
  pagamento: z.strictObject({
    formas: z.array(formaPagamento),
    entrada: reais.nullable(),
    parcelaMaxima: reais.nullable(),
  }),
  permuta: z.enum(["sim", "nao"]).nullable(),
  requisitos: z.strictObject({
    chips: z.array(z.string().min(1)),
    textoLivre: z.string().max(500).nullable(),
  }),
  decisao: z.enum(["1_mes", "3_meses", "6_meses", "sem_pressa"]).nullable(),
  primeiroInvestimento: z.enum(["sim", "nao"]).nullable(),
  foco: z.enum(["renda", "valorizacao", "os_dois"]).nullable(),
});
export type Perfil = z.infer<typeof perfil>;

export const PERFIL_VAZIO: Perfil = {
  modo: null,
  prazo: null,
  quartos: [],
  regiao: { bairros: [], bairrosVizinhos: [], pertoDeMim: false },
  pagamento: { formas: [], entrada: null, parcelaMaxima: null },
  permuta: null,
  requisitos: { chips: [], textoLivre: null },
  decisao: null,
  primeiroInvestimento: null,
  foco: null,
};
