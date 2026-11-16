import { describe, expect, it } from "vitest";
import { mesAno, numero } from "@/lib/formato";

describe("formato (pt-BR)", () => {
  it("mês e ano por extenso, sem depender do fuso", () => {
    expect(mesAno("2025-12-15")).toBe("dezembro de 2025");
    expect(mesAno("2028-01-01")).toBe("janeiro de 2028");
  });

  it("número com até uma casa decimal e vírgula", () => {
    expect(numero(100)).toBe("100");
    expect(numero(55.5)).toBe("55,5");
    expect(numero(33.33)).toBe("33,3");
  });
});
