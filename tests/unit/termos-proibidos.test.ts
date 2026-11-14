import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { procurarEmTexto, varrerRepositorio } from "../../scripts/termos-proibidos";

const raizRepo = path.resolve(__dirname, "../..");

describe("termos proibidos (regra 19)", () => {
  it("o código do app, db/ e infra/ não contêm termos proibidos", () => {
    expect(varrerRepositorio(raizRepo)).toEqual([]);
  });

  it.each([
    ["const papel = 'corretor';", "corretor"],
    ["role: 'broker'", "broker"],
    ["// programa de parceria", "parceria"],
    ["perfil: 'imobiliaria'", "imobiliaria"],
    ["assistente JulI.A", "JulI.A"],
  ])("detecta %s", (linha, termo) => {
    expect(procurarEmTexto(linha, "x.ts").map((o) => o.termo)).toContain(termo);
  });

  it("não confunde prosa legítima", () => {
    expect(procurarEmTexto("incorporação imobiliária registrada; lançamentos imobiliários; Júlia", "x.ts")).toEqual([]);
  });

  it.each(["src", "db", "infra"])("falha ao inserir um termo proibido num arquivo temporário em %s/", (pasta) => {
    const dir = path.join(raizRepo, pasta);
    const criouDir = !fs.existsSync(dir);
    if (criouDir) fs.mkdirSync(dir);
    const tmp = path.join(dir, "__termo-proibido.tmp.ts");
    fs.writeFileSync(tmp, "export const papel = 'broker';\n");
    try {
      expect(varrerRepositorio(raizRepo)).toEqual([{ arquivo: `${pasta}/__termo-proibido.tmp.ts`, linha: 1, termo: "broker" }]);
    } finally {
      fs.rmSync(tmp);
      if (criouDir) fs.rmdirSync(dir);
    }
  });
});
