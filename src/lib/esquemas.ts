/**
 * Esquemas Zod básicos, comuns aos módulos. Os schemas de cada módulo são estritos:
 * campo desconhecido é recusado. Valores monetários em reais (número), áreas em m²,
 * distâncias em metros, datas ISO.
 */
import { z } from "zod";

export const id = z.uuid();
export const dataIso = z.iso.date();
export const dataHoraIso = z.iso.datetime({ offset: true });
export const percentual = z.number().min(0).max(100);
export const reais = z.number().nonnegative();
export const inteiroNaoNegativo = z.number().int().nonnegative();

/** Todo dado é fictício e marcado como exemplo (regra 16). */
export const exemplo = z.literal(true);

export const coordenadas = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordenadas = z.infer<typeof coordenadas>;
