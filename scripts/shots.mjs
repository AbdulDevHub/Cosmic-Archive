// Screenshots of the built app for the design checklist (docs/DESIGN_SPEC.md section 11).
// Usage: npm run build && npm run shots
// Starts `next start` on a free port, captures each route at desktop, phone and desktop with
// reduced motion, writes PNGs to screenshots/, and fails on any console error or failed request.
//
// `home` is the page as a visitor gets it (the device picks the quality). `home-still` is the
// deterministic frame to hold beside prototype/shots/: `?shot=1&t=12` at the prototype's counts.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const ROUTES = [
  { path: () => "/", name: "home", scene: true },
  { path: (view) => `/?shot=1&t=12&tier=${view.tier}`, name: "home-still", scene: true, mustDraw: true },
  { path: () => "/about", name: "about", scene: false },
];

const VIEWS = [
  { name: "desktop", tier: "high", viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" },
  { name: "phone", tier: "low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
  { name: "desktop-reduced", tier: "high", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
];

const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

let failed = false;
let browser;
const { base, stop } = await serveBuild("shots");
try {
  browser = await launchBrowser();

  for (const view of VIEWS) {
    const { name, tier, ...options } = view;
    const context = await browser.newContext(options);
    for (const route of ROUTES) {
      const page = await context.newPage();
      const problems = [];
      page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
      page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
      page.on("requestfailed", (req) => problems.push(`request failed: ${req.url()}`));

      await page.goto(base + route.path({ tier }), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      let note = "";
      if (route.scene) {
        await sceneSettled(page).catch(() => problems.push("the scene neither drew nor fell back to the poster"));
        note = await page.evaluate(() => `scene ${document.documentElement.dataset.scene}, quality ${document.documentElement.dataset.sceneQuality}`);
        // with a forced tier, "static" means WebGL failed and the shot would only show the poster
        if (route.mustDraw && !note.startsWith("scene ready")) problems.push("the scene did not draw: this is the poster, not the scene");
        await page.waitForTimeout(450); // the canvas fades in over the poster (300 ms)
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) problems.push(`horizontal overflow of ${overflow}px`);

      const file = join(OUT, `${route.name}-${name}.png`);
      await page.screenshot({ path: file });
      console.log(`${problems.length ? "FAIL" : "ok  "} ${file}${note ? `  (${note})` : ""}`);
      for (const p of problems) console.log(`     ${p}`);
      if (problems.length) failed = true;
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
