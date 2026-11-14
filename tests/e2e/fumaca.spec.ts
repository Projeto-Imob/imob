import { expect, test } from "@playwright/test";
import { brand } from "../../config/brand";
import { esperarSemViolacoesAxe } from "./axe";

test("a página inicial abre com o título da marca e sem violação do axe", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(brand.nome);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await esperarSemViolacoesAxe(page);
});
