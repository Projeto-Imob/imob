import type { Coordenadas } from "./tipos";

const RAIO_TERRA_M = 6_371_000;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distância em metros pela fórmula de Haversine. */
export function distanciaM(a: Coordenadas, b: Coordenadas): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/** Velocidade a pé da especificação: 80 m por minuto. */
export const METROS_POR_MINUTO_A_PE = 80;

/** Minutos a pé, arredondados para cima (mínimo 1). */
export function minutosAPe(metros: number): number {
  return Math.max(1, Math.ceil(metros / METROS_POR_MINUTO_A_PE));
}
