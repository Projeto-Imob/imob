/**
 * Posição inicial do mapa em cascata (tarefa 2.11; spec comprador/mapa):
 * (1) coordenadas da URL; (2) navegador, depois da tela de explicação; (3) cidade pelo IP, por função
 * de servidor plugável e só com a flag geo_ip; (4) Porto Alegre. A origem vai no evento map_open.
 * A posição exata nunca é gravada: a função só devolve o centro para a sessão.
 */
import type { Coordenadas } from "./tipos";

export type OrigemPosicao = "url" | "browser" | "ip" | "default";

export type PosicaoInicial = { centro: Coordenadas; zoom: number; origem: OrigemPosicao };

/** Porto Alegre (especificação: lat −30,0346, lng −51,2177, zoom 11 a 12). */
export const PORTO_ALEGRE: PosicaoInicial = { centro: { lat: -30.0346, lng: -51.2177 }, zoom: 11.5, origem: "default" };

/** Zoom ao centralizar na posição do navegador. Proposta: a especificação não define. */
export const ZOOM_POSICAO_NAVEGADOR = 14;

/** Opções do pedido ao navegador (especificação). */
export const OPCOES_GEOLOCALIZACAO = { enableHighAccuracy: false, timeout: 5000, maximumAge: 600_000 } as const;

export type ResultadoGeolocalizacao =
  | { tipo: "ok"; posicao: Coordenadas }
  | { tipo: "negada" }
  | { tipo: "tempo_esgotado" }
  | { tipo: "indisponivel" };

/** Lê lat, lng e z da URL; nulo se faltar algum ou estiver fora da faixa. */
export function posicaoDaUrl(params: URLSearchParams): PosicaoInicial | null {
  const [lat, lng, z] = ["lat", "lng", "z"].map((k) => {
    const v = params.get(k);
    return v === null || v.trim() === "" ? NaN : Number(v);
  }) as [number, number, number];
  if (![lat, lng, z].every(Number.isFinite)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || z < 0 || z > 22) return null;
  return { centro: { lat, lng }, zoom: z, origem: "url" };
}

/**
 * Adapta a API do navegador. Além do timeout do navegador, aplica um limite próprio de 5 s,
 * porque alguns navegadores nunca chamam o callback quando a pessoa ignora o pedido.
 */
export function geolocalizarNavegador(
  geo: Pick<Geolocation, "getCurrentPosition"> | undefined,
  limiteMs: number = OPCOES_GEOLOCALIZACAO.timeout,
): Promise<ResultadoGeolocalizacao> {
  if (!geo) return Promise.resolve({ tipo: "indisponivel" });
  return new Promise((resolver) => {
    let encerrado = false;
    const fim = (r: ResultadoGeolocalizacao) => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(relogio);
      resolver(r);
    };
    const relogio = setTimeout(() => fim({ tipo: "tempo_esgotado" }), limiteMs);
    geo.getCurrentPosition(
      (p) => fim({ tipo: "ok", posicao: { lat: p.coords.latitude, lng: p.coords.longitude } }),
      (erro) => fim(erro.code === 1 ? { tipo: "negada" } : erro.code === 3 ? { tipo: "tempo_esgotado" } : { tipo: "indisponivel" }),
      OPCOES_GEOLOCALIZACAO,
    );
  });
}

export type FontesPosicao = {
  url: URLSearchParams;
  /** Chamada só depois que a pessoa aceita a tela de explicação; ausente se ela recusou. */
  navegador?: () => Promise<ResultadoGeolocalizacao>;
  /** Função de servidor plugável (cidade pelo IP). */
  cidadePorIp?: () => Promise<{ centro: Coordenadas; zoom: number } | null>;
  /** Flag geo_ip: desligada, a etapa é pulada sem chamada externa. */
  geoIpLigado: boolean;
};

export type ResolucaoPosicao = PosicaoInicial & { geolocalizacao: ResultadoGeolocalizacao["tipo"] | "nao_pedida" };

export async function resolverPosicaoInicial(f: FontesPosicao): Promise<ResolucaoPosicao> {
  const daUrl = posicaoDaUrl(f.url);
  if (daUrl) return { ...daUrl, geolocalizacao: "nao_pedida" };

  let geolocalizacao: ResolucaoPosicao["geolocalizacao"] = "nao_pedida";
  if (f.navegador) {
    const r = await f.navegador();
    geolocalizacao = r.tipo;
    if (r.tipo === "ok") return { centro: r.posicao, zoom: ZOOM_POSICAO_NAVEGADOR, origem: "browser", geolocalizacao };
  }

  if (f.geoIpLigado && f.cidadePorIp) {
    try {
      const cidade = await f.cidadePorIp();
      if (cidade) return { ...cidade, origem: "ip", geolocalizacao };
    } catch {
      // Falha do serviço de IP: segue para a próxima etapa da cascata.
    }
  }

  return { ...PORTO_ALEGRE, geolocalizacao };
}
