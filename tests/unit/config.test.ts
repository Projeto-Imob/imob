import { describe, expect, it } from "vitest";
import { FLAGS_PADRAO, resolverFlags } from "@config/flags";
import { scoringConfig } from "@config/scoring.config";

const FLAGS_D6 = [
  "ia_motivo",
  "cep_servidor",
  "video_embed",
  "geo_ip",
  "interesse_publico",
  "home_destaques",
  "home_bairros",
  "prova_social",
  "simulador",
  "assinatura_eletronica",
  "login_google",
  "contato_exige_login",
  "email_real",
  "mapa_publico",
  "favoritos",
  "agendar_visita",
];

describe("config/flags.ts", () => {
  it("contém exatamente as flags do design D6", () => {
    expect(Object.keys(FLAGS_PADRAO).sort()).toEqual([...FLAGS_D6].sort());
  });

  it("todas as flags começam desligadas", () => {
    expect(Object.values(FLAGS_PADRAO).every((v) => v === false)).toBe(true);
  });

  it("config_global sobrepõe só flags conhecidas e com valor booleano", () => {
    const flags = resolverFlags({ simulador: true, email_real: "sim", desconhecida: true });
    expect(flags.simulador).toBe(true);
    expect(flags.email_real).toBe(false);
    expect(flags).not.toHaveProperty("desconhecida");
  });
});

describe("config/scoring.config.ts", () => {
  it("pesos da nota somam 1", () => {
    const soma = Object.values(scoringConfig.pesos).reduce((a, b) => a + b, 0);
    expect(soma).toBeCloseTo(1, 10);
  });

  it("parâmetros Proposta com os valores da especificação", () => {
    const p = scoringConfig.proposta;
    expect(p.raioPertoDeMimKm).toBe(5);
    expect(p.raioAmpliacaoRegiaoKm).toBe(3.5);
    expect(p.financeiro).toEqual({ fatorExigencia: 0.5, bonusPermuta: 0.1 });
    expect(p.divisorTipologia).toBe(6);
    expect(p.localizacao).toEqual({ notaBairroVizinho: 0.6, divisorPontosMetros: 2000, pesoRegiao: 0.6, pesoPontos: 0.4 });
    expect(p.comportamento).toEqual({ multiplicadorFavoritos: 2, divisor: 4 });
    expect(p.notaMinima).toBe(50);
    expect(p.janelaTerceiraOpcao).toBe(15);
    expect(p.prazoProtecaoLeadDias).toBeNull();
  });
});
