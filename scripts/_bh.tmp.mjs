import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";
const { base, stop } = await serveBuild("bh");
const browser = await launchBrowser();
for (let i = 0; i < 2; i++) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  const t0 = Date.now();
  await page.goto(base + "/black-hole", { waitUntil: "networkidle" });
  const ok = await sceneSettled(page).then(() => true, () => false);
  console.log("try", i, "settled:", ok, "in", Date.now() - t0, "ms; scene:", await page.evaluate(() => document.documentElement.dataset.scene), errors);
  await page.close();
}
await browser.close(); await stop();
