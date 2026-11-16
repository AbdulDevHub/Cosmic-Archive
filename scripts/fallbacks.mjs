// Fallback tests for the scene system (docs/ARCHITECTURE.md section 8): tested, not assumed.
// Usage: npm run build && npm run fallbacks
//
//   1. live          the loop runs, stays under the draw-call limit, and Pause motion stops it
//   2. reduced       reduced motion draws a still frame and never loops
//   3. no WebGL      the poster shows, the page is complete, no 3D code is downloaded
//   4. slow device   under CPU throttling the governor steps the quality down
//   5. no scene      a cold load of /about downloads no 3D code
//   6. navigation    leaving for /about stops the loop; coming back (slowly, and at once) shows the scene again

import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const DRAW_CALL_LIMIT = 30; // ARCHITECTURE.md 3.6

/** Counts WebGL draw calls, and the most made between two animation frames. Runs before the page's own scripts. */
function countDraws() {
  const stats = (window.__draws = { total: 0, frame: 0, maxPerFrame: 0 });
  const proto = window.WebGL2RenderingContext?.prototype;
  if (!proto) return;
  for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
    const original = proto[name];
    proto[name] = function (...args) {
      stats.total += 1;
      stats.frame += 1;
      return original.apply(this, args);
    };
  }
  const tick = () => {
    stats.maxPerFrame = Math.max(stats.maxPerFrame, stats.frame);
    stats.frame = 0;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Makes every WebGL context request fail, as on a device or browser without WebGL. */
function removeWebGL() {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    return /webgl/i.test(type) ? null : original.call(this, type, ...rest);
  };
}

const draws = (page) => page.evaluate(() => window.__draws.total);
const html = (page, key) => page.evaluate((k) => document.documentElement.dataset[k], key);

/** Records every script the page downloads and reports whether any of them holds three. */
function watchScripts(page) {
  const bodies = [];
  page.on("response", (res) => {
    if (res.request().resourceType() === "script") bodies.push(res.text().catch(() => ""));
  });
  return async () => (await Promise.all(bodies)).some((text) => text.includes("WebGLRenderer"));
}

/** The page's meaning is all there without the scene: headline, both actions, poster loaded. */
function pageComplete(page) {
  return page.evaluate(() => {
    const poster = document.querySelector("picture img");
    return {
      headline: document.querySelector("h1")?.textContent ?? "",
      links: document.querySelectorAll("main a[href]").length,
      posterLoaded: !!poster && poster.complete && poster.naturalWidth > 0,
      canvases: document.querySelectorAll("canvas").length,
    };
  });
}

const results = [];
function check(test, name, pass, detail = "") {
  results.push(pass);
  console.log(`${pass ? "ok  " : "FAIL"} ${test}: ${name}${detail ? `  (${detail})` : ""}`);
}

const DESKTOP = { viewport: { width: 1440, height: 900 } };
// Software WebGL is slow. Tests that need a steady loop use a small window and pin the quality
// (`?tier=` turns the governor off), so they do not depend on how fast this machine draws.
const SMALL = { viewport: { width: 900, height: 560 } };
const PINNED = "/?tier=low";

