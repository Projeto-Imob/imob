import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FichaEmpreendimento, FichaEmpreendimentoCarregando } from "@/modulos/catalogo";
import { lerEmpreendimentoPublico } from "@/modulos/catalogo/consultas";

/**
 * Empreendimento da vitrine, em cache por horas. A elegibilidade vem só do banco (app.na_vitrine).
 * Quem publica ou edita o catálogo invalida pela tag (a partir da fatia 1.x).
 */
async function empreendimentoDaVitrine(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("vitrine", `empreendimento:${slug}`);
  return lerEmpreendimentoPublico(slug);
}

async function Conteudo({ params }: Pick<PageProps<"/empreendimento/[slug]">, "params">) {
  const { slug } = await params;
  const empreendimento = await empreendimentoDaVitrine(slug);
  // Fora da vitrine, inexistente ou slug inválido: "não encontrado", com noindex (Next).
  if (!empreendimento) notFound();
  return <FichaEmpreendimento empreendimento={empreendimento} />;
}

// Sem generateStaticParams: o slug só chega na requisição, e o await dos params fica dentro do Suspense
// para o shell estático (layout e substituto) sair antes.
export default function PaginaEmpreendimento({ params }: PageProps<"/empreendimento/[slug]">) {
  return (
    <Suspense fallback={<FichaEmpreendimentoCarregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}
