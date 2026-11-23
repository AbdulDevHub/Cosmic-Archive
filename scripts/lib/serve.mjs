// Shared by shots.mjs and posters.mjs: serve the production build on a free port and open a
// browser that can draw WebGL without a GPU.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright";

/** Starts `next start` on a port nothing else is using, so output never comes from a stale server. */
export async function serveBuild(label) {
  if (!existsSync(join(".next", "BUILD_ID"))) {
    console.error(`${label}: no production build found. Run \`npm run build\` first.`);
    process.exit(1);
  }

  const port = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, () => {
      const { port: free } = probe.address();
      probe.close(() => resolve(free));
    });
  });
  const base = `http://localhost:${port}`;

  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  let exited = false;
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  server.on("exit", () => (exited = true));

  const start = Date.now();
  for (;;) {
    if (exited) throw new Error(`next start exited early\n${log}`);
    if (Date.now() - start > 30000) {
      server.kill();
      throw new Error(`server did not start on ${base}\n${log}`);
    }
    try {
      const res = await fetch(base);
      if (res.ok) break;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return { base, stop: () => server.kill() };
}

/** Headless Chromium with software WebGL allowed, so scenes draw on machines and CI without a GPU. */
export function launchBrowser(extraArgs = []) {
  // PW_CHROMIUM: a Chromium already on the machine (a cloud container whose browser does not match this Playwright)
  const executablePath = process.env.PW_CHROMIUM || undefined;
  return chromium.launch({ executablePath, args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", ...extraArgs] });
}

/**
 * Resolves once the scene has drawn its first frame, or the page has settled on the poster. The
 * heavier live scenes (the black hole) take over 30 s under software WebGL, so allow 90 s.
 */
export function sceneSettled(page, timeout = 90000) {
  return page.waitForFunction(
    () => {
      const state = document.documentElement.dataset.scene;
      return state === "ready" || state === "static";
    },
    undefined,
    { timeout },
  );
}
