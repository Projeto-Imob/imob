import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as t from "@/dominio/tipos";
import { CASOS_EXCLUSAO, gerarSeed } from "@/seed/seed";

const seed = gerarSeed();

const COLECOES = {
  incorporadoras: t.incorporadora,
  contas: t.conta,
  empreendimentos: t.empreendimento,
  comerciais: t.empreendimentoComercial,
  subcondominios: t.subcondominio,
  tipologias: t.tipologia,
  unidades: t.unidade,
  planos: t.plano,
} as const;

describe("seed fictício (2.2)", () => {
  it.each(Object.entries(COLECOES))("%s passa no schema estrito", (nome, schema) => {
    const registros = seed[nome as keyof typeof COLECOES];
    expect(registros.length).toBeGreaterThan(0);
    expect(() => z.array(schema as z.ZodType).parse(registros)).not.toThrow();
  });

  it("todos os registros com dados de pessoa ou empresa estão marcados como exemplo", () => {
    for (const nome of Object.keys(COLECOES) as Array<keyof typeof COLECOES>) {
      for (const r of seed[nome]) expect((r as { exemplo: boolean }).exemplo).toBe(true);
    }
  });

  it("e-mails usam domínio reservado e não existem", () => {
    expect(seed.contas.every((c) => c.email.endsWith(".invalid"))).toBe(true);
  });

  it("é determinístico", () => {
    expect(gerarSeed()).toEqual(seed);
    expect(JSON.stringify(gerarSeed())).toBe(JSON.stringify(seed));
  });

  it("ids são únicos em todas as coleções", () => {
    const ids = Object.keys(COLECOES)
      .filter((n) => n !== "comerciais")
      .flatMap((n) => seed[n as keyof typeof COLECOES].map((r) => (r as { id: string }).id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tem três incorporadoras, a house e compradores", () => {
    expect(seed.incorporadoras).toHaveLength(3);
    expect(seed.contas.some((c) => c.papel === "internal_seller")).toBe(true);
    expect(seed.contas.some((c) => c.papel === "internal_account_manager")).toBe(true);
    expect(seed.contas.filter((c) => c.papel === "buyer").length).toBeGreaterThanOrEqual(2);
  });

  it("todo empreendimento fica em Porto Alegre e tem subcondomínio, tipologia, unidade e plano", () => {
    for (const e of seed.empreendimentos) {
      expect(e.cidade).toBe("Porto Alegre");
      expect(seed.subcondominios.some((s) => s.empreendimentoId === e.id)).toBe(true);
      expect(seed.tipologias.some((tp) => tp.empreendimentoId === e.id)).toBe(true);
      expect(seed.unidades.some((u) => u.empreendimentoId === e.id)).toBe(true);
      expect(seed.planos.some((p) => p.empreendimentoId === e.id)).toBe(true);
    }
  });

  it("toda tipologia aponta para subcondomínio do mesmo empreendimento", () => {
    for (const tp of seed.tipologias) {
      for (const sid of tp.subcondominioIds) {
        expect(seed.subcondominios.find((s) => s.id === sid)?.empreendimentoId).toBe(tp.empreendimentoId);
      }
    }
  });

  it("inclui os casos sem R.I., esgotado, pré-lançamento, exclusivo e não listado", () => {
    const porSlug = (slug: string) => seed.empreendimentos.find((e) => e.slug === slug)!;
    expect(porSlug(CASOS_EXCLUSAO.semRI).ri).toBeNull();
    const esgotado = porSlug(CASOS_EXCLUSAO.esgotado);
    expect(seed.unidades.filter((u) => u.empreendimentoId === esgotado.id).every((u) => u.status === "vendida")).toBe(true);
    const pre = porSlug(CASOS_EXCLUSAO.preLancamento);
    expect(pre.preLancamentoAtivo).toBe(false);
    expect(seed.subcondominios.find((s) => s.empreendimentoId === pre.id)!.dataLancamento! > "2027-01-01").toBe(true);
    expect(porSlug(CASOS_EXCLUSAO.exclusivo).visibilidade).toBe("exclusivo");
    expect(porSlug(CASOS_EXCLUSAO.naoListado).visibilidade).toBe("nao_listado");
  });
});
