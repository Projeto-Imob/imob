import { describe, expect, it } from "vitest";
import { ORIGENS_EXTRAS, montarCabecalhos, montarCsp, origemDoSentry } from "../../config/cabecalhos";

const DSN = "https://chavepublica@o123456.ingest.sentry.io/7890";
const diretiva = (csp: string, nome: string) => csp.split("; ").find((d) => d.startsWith(`${nome} `));

describe("config/cabecalhos.ts (A5)", () => {
  it("CSP sem nonce: o cache das páginas públicas continua", () => {
    const csp = montarCsp({ desenvolvimento: false, sentryDsn: DSN });
    expect(csp).not.toMatch(/nonce|strict-dynamic/);
    expect(diretiva(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
  });

  it("'unsafe-eval' só em desenvolvimento", () => {
    expect(montarCsp({ desenvolvimento: true })).toContain("'unsafe-eval'");
    expect(montarCsp({ desenvolvimento: false })).not.toContain("'unsafe-eval'");
  });

  it("o host do Sentry só entra com DSN, e só o host", () => {
    expect(diretiva(montarCsp({ desenvolvimento: false }), "connect-src")).toBe("connect-src 'self'");
    expect(diretiva(montarCsp({ desenvolvimento: false, sentryDsn: "" }), "connect-src")).toBe("connect-src 'self'");
    const csp = montarCsp({ desenvolvimento: false, sentryDsn: DSN });
    expect(diretiva(csp, "connect-src")).toBe("connect-src 'self' https://o123456.ingest.sentry.io");
    expect(csp).not.toContain("chavepublica");
    expect(origemDoSentry("não é url")).toBeNull();
  });

  it("diretivas fixas da proposta", () => {
    const csp = montarCsp({ desenvolvimento: false });
    expect(csp.split("; ")).toEqual([
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]);
  });

  it("a lista de origens é extensível sem mexer na função", () => {
    expect(Object.values(ORIGENS_EXTRAS).every((l) => l.length === 0)).toBe(true);
    const extras = { ...ORIGENS_EXTRAS, connect: ["https://tiles.openfreemap.org"], img: ["https://tiles.openfreemap.org"] };
    const csp = montarCsp({ desenvolvimento: false, extras });
    expect(diretiva(csp, "connect-src")).toBe("connect-src 'self' https://tiles.openfreemap.org");
    expect(diretiva(csp, "img-src")).toBe("img-src 'self' data: blob: https://tiles.openfreemap.org");
  });

  it("os demais cabeçalhos", () => {
    const cabecalhos = Object.fromEntries(montarCabecalhos({ desenvolvimento: false }).map((c) => [c.key, c.value]));
    expect(cabecalhos["X-Content-Type-Options"]).toBe("nosniff");
    expect(cabecalhos["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(cabecalhos["Permissions-Policy"]).toBe("geolocation=(self), camera=(), microphone=(), payment=()");
    expect(cabecalhos["Strict-Transport-Security"]).toBe("max-age=31536000");
    expect(cabecalhos["Content-Security-Policy"]).toBeTruthy();
  });
});
