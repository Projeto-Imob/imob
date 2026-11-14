// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { brand, type Brand } from "@config/brand";
import { MarcaCabecalho } from "@/components/layout/MarcaCabecalho";
import { metadataDaMarca } from "@/lib/metadata";

afterEach(cleanup);

const outra: Brand = { ...brand, nome: "Outra Marca" };

describe("config/brand.ts", () => {
  it("o cabeçalho mostra o nome da marca configurada", () => {
    render(<MarcaCabecalho marca={brand} />);
    expect(screen.getByRole("link", { name: brand.nome })).toHaveProperty("textContent", brand.nome);
  });

  it("trocar o nome altera o cabeçalho", () => {
    render(<MarcaCabecalho marca={outra} />);
    expect(screen.getByRole("link", { name: "Outra Marca" }).textContent).toBe("Outra Marca");
    expect(screen.queryByText(brand.nome)).toBeNull();
  });

  it("trocar o nome altera o <title>", () => {
    expect(metadataDaMarca(brand).title).toEqual({ default: brand.nome, template: `%s · ${brand.nome}` });
    expect(metadataDaMarca(outra).title).toEqual({ default: "Outra Marca", template: "%s · Outra Marca" });
  });

  it("a aplicação usa a marca do config no metadata do layout", async () => {
    const fonte = await import("node:fs").then((fs) => fs.readFileSync("src/app/layout.tsx", "utf8"));
    expect(fonte).toContain("metadataDaMarca(brand)");
  });
});
