import { FLAGS_PADRAO } from "@config/flags";
import { cacheLife, cacheTag, io } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  BarraFixa,
  BlocoComodidades,
  BlocoCustos,
  BlocoEscritorio,
  BlocoGaleria,
  BlocoLegais,
  BlocoNumeros,
  BlocoPlantas,
  BlocoVizinhanca,
  FichaEmpreendimento,
  FichaEmpreendimentoCarregando,
  SeletorModo,
  entradaMinima,
  lerModo,
  ordemDosBlocos,
  restamPorTipologia,
  totalRestam,
  unidadesDeVenda,
  type Bloco,
  type Modo,
  type PaginaEmpreendimento,
} from "@/modulos/catalogo";
import { lerEmpreendimentoPublico } from "@/modulos/catalogo/consultas";

/**
 * Empreendimento da vitrine, em cache por horas. A elegibilidade vem só do banco (app.na_vitrine).
 * Quem publica ou edita o catálogo invalida pela tag (a partir da fatia 1.x). A escassez (regra 10) fica
 * de fora do cache: ela depende da hora do pedido.
 */
async function empreendimentoDaVitrine(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("vitrine", `empreendimento:${slug}`);
  return lerEmpreendimentoPublico(slug);
}

function blocoDaPagina(bloco: Bloco, e: PaginaEmpreendimento, modo: Modo, restam: Record<string, number>, total: number | null): ReactNode {
  switch (bloco) {
    case "galeria":
      return <BlocoGaleria slug={e.slug} />;
    case "resumo":
      return <FichaEmpreendimento empreendimento={e} restam={total} />;
    case "numeros":
      return <BlocoNumeros e={e} modo={modo} />;
    case "custos":
      return <BlocoCustos unidades={e.unidades} tipologias={e.tipologias} planos={e.planos} modo={modo} />;
    case "plantas":
      return <BlocoPlantas e={e} modo={modo} restam={restam} />;
    case "vizinhanca":
      return <BlocoVizinhanca e={e} modo={modo} />;
    case "comodidades":
      return <BlocoComodidades e={e} modo={modo} />;
    case "escritorio":
      return <BlocoEscritorio e={e} modo={modo} />;
    case "legais":
      return <BlocoLegais e={e} modo={modo} />;
  }
}

async function Conteudo({ params, searchParams }: Pick<PageProps<"/empreendimento/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const { modo: modoDaUrl } = await searchParams;
  const empreendimento = await empreendimentoDaVitrine(slug);
  // Fora da vitrine, inexistente ou slug inválido: "não encontrado", com noindex (Next).
  // Não listado fica aqui até a fatia 1.4: responde "não encontrado" para todos.
  if (!empreendimento) notFound();

  // Regra 10: a conta do "menos de 24 h" roda fora do cache, com o relógio do pedido.
  await io();
  const agora = new Date();
  const restam = restamPorTipologia(empreendimento.unidades, empreendimento.espelhoAtualizadoEm, agora);
  const total = totalRestam(empreendimento.unidades, empreendimento.espelhoAtualizadoEm, agora);

  const modo = lerModo(modoDaUrl);
  return (
    <div className="max-w-3xl pb-24 md:pb-0">
      <SeletorModo slug={empreendimento.slug} modo={modo} />
      <div className="mt-6 flex flex-col gap-10">
        {ordemDosBlocos(modo).map((bloco) => (
          <div key={bloco}>{blocoDaPagina(bloco, empreendimento, modo, restam, total)}</div>
        ))}
      </div>
      <BarraFixa entrada={entradaMinima(unidadesDeVenda(empreendimento.unidades, empreendimento.tipologias), empreendimento.planos)} slug={empreendimento.slug} agendarVisita={FLAGS_PADRAO.agendar_visita} />
    </div>
  );
}

// Sem generateStaticParams: o slug só chega na requisição, e o await dos params fica dentro do Suspense
// para o shell estático (layout e substituto) sair antes.
export default function PaginaEmpreendimento({ params, searchParams }: PageProps<"/empreendimento/[slug]">) {
  return (
    <Suspense fallback={<FichaEmpreendimentoCarregando />}>
      <Conteudo params={params} searchParams={searchParams} />
    </Suspense>
  );
}
