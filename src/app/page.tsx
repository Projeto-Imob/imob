import { brand } from "@config/brand";

// A home por estado (resolveHomeState) entra na tarefa 3.19.
export default function Inicio() {
  return <h1 className="sr-only">{brand.nome}</h1>;
}
