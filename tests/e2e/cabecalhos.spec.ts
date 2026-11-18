import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// CSP e cabeçalhos de segurança (fatia 0.5a, A5), sobre o build de produção.
const PAGINAS = ["/", "/empreendimento/residencial-jardim-das-aguas"];

/** Coleta violações de CSP: mensagens do console e eventos securitypolicyviolation. */
async function coletarViolacoes(page: Page): Promise<string[]> {
  const violacoes: string[] = [];
  page.on("console", (m) => {
    if (/content security policy/i.test(m.text())) violacoes.push(m.text());
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error(`Content Security Policy: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return violacoes;
}

for (const rota of PAGINAS) {
  test(`cabeçalhos de segurança e nenhuma violação de CSP em ${rota}`, async ({ page }) => {
    const violacoes = await coletarViolacoes(page);
    const resposta = await page.goto(rota);
    expect(resposta?.status()).toBe(200);
    const h = resposta!.headers();
    const csp = h["content-security-policy"]!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/nonce/);
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toBe("geolocation=(self), camera=(), microphone=(), payment=()");
    expect(h["strict-transport-security"]).toBe("max-age=31536000");
    // A hidratação roda sob a CSP: espera a rede assentar para pegar scripts e estilos bloqueados.
    await page.waitForLoadState("networkidle");
    expect(violacoes).toEqual([]);
  });
}

test("a CSP não derrubou a página inicial para renderização dinâmica no build", () => {
  const manifesto = JSON.parse(readFileSync(path.join(process.cwd(), ".next", "prerender-manifest.json"), "utf8")) as {
    routes: Record<string, { compute?: string; renderingMode?: string }>;
  };
  expect(manifesto.routes["/"]?.compute).toBe("static");
});
