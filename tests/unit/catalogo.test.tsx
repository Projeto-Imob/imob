// @vitest-environment jsdom
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { chavesInexistentes, literaisEmJsx } from "../../scripts/catalogo-lib";
import { T } from "@/components/T";
import { interpolar, ptBR, texto } from "@/i18n/pt-BR";

afterEach(cleanup);

const raiz = path.resolve(__dirname, "../..");

describe("componente <T>", () => {
  it("renderiza o texto do catálogo com os marcadores preenchidos", () => {
    const { container } = render(<T k="quiz.progress" vars={{ i: 2, total: 9 }} />);
    expect(container.textContent).toBe("Pergunta 2 de 9");
  });

  it("texto() aceita sobreposição do conteúdo editado", () => {
    expect(texto("nav.mapa", undefined, { "nav.mapa": "Mapa editado" })).toBe("Mapa editado");
    expect(texto("nav.mapa")).toBe(ptBR["nav.mapa"]);
  });

  it("marcador sem valor fica intacto", () => {
    expect(interpolar("{n} de {total}", { n: 1 })).toBe("1 de {total}");
  });
});

describe("verificação do catálogo", () => {
  it("acusa literal de texto em JSX", () => {
    const codigo = "export const C = () => <p>Olá, mundo</p>;";
    expect(literaisEmJsx(codigo, "C.tsx")).toEqual([{ arquivo: "C.tsx", linha: 1, trecho: "Olá, mundo" }]);
  });

  it("acusa string literal em expressão e em atributo visível", () => {
    const codigo = 'export const C = () => <button aria-label="Fechar">{"Abrir"}</button>;';
    expect(literaisEmJsx(codigo, "C.tsx").map((a) => a.trecho)).toEqual(['aria-label="Fechar"', "Abrir"]);
  });

  it("aceita <T>, pontuação, números e atributos técnicos", () => {
    const codigo = 'export const C = () => <p className="etiqueta" data-id="abc"><T k="nav.mapa" /> · 42 —</p>;';
    expect(literaisEmJsx(codigo, "C.tsx")).toEqual([]);
  });

  it("acusa chave inexistente", () => {
    const chaves = new Set(Object.keys(ptBR));
    expect(chavesInexistentes('<T k="nao.existe" />', "C.tsx", chaves)).toHaveLength(1);
    expect(chavesInexistentes('<T k="nav.mapa" />', "C.tsx", chaves)).toEqual([]);
  });

  it("npm run catalogo falha com um componente de teste com literal", () => {
    const violador = path.join(raiz, "src", "components", "__ViolaCatalogo.tsx");
    fs.writeFileSync(violador, "export const V = () => <p>Texto solto</p>;\n");
    try {
      const r = spawnSync(process.execPath, ["scripts/catalogo.ts"], { cwd: raiz, encoding: "utf8" });
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("__ViolaCatalogo.tsx:1");
    } finally {
      fs.rmSync(violador);
    }
    const ok = spawnSync(process.execPath, ["scripts/catalogo.ts"], { cwd: raiz, encoding: "utf8" });
    expect(ok.status).toBe(0);
  });
});
