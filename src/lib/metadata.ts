import type { Metadata } from "next";
import type { Brand } from "@config/brand";

export function metadataDaMarca(marca: Brand): Metadata {
  return {
    title: { default: marca.nome, template: `%s · ${marca.nome}` },
    applicationName: marca.nome,
  };
}
