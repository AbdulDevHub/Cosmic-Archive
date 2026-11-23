// Accessibility scan of the built app (O7, D-089): axe-core on every route, wide and on a phone,
// once the scene is drawn (so the labels pinned to the canvas are checked where they stand).
// Usage: npm run build && npm run a11y
// Fails on any violation of serious or critical impact; lists moderate and minor ones.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/** The routes with a scene: the scan waits for it to be drawn, and fails if it never is. */
const SCENES = new Set(["/", "/black-hole", "/nebula", "/quasar", "/neutron-star", "/star", "/strange-star", "/dyson-sphere", "/wormhole", "/gravastar", "/supernova-remnant", "/magnetar", "/black-hole-merger", "/comet", "/ringed-giant", "/quasi-star", "/solar-system", "/blue-world", "/moon", "/asteroid", "/quasar-galaxy"]);

const ROUTES = ["/", "/black-hole", "/nebula", "/quasar", "/neutron-star", "/star", "/strange-star", "/dyson-sphere", "/wormhole", "/gravastar", "/supernova-remnant", "/magnetar", "/black-hole-merger", "/comet", "/ringed-giant", "/quasi-star", "/solar-system", "/blue-world", "/moon", "/asteroid", "/quasar-galaxy"];
const VIEWS = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "phone", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];
const BLOCKING = new Set(["serious", "critical"]);

let failed = false;
let browser;
const { base, stop } = await serveBuild("a11y");
try {
  browser = await launchBrowser();
  for (const view of VIEWS) {
    const context = await browser.newContext(view);
    for (const route of ROUTES) {
      const page = await context.newPage();
      await page.goto(base + route + (route.includes("?") ? "&" : "?") + "tier=low", { waitUntil: "load" });
      await sceneSettled(page).catch(() => {});
      await page.waitForTimeout(500);
      if (SCENES.has(route) && (await page.evaluate(() => document.documentElement.dataset.scene)) !== "ready") {
        failed = true;
        console.log(`FAIL ${route} (${view.name})  the scene was not drawn, so the labels on it were not checked`);
      }
      await page.addScriptTag({ content: AXE });
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
        window.__axePasses = result.passes.length;
        return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
      });
      const passes = await page.evaluate(() => window.__axePasses);
      const blocking = violations.filter((v) => BLOCKING.has(v.impact));
      if (blocking.length) failed = true;
      console.log(`${blocking.length ? "FAIL" : "ok  "} ${route} (${view.name}, ${passes} rules passed)${violations.length ? `  ${violations.length} finding${violations.length > 1 ? "s" : ""}` : ""}`);
      for (const v of violations) console.log(`     ${v.impact}: ${v.id}: ${v.help}  [${v.nodes.join(" | ")}]`);
      await page.close();
    }
    await context.close();
  }
} catch (err) {
  console.error(err);
  failed = true;
} finally {
  await browser?.close();
  stop();
}

process.exit(failed ? 1 : 0);
