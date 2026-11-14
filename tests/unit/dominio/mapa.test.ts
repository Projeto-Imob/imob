import { afterEach, describe, expect, it, vi } from "vitest";
import { METROS_POR_MINUTO_A_PE, distanciaM, minutosAPe } from "@/dominio/geo";
import {
  OPCOES_GEOLOCALIZACAO,
  PORTO_ALEGRE,
  geolocalizarNavegador,
  posicaoDaUrl,
  resolverPosicaoInicial,
  type ResultadoGeolocalizacao,
} from "@/dominio/mapa";

afterEach(() => vi.useRealTimers());

const semUrl = new URLSearchParams();
const resposta = (r: ResultadoGeolocalizacao) => () => Promise.resolve(r);

describe("posição inicial do mapa (2.11)", () => {
  it("1º: coordenadas da URL", async () => {
    const r = await resolverPosicaoInicial({ url: new URLSearchParams("lat=-29.9&lng=-51.1&z=13"), geoIpLigado: false });
    expect(r).toMatchObject({ centro: { lat: -29.9, lng: -51.1 }, zoom: 13, origem: "url" });
  });

  it("URL incompleta ou fora da faixa é ignorada", () => {
    expect(posicaoDaUrl(new URLSearchParams("lat=-29.9&lng=-51.1"))).toBeNull();
    expect(posicaoDaUrl(new URLSearchParams("lat=-99&lng=-51.1&z=10"))).toBeNull();
    expect(posicaoDaUrl(new URLSearchParams("lat=abc&lng=-51.1&z=10"))).toBeNull();
  });

  it("2º: navegador, quando a pessoa aceita", async () => {
    const r = await resolverPosicaoInicial({ url: semUrl, navegador: resposta({ tipo: "ok", posicao: { lat: -30.1, lng: -51.2 } }), geoIpLigado: false });
    expect(r).toMatchObject({ centro: { lat: -30.1, lng: -51.2 }, origem: "browser", geolocalizacao: "ok" });
  });

  it("permissão negada e IP desligado: Porto Alegre com origem default", async () => {
    const ip = vi.fn();
    const r = await resolverPosicaoInicial({ url: semUrl, navegador: resposta({ tipo: "negada" }), cidadePorIp: ip, geoIpLigado: false });
    expect(r).toMatchObject({ ...PORTO_ALEGRE, geolocalizacao: "negada" });
    expect(r.zoom).toBeGreaterThanOrEqual(11);
    expect(r.zoom).toBeLessThanOrEqual(12);
    expect(ip).not.toHaveBeenCalled(); // flag desligada: nenhuma chamada externa
  });

  it("3º: cidade pelo IP quando a flag está ligada", async () => {
    const r = await resolverPosicaoInicial({
      url: semUrl,
      navegador: resposta({ tipo: "negada" }),
      cidadePorIp: () => Promise.resolve({ centro: { lat: -29.7, lng: -51.1 }, zoom: 11 }),
      geoIpLigado: true,
    });
    expect(r).toMatchObject({ origem: "ip", centro: { lat: -29.7, lng: -51.1 } });
  });

  it("falha do serviço de IP cai para Porto Alegre", async () => {
    const r = await resolverPosicaoInicial({ url: semUrl, cidadePorIp: () => Promise.reject(new Error("rede")), geoIpLigado: true });
    expect(r.origem).toBe("default");
  });

  it("sem pedir ao navegador (pessoa recusou a explicação): segue a cascata", async () => {
    const r = await resolverPosicaoInicial({ url: semUrl, geoIpLigado: false });
    expect(r).toMatchObject({ origem: "default", geolocalizacao: "nao_pedida" });
  });
});

describe("adaptador da geolocalização do navegador", () => {
  it("usa as opções da especificação", async () => {
    const getCurrentPosition = vi.fn<Geolocation["getCurrentPosition"]>((ok) =>
      ok({ coords: { latitude: -30, longitude: -51 } } as GeolocationPosition),
    );
    expect(await geolocalizarNavegador({ getCurrentPosition })).toEqual({ tipo: "ok", posicao: { lat: -30, lng: -51 } });
    expect(getCurrentPosition.mock.calls[0]![2]).toEqual({ enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 });
    expect(OPCOES_GEOLOCALIZACAO.timeout).toBe(5000);
  });

  it("permissão negada", async () => {
    const getCurrentPosition = (_: PositionCallback, erro?: PositionErrorCallback | null) => erro?.({ code: 1 } as GeolocationPositionError);
    expect(await geolocalizarNavegador({ getCurrentPosition })).toEqual({ tipo: "negada" });
  });

  it("tempo esgotado em 5 s quando o navegador não responde, e a cascata segue", async () => {
    vi.useFakeTimers();
    const promessa = resolverPosicaoInicial({ url: semUrl, navegador: () => geolocalizarNavegador({ getCurrentPosition: () => undefined }), geoIpLigado: false });
    await vi.advanceTimersByTimeAsync(5000);
    expect(await promessa).toMatchObject({ origem: "default", geolocalizacao: "tempo_esgotado" });
  });

  it("navegador sem geolocalização", async () => {
    expect(await geolocalizarNavegador(undefined)).toEqual({ tipo: "indisponivel" });
  });
});

describe("tempo a pé", () => {
  it("80 m por minuto, arredondado para cima, mínimo 1", () => {
    expect(METROS_POR_MINUTO_A_PE).toBe(80);
    expect(minutosAPe(480)).toBe(6);
    expect(minutosAPe(481)).toBe(7);
    expect(minutosAPe(10)).toBe(1);
  });

  it("distância de Haversine plausível em Porto Alegre", () => {
    // Moinhos de Vento a Petrópolis: cerca de 2,4 km.
    const d = distanciaM({ lat: -30.0262, lng: -51.2009 }, { lat: -30.0425, lng: -51.1846 });
    expect(d).toBeGreaterThan(2000);
    expect(d).toBeLessThan(2800);
  });
});
