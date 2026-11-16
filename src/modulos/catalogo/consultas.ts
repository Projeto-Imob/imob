/**
 * Consultas do catálogo. Só servidor: importado direto, nunca reexportado pelo índice do módulo.
 * A vitrine pública lê pela consultaPublica (sem conta, só leitura, com o RLS do visitante) e filtra por
 * app.na_vitrine: a elegibilidade da página vem só do banco (decisão da fatia 0.3; a paridade com a regra
 * em TypeScript fica para a 0.5).
 */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { consultaPublica } from "@/server/db";
import { empreendimentos, subcondominios, tenants } from "@/server/db/schema";
import { empreendimento } from "./tipos";

/** O formato de slug do cadastro, com teto de tamanho: fora dele, "não encontrado" sem ir ao banco. */
const slugPublico = empreendimento.shape.slug.max(120);

/** Resumo público do empreendimento: sem dado comercial (regra 7). */
export type EmpreendimentoPublico = {
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  descricao: string;
  percentualObra: number;
  /** Nome comercial da incorporadora, público quando ela tem empreendimento na vitrine. */
  construtora: string | null;
  /** Maior data de entrega entre as torres que o público vê (AAAA-MM-DD); nula se nenhuma tem data. */
  entrega: string | null;
  /** Registro de incorporação: todo empreendimento da vitrine tem (regra 1). */
  ri: { numero: string; cartorio: string; dataRegistro: string; patrimonioAfetacao: boolean | null };
};

/** Nulo para slug fora do formato, inexistente ou fora da vitrine: a página responde "não encontrado". */
export async function lerEmpreendimentoPublico(slug: string): Promise<EmpreendimentoPublico | null> {
  const valido = slugPublico.safeParse(slug);
  if (!valido.success) return null;
  return consultaPublica(async (tx) => {
    const [e] = await tx
      .select({
        id: empreendimentos.id,
        slug: empreendimentos.slug,
        nome: empreendimentos.nome,
        bairro: empreendimentos.bairro,
        cidade: empreendimentos.cidade,
        uf: empreendimentos.uf,
        descricao: empreendimentos.descricao,
        percentualObra: empreendimentos.percentualObra,
        riNumero: empreendimentos.riNumero,
        riCartorio: empreendimentos.riCartorio,
        riDataRegistro: empreendimentos.riDataRegistro,
        riPatrimonioAfetacao: empreendimentos.riPatrimonioAfetacao,
        construtora: tenants.nomeComercial,
      })
      .from(empreendimentos)
      .leftJoin(tenants, eq(tenants.id, empreendimentos.tenantId))
      .where(and(eq(empreendimentos.slug, valido.data), sql`app.na_vitrine(${empreendimentos.id})`))
      .limit(1);
    if (!e?.riNumero || !e.riCartorio || !e.riDataRegistro) return null;

    // O RLS do visitante esconde as torres não lançadas: a entrega vem só das que ele vê (D15).
    const [torres] = await tx
      .select({ entrega: sql<string | null>`max(${subcondominios.dataEntrega})::text` })
      .from(subcondominios)
      .where(eq(subcondominios.empreendimentoId, e.id));

    return {
      slug: e.slug,
      nome: e.nome,
      bairro: e.bairro,
      cidade: e.cidade,
      uf: e.uf,
      descricao: e.descricao,
      percentualObra: e.percentualObra,
      construtora: e.construtora,
      entrega: torres?.entrega ?? null,
      ri: {
        numero: e.riNumero,
        cartorio: e.riCartorio,
        dataRegistro: e.riDataRegistro,
        patrimonioAfetacao: e.riPatrimonioAfetacao,
      },
    };
  });
}
