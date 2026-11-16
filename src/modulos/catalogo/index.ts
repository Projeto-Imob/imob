/**
 * API pública do módulo catálogo: tipos e regras puras, seguras no cliente.
 * O acesso ao banco fica em consultas.ts (só servidor), importado direto e nunca reexportado aqui.
 */
export * from "./tipos";
export * from "./regras";
export * from "./elegibilidade";
