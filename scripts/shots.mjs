// Screenshots of the built app for the design checklist (docs/DESIGN_SPEC.md section 11).
// Usage: npm run build && npm run shots
// Starts `next start` on a free port, captures each route at desktop, phone and desktop with
// reduced motion, writes PNGs to screenshots/, and fails on any console error or failed request.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright";

const ROUTES = [{ path: "/", name: "home" }];

const VIEWS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" },
  { name: "phone", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", isMobile: true, hasTouch: true },
  { name: "desktop-reduced", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
];

const OUT = "screenshots";

if (!existsSync(join(".next", "BUILD_ID"))) {
  console.error("shots: no production build found. Run `npm run build` first.");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// A port nothing else is using, so the shots can never come from a stale server.
const PORT = await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(0, () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});
const BASE = `http://localhost:${PORT}`;

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
let serverExited = false;
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
server.on("exit", () => (serverExited = true));

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (serverExited) throw new Error(`next start exited early\n${serverLog}`);
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not start on ${BASE}\n${serverLog}`);
}

let failed = false;
let browser;
try {
  await waitForServer();
  browser = await chromium.launch();

  for (const view of VIEWS) {
    const { name, ...options } = view;
    const context = await browser.newContext(options);
    for (const route of ROUTES) {
      const page = await context.newPage();
      const problems = [];
      page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
      page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));
      page.on("requestfailed", (req) => problems.push(`request failed: ${req.url()}`));

      await page.goto(BASE + route.path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) problems.push(`horizontal overflow of ${overflow}px`);

      const file = join(OUT, `${route.name}-${name}.png`);
      await page.screenshot({ path: file });
      console.log(`${problems.length ? "FAIL" : "ok  "} ${file}`);
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
  server.kill();
}

process.exit(failed ? 1 : 0);