let browser;
const { base, stop } = await serveBuild("fallbacks");
try {
  browser = await launchBrowser();

  // 1. live
  {
    const context = await browser.newContext(SMALL);
    await context.addInitScript(countDraws);
    const page = await context.newPage();
    await page.goto(base + PINNED, { waitUntil: "load" });
    await sceneSettled(page);
    const before = await draws(page);
    await page.waitForTimeout(1500);
    const after = await draws(page);
    check("live", "the loop runs", after > before, `${after - before} draw calls in 1.5 s`);
    const perFrame = await page.evaluate(() => window.__draws.maxPerFrame);
    check("live", `fewer than ${DRAW_CALL_LIMIT} draw calls a frame`, perFrame > 0 && perFrame < DRAW_CALL_LIMIT, `${perFrame}`);

    await page.getByRole("button", { name: /pause motion/i }).click();
    await page.waitForTimeout(400);
    const paused = await draws(page);
    await page.waitForTimeout(1500);
    const pausedLater = await draws(page);
    check("live", "Pause motion stops the loop", pausedLater === paused && (await html(page, "motion")) === "paused", `${pausedLater - paused} draw calls in 1.5 s`);
    await context.close();
  }

  // 2. reduced motion
  {
    const context = await browser.newContext({ ...DESKTOP, reducedMotion: "reduce" });
    await context.addInitScript(countDraws);
    const page = await context.newPage();
    await page.goto(base + "/", { waitUntil: "load" });
    await sceneSettled(page);
    await page.waitForTimeout(600);
    const before = await draws(page);
    await page.waitForTimeout(1500);
    const after = await draws(page);
    check("reduced", "a still frame is drawn", before > 0 && (await html(page, "scene")) === "ready", `${before} draw calls`);
    check("reduced", "no loop", after === before, `${after - before} draw calls in 1.5 s`);
    await context.close();
  }

  // 3. no WebGL
  {
    const context = await browser.newContext(DESKTOP);
    await context.addInitScript(removeWebGL);
    const page = await context.newPage();
    const loadedThree = watchScripts(page);
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await sceneSettled(page);
    const state = await pageComplete(page);
    check("no WebGL", "falls back to the poster", (await html(page, "scene")) === "static" && state.posterLoaded && state.canvases === 0);
    check("no WebGL", "the page is complete", state.headline.length > 0 && state.links >= 2, `"${state.headline}", ${state.links} links`);
    check("no WebGL", "no 3D code downloaded", !(await loadedThree()));
    await context.close();
  }

  // 4. slow device
  {
    const context = await browser.newContext(DESKTOP);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(base + "/", { waitUntil: "load" }); // no ?tier=: the governor must be free to act
    await sceneSettled(page);
    const start = await html(page, "sceneQuality");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 20 });
    const stepped = await page
      .waitForFunction((from) => document.documentElement.dataset.sceneQuality !== from, start, { timeout: 60000 })
      .then(() => true)
      .catch(() => false);
    const end = await html(page, "sceneQuality");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    check("slow device", "the governor steps down", stepped && (end === "static" || Number(end) > Number(start)), `quality ${start} to ${end}`);
    await context.close();
  }

  // 5. no scene
  {
    const context = await browser.newContext(DESKTOP);
    const page = await context.newPage();
    const loadedThree = watchScripts(page);
    await page.goto(base + "/about", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const canvases = await page.evaluate(() => document.querySelectorAll("canvas").length);
    check("no scene", "/about downloads no 3D code", !(await loadedThree()) && canvases === 0);
    await context.close();
  }

  // 6. navigation
  {
    const context = await browser.newContext(SMALL);
    await context.addInitScript(countDraws);
    const page = await context.newPage();
    const problems = [];
    page.on("console", (msg) => msg.type() === "error" && problems.push(msg.text()));
    page.on("pageerror", (err) => problems.push(err.message));
    const shown = () =>
      page
        .waitForFunction(() => document.documentElement.dataset.scene === "ready" && !!document.querySelector("canvas")?.parentElement?.hasAttribute("data-on"), undefined, { timeout: 30000 })
        .then(() => true)
        .catch(() => false);
    const about = page.getByRole("link", { name: "About" }).first();
    const home = page.getByRole("link", { name: "Cosmic Archive" }).first();

    await page.goto(base + PINNED, { waitUntil: "load" });
    await sceneSettled(page);
    await about.click();
    await page.waitForURL("**/about");
    await page.waitForTimeout(1200);
    const before = await draws(page);
    await page.waitForTimeout(1200);
    check("navigation", "the loop stops on /about", (await draws(page)) === before && (await html(page, "scene")) === undefined);

    await home.click();
    await page.waitForURL(base + "/");
    check("navigation", "the scene is shown again on return", await shown());

    // there and back inside the 300 ms fade: the scene must still come back
    await about.click();
    await home.click();
    await page.waitForURL(base + "/");
    await page.waitForTimeout(600);
    const quick = await shown();
    const canvases = await page.evaluate(() => document.querySelectorAll("canvas").length);
    check("navigation", "a quick there-and-back shows the scene", quick && canvases === 1 && problems.length === 0, problems.join("; "));
    await context.close();
  }

  // The watcher itself must be able to see three, or tests 3 and 5 prove nothing.
  {
    const context = await browser.newContext(DESKTOP);
    const page = await context.newPage();
    const loadedThree = watchScripts(page);
    await page.goto(base + "/", { waitUntil: "networkidle" });
    await sceneSettled(page);
    check("control", "a scene route does download 3D code", await loadedThree());
    await context.close();
  }
} catch (err) {
  console.error(err);
  results.push(false);
} finally {
  await browser?.close();
  stop();
}

process.exit(results.every(Boolean) ? 0 : 1);
