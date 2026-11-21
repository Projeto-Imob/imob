/**
 * Consultas do catálogo. Só servidor: importado direto, nunca reexportado pelo índice do módulo.
 * A vitrine pública lê pela consultaPublica (sem conta, só leitura, com o RLS do visitante) e filtra por
 * app.na_vitrine: a elegibilidade da página vem só do banco (decisão da fatia 0.3; a paridade com a regra
 * em TypeScript fica para a 0.5).
 */
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { consultaPublica } from "@/server/db";
import {
  empreendimentos,
  escritoriosVendas,
  planos,
  pontosProximos,
  subcondominios,
  tenants,
  tipologias,
  unidades,
} from "@/server/db/schema";
import type { PaginaEmpreendimento } from "./pagina";
import { empreendimento } from "./tipos";

/** O formato de slug do cadastro, com teto de tamanho: fora dele, "não encontrado" sem ir ao banco. */
const slugPublico = empreendimento.shape.slug.max(120);

/** Nulo para slug fora do formato, inexistente ou fora da vitrine: a página responde "não encontrado". */
export async function lerEmpreendimentoPublico(slug: string): Promise<PaginaEmpreendimento | null> {
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
        exemplo: empreendimentos.exemplo,
        comodidades: empreendimentos.comodidades,
        espelhoAtualizadoEm: empreendimentos.espelhoAtualizadoEm,
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

    // Só colunas públicas: nada de comissão, tenant_id, empreendimentos_comercial nem e-mail de login.
    // O RLS do visitante decide as linhas; a elegibilidade já foi checada por app.na_vitrine acima.
    const [tipologiasLidas, unidadesLidas, planosLidos, pontosLidos, [cartao]] = await Promise.all([
      tx
        .select({ id: tipologias.id, nome: tipologias.nome, tipo: tipologias.tipo, finalidade: tipologias.finalidade, dormitorios: tipologias.dormitorios, suites: tipologias.suites, vagas: tipologias.vagas })
        .from(tipologias)
        .where(eq(tipologias.empreendimentoId, e.id))
        .orderBy(asc(tipologias.dormitorios), asc(tipologias.nome)),
      tx
        .select({ id: unidades.id, tipologiaId: unidades.tipologiaId, identificador: unidades.identificador, areaPrivativa: unidades.areaPrivativa, preco: unidades.preco, status: unidades.status })
        .from(unidades)
        .where(eq(unidades.empreendimentoId, e.id))
        .orderBy(asc(unidades.preco), asc(unidades.identificador)),
      tx
        .select({
          id: planos.id, nome: planos.nome, sinalPercentual: planos.sinalPercentual, mensaisPercentual: planos.mensaisPercentual,
          numeroParcelas: planos.numeroParcelas, intercaladasPercentual: planos.intercaladasPercentual,
          chavesPercentual: planos.chavesPercentual, saldoPercentual: planos.saldoPercentual,
          aceita: planos.financiamentoAceita, momento: planos.financiamentoMomento, percentualMaximo: planos.financiamentoPercentualMaximo,
          fgts: planos.fgts, dacao: planos.dacao, parcelamentoDireto: planos.parcelamentoDireto,
        })
        .from(planos)
        .where(eq(planos.empreendimentoId, e.id))
        .orderBy(asc(planos.nome)),
      tx
        .select({ categoria: pontosProximos.categoria, nome: pontosProximos.nome, distanciaM: pontosProximos.distanciaM })
        .from(pontosProximos)
        .where(eq(pontosProximos.empreendimentoId, e.id))
        .orderBy(asc(pontosProximos.distanciaM), asc(pontosProximos.nome)),
      tx
        .select({
          origem: escritoriosVendas.origem, nome: escritoriosVendas.nome, cargo: escritoriosVendas.cargo, experiencia: escritoriosVendas.experiencia,
          fotoPath: escritoriosVendas.fotoPath, whatsapp: escritoriosVendas.whatsapp, email: escritoriosVendas.email, telefone: escritoriosVendas.telefone,
        })
        .from(escritoriosVendas)
        .where(eq(escritoriosVendas.empreendimentoId, e.id))
        .limit(1),
    ]);

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
      exemplo: e.exemplo,
      comodidades: e.comodidades,
      espelhoAtualizadoEm: e.espelhoAtualizadoEm,
      tipologias: tipologiasLidas,
      unidades: unidadesLidas,
      planos: planosLidos.map(({ aceita, momento, percentualMaximo, fgts, dacao, parcelamentoDireto, ...p }) => ({
        ...p,
        financiamento: { aceita, momento, percentualMaximo, fgts, dacao, parcelamentoDireto },
      })),
      pontos: pontosLidos,
      escritorio: cartao ?? null,
      ri: {
        numero: e.riNumero,
        cartorio: e.riCartorio,
        dataRegistro: e.riDataRegistro,
        patrimonioAfetacao: e.riPatrimonioAfetacao,
      },
    };
  });
}
