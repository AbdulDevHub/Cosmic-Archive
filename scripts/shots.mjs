// Screenshots of the built app for the design checklist (docs/DESIGN_SPEC.md section 11).
// Usage: npm run build && npm run shots
// Starts `next start` on a free port, captures each route at desktop, phone and desktop with
// reduced motion, writes PNGs to screenshots/, and fails on any console error or failed request.
//
// `home` and each place are the pages as a visitor gets them (the device picks the quality). The
// `-still` shots are deterministic frames: `?shot=1&t=12` at the prototype's counts, with `&zoom=`
// holding the atlas's stop (0 close in, 1 the galaxy, 2 the cosmic web, 3 the supervoid).

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const ROUTES = [
  { path: () => "/", name: "home", scene: true },
  { path: (view) => `/?shot=1&t=12&tier=${view.tier}`, name: "start-still", scene: true, mustDraw: true },
  { path: (view) => `/?shot=1&t=12&zoom=0&tier=${view.tier}`, name: "close-still", scene: true, mustDraw: true },
  { path: (view) => `/?shot=1&t=12&zoom=1&tier=${view.tier}`, name: "galaxy-still", scene: true, mustDraw: true, spots: 11, phoneSpots: 2 },
  { path: (view) => `/?shot=1&t=12&zoom=2&tier=${view.tier}`, name: "web-still", scene: true, mustDraw: true, spots: 2, phoneSpots: 2 },
  { path: (view) => `/?shot=1&t=12&zoom=3&tier=${view.tier}`, name: "void-still", scene: true, mustDraw: true, spots: 1, phoneSpots: 1 },
  ...["black-hole", "nebula", "quasar", "neutron-star", "star", "strange-star", "dyson-sphere", "wormhole", "gravastar", "quasi-star", "earth", "moon"].flatMap((id) => [
    { path: () => `/${id}`, name: id, scene: true },
    { path: (view) => `/${id}?shot=1&t=12&tier=${view.tier}`, name: `${id}-still`, scene: true, mustDraw: true },
  ]),
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
      if (route.only && route.only !== name) continue;
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
        if (route.spots) {
          // every place of the stop on show must stand on the canvas, inside the window
          const placed = await page.evaluate(() => {
            const inView = (el) => {
              const r = el.getBoundingClientRect();
              return getComputedStyle(el).visibility === "visible" && r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
            };
            return [...document.querySelectorAll("[data-anchor]")].filter(inView).length;
          });
          // laptop first (D-110): a phone shows at least `phoneSpots` of them, the rest off its narrow screen
          const want = name === "phone" && route.phoneSpots ? route.phoneSpots : route.spots;
          if (name === "phone" && route.phoneSpots ? placed < want : placed !== want) problems.push(`${placed} places on screen, expected ${want}`);
        }
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) problems.push(`horizontal overflow of ${overflow}px`);

      const file = join(OUT, `${route.name}-${name}.png`);
      if (route.from) {
        // from the top of that element to the end of the page; images below the fold load first
        await page.evaluate(async () => {
          for (const img of document.querySelectorAll("img[loading='lazy']")) img.loading = "eager";
          await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })))));
        });
        const top = await page.evaluate((selector) => Math.round(document.querySelector(selector).getBoundingClientRect().top + scrollY), route.from);
        if (view.isMobile) {
          // A full-page shot grows a phone's window to the page's height, which changes every svh
          // unit and so the layout. On a phone, scroll a window at a time and save each one.
          const { height, total } = await page.evaluate(() => ({ height: innerHeight, total: document.documentElement.scrollHeight }));
          let part = 1;
          for (let y = top; y < total; y += height, part += 1) {
            await page.evaluate((to) => window.scrollTo(0, to), y);
            await page.waitForTimeout(150);
            await page.screenshot({ path: file.replace(/\.png$/, `-${part}.png`) });
          }
        } else {
          const clip = await page.evaluate((from) => ({ x: 0, y: from, width: innerWidth, height: document.documentElement.scrollHeight - from }), top);
          await page.screenshot({ path: file, fullPage: true, clip });
        }
      } else {
        await page.screenshot({ path: file, timeout: 90_000 }); // software WebGL can take tens of seconds a frame
      }
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
