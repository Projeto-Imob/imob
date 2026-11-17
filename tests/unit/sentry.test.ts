import { describe, expect, it } from "vitest";
import { COLETA_MINIMA, ambienteDoServidor, ambientePeloHost, fracaoDeRastreio, limparEvento, opcoesSentry } from "@/lib/sentry";

const DSN = "https://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/1";

describe("Sentry: liga só com DSN (D10)", () => {
  it.each([undefined, "", "   "])("fica desligado com DSN %j", (dsn) => {
    const o = opcoesSentry({ dsn, ambiente: "desenvolvimento", tracesSampleRate: 0 });
    expect(o.enabled).toBe(false);
    expect(o.dsn).toBeUndefined();
  });

  it("liga com DSN e leva o ambiente e a fração de rastreio", () => {
    const o = opcoesSentry({ dsn: ` ${DSN} `, ambiente: "homologacao", tracesSampleRate: 0.1 });
    expect(o).toMatchObject({ enabled: true, dsn: DSN, environment: "homologacao", tracesSampleRate: 0.1 });
  });
});

describe("Sentry: nenhum dado pessoal (regra 9, LGPD)", () => {
  it("desliga a coleta de usuário, cookies, cabeçalhos, corpos e parâmetros de URL", () => {
    const o = opcoesSentry({ dsn: DSN, ambiente: "producao", tracesSampleRate: 0 });
    expect(o.dataCollection).toEqual(COLETA_MINIMA);
    expect(COLETA_MINIMA).toMatchObject({ userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false });
  });

  it("tira do evento o usuário, o IP e tudo da requisição além do caminho", () => {
    const evento = {
      message: "falhou",
      user: { id: "1", email: "comprador@exemplo.invalid", ip_address: "203.0.113.5" },
      request: {
        url: "https://hml.exemplo.invalid/buscar?renda=12000&email=x@y.z#topo",
        method: "POST",
        cookies: { sessao: "abc" },
        headers: { "x-forwarded-for": "203.0.113.5" },
        data: { whatsapp: "+5551999999999" },
        query_string: "renda=12000",
        env: { REMOTE_ADDR: "203.0.113.5" },
      },
    };
    const limpo = limparEvento(evento);
    expect(limpo).toEqual({ message: "falhou", request: { url: "https://hml.exemplo.invalid/buscar", method: "POST" } });
    expect(JSON.stringify(limpo)).not.toMatch(/203\.0\.113\.5|email|whatsapp|sessao/);
  });

  it("aplica a limpeza no beforeSend", () => {
    const o = opcoesSentry({ dsn: DSN, ambiente: "producao", tracesSampleRate: 0 });
    const evento = { type: undefined, user: { ip_address: "203.0.113.5" }, request: { url: "/x?y=1" } };
    // O tipo do evento do Sentry é amplo; aqui basta um evento mínimo.
    const saida = (o.beforeSend as (e: unknown, h: unknown) => unknown)(evento, {});
    expect(saida).toEqual({ type: undefined, request: { url: "/x" } });
  });
});

describe("Sentry: ambiente e rastreio", () => {
  it.each([
    ["localhost", "desenvolvimento"],
    ["127.0.0.1", "desenvolvimento"],
    ["app.localhost", "desenvolvimento"],
    ["hml.imob.exemplo.invalid", "homologacao"],
    ["homologacao.imob.exemplo.invalid", "homologacao"],
    ["imob.exemplo.invalid", "producao"],
    ["HML.IMOB.EXEMPLO.INVALID", "homologacao"],
  ])("o host %s é %s", (host, ambiente) => {
    expect(ambientePeloHost(host)).toBe(ambiente);
  });

  it("no servidor, usa SENTRY_ENVIRONMENT válido e, sem ele, o NODE_ENV", () => {
    expect(ambienteDoServidor({ SENTRY_ENVIRONMENT: "homologacao", NODE_ENV: "production" })).toBe("homologacao");
    expect(ambienteDoServidor({ SENTRY_ENVIRONMENT: "qualquer", NODE_ENV: "production" })).toBe("producao");
    expect(ambienteDoServidor({ NODE_ENV: "development" })).toBe("desenvolvimento");
  });

  it.each([
    [undefined, 0],
    ["", 0],
    ["0.25", 0.25],
    ["1", 1],
    ["1.5", 0],
    ["-0.1", 0],
    ["abc", 0],
  ])("a fração %j vira %s", (valor, esperado) => {
    expect(fracaoDeRastreio(valor)).toBe(esperado);
  });
});
