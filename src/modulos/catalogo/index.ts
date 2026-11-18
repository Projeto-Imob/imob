/**
 * API pública do módulo catálogo: tipos e regras puras, seguras no cliente.
 * O acesso ao banco fica em consultas.ts (só servidor), importado direto e nunca reexportado aqui.
 */
export * from "./tipos";
export * from "./regras";
export * from "./elegibilidade";
export * from "./pagina";
export * from "./componentes/FichaEmpreendimento";
export * from "./componentes/BarraFixa";
export * from "./componentes/BlocoComodidades";
export * from "./componentes/BlocoCustos";
export * from "./componentes/BlocoEscritorio";
export * from "./componentes/BlocoGaleria";
export * from "./componentes/BlocoLegais";
export * from "./componentes/BlocoNumeros";
export * from "./componentes/BlocoPlantas";
export * from "./componentes/BlocoVizinhanca";
export * from "./componentes/SeletorModo";
