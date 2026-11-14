import { armazenamentoEmMemoria } from "@/data/armazenamento-local";
import { criarRepositoriosLocais } from "@/data/local";
import { suiteContratoRepositorios } from "./repositorios.contrato";

let n = 0;
suiteContratoRepositorios("local (LocalStorage em memória)", () =>
  criarRepositoriosLocais({
    armazenamento: armazenamentoEmMemoria(),
    agora: () => new Date("2026-11-13T13:00:00.000Z"),
    gerarId: () => `00000000-0000-4000-8fff-${String(++n).padStart(12, "0")}`,
  }),
);
