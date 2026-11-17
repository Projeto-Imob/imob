import Link from "next/link";
import { T } from "@/components/T";

/** Empreendimento fora da vitrine ou inexistente. O Next acrescenta o noindex. */
export default function EmpreendimentoNaoEncontrado() {
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold text-preto md:text-3xl">
        <T k="empreendimento.nao_encontrado.titulo" />
      </h1>
      <p className="mt-3 text-texto-secundario">
        <T k="empreendimento.nao_encontrado.texto" />
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-preto px-4 font-semibold text-off-white"
      >
        <T k="empreendimento.nao_encontrado.voltar" />
      </Link>
    </section>
  );
}
