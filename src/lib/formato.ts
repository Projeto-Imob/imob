/** Formatação em pt-BR, sem domínio. Datas ISO (AAAA-MM-DD) são lidas em UTC para não mudar de dia pelo fuso. */

const MES_ANO = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const NUMERO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "2025-12-15" → "dezembro de 2025". */
export function mesAno(dataIso: string): string {
  return MES_ANO.format(new Date(`${dataIso}T00:00:00Z`));
}

/** 55.5 → "55,5"; até uma casa decimal. */
export function numero(n: number): string {
  return NUMERO.format(n);
}

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** 690000 → "R$ 690.000,00". */
export function moeda(valor: number): string {
  return MOEDA.format(valor);
}

/** "2025-12-15" → "15/12/2025". */
export function dataCurta(dataIso: string): string {
  return DATA_CURTA.format(new Date(`${dataIso}T00:00:00Z`));
}
