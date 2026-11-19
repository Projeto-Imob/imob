import { expect, test, type Page } from "@playwright/test";

// LCP da página do empreendimento no celular com rede e CPU limitadas (fatia 1.1; meta da spec: abaixo de 2,5 s).
// Limitação pelo CDP: RTT de 350 ms, 1,6 Mbps e CPU 4x mais lenta; tela de 390 px.
const SLUG = "residencial-jardim-das-aguas";

test.use({ viewport: { width: 390, height: 800 } });

async function medirLcp(page: Page): Promise<number> {
  await page.goto(`/empreendimento/${SLUG}`, { waitUntil: "load" });
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let ultimo = 0;
        new PerformanceObserver((lista) => {
          for (const e of lista.getEntries()) ultimo = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve(ultimo), 1000);
      }),
  );
}

test("LCP no celular com rede lenta: mediana de 3 cargas abaixo de 2,5 s", async ({ page, context }) => {
  test.setTimeout(120_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 350,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await medirLcp(page); // aquecimento: o servidor e o cache
  const medidas: number[] = [];
  for (let i = 0; i < 3; i++) {
    await cdp.send("Network.clearBrowserCache");
    medidas.push(await medirLcp(page));
  }
  const mediana = [...medidas].sort((a, b) => a - b)[1]!;
  console.log(`LCP (ms): ${medidas.map((m) => Math.round(m)).join(", ")}; mediana ${Math.round(mediana)}`);
  for (const m of medidas) expect(m, "sem entrada de LCP a medida vira 0").toBeGreaterThan(0);
  expect(mediana).toBeGreaterThan(0);
  expect(mediana).toBeLessThan(2500);
});
