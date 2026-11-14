import Image from "next/image";
import Link from "next/link";
import type { Brand } from "@config/brand";

export function MarcaCabecalho({ marca }: { marca: Brand }) {
  return (
    <Link href="/" className="titulo-marca text-lg leading-none" aria-label={marca.nome}>
      {marca.logotipo ? (
        <Image
          src={marca.logotipo.src}
          width={marca.logotipo.largura}
          height={marca.logotipo.altura}
          alt={marca.nome}
          priority
        />
      ) : (
        marca.nome
      )}
    </Link>
  );
}
