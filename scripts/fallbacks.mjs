// Fallback and flow tests for the scene system (docs/ARCHITECTURE.md section 8): tested, not assumed.
// Usage: npm run build && npm run fallbacks
//
//   1. live          the loop runs, stays under the draw-call limit, and Pause motion stops it
//   2. reduced       reduced motion draws a still frame and never loops
//   3. no WebGL      the poster shows, the screen is complete, no 3D code is downloaded
//   4. slow device   under CPU throttling the governor steps the quality down
//   5. no scene      a cold load of /about downloads no 3D code
//   6. navigation    leaving for /about stops the loop; coming back (slowly, and at once) shows the scene again
//   7. places        each place: its loop on `low` under the draw-call limit, reduced motion, no WebGL
//   8. flow          a click on a place dives in, the veil falls and lifts on the place's page; Further comes back
//   9. calm flow     with reduced motion the same moves are a short cross-fade, and the veil never stays down
//  10. keyboard      by keyboard only: focus reaches the controls, keys zoom, a place opens, Escape comes back
//  11. touch         by touch only: a pinch zooms, a tap on a place opens it

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

/** Notes whenever the veil is down, so a test can tell that a move went through it. */
function watchVeil() {
  window.__veil = { fell: 0 };
  new MutationObserver(() => {
    if (document.querySelector("[data-down]")) window.__veil.fell += 1;
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-down"] });
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

/** The screen's meaning is all there without the scene: name, line, links, poster loaded. */
function pageComplete(page) {
  return page.evaluate(() => {
    const poster = document.querySelector("picture img");
    return {
      headline: document.querySelector("h1")?.textContent ?? "",
      line: document.querySelector("h1 + p")?.textContent ?? "",
      links: document.querySelectorAll("main a[href]").length,
      posterLoaded: !!poster && poster.complete && poster.naturalWidth > 0,
      canvases: document.querySelectorAll("canvas").length,
    };
  });
}

/** Waits until the move between scenes is over: the veil is up and takes no clicks. */
function settledFlow(page, timeout = 15000) {
  return page
    .waitForFunction(() => !document.querySelector("[data-active]") && document.documentElement.dataset.scene === "ready", undefined, { timeout })
    .then(() => true)
    .catch(() => false);
}

/** A place's light, once it stands on the canvas. */
async function spotFor(page, href) {
  const spot = page.locator(`a[data-anchor][href="${href}"]:not([data-hidden])`);
  await spot.waitFor({ state: "visible", timeout: 20000 });
  return spot;
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
const PLACES = ["/black-hole", "/nebula", "/quasar"];

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

    // pressed from the keyboard: under software WebGL a pointer click sometimes waited out its
    // timeout while the main thread drew, and the test proves the control, not the pointer
    await page.getByRole("button", { name: /pause motion/i }).focus();
    await page.keyboard.press("Enter");
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
    check("no WebGL", "the screen is complete: name, line and every place as a link", state.headline.length > 0 && state.line.length > 0 && state.links >= 3, `"${state.headline}", ${state.links} links`);
    check("no WebGL", "no 3D code downloaded", !(await loadedThree()));
    await page.click('a[href="/nebula"]');
    await page.waitForURL("**/nebula");
    check("no WebGL", "a place opens as a plain link, and its veil never falls", (await page.locator("[data-active]").count()) === 0 && (await page.locator("h1").textContent()) === "Nebula");
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

  // 7. places: each one's own scene, on the low tier, with reduced motion and without WebGL
  for (const path of PLACES) {
    const name = path.slice(1);
    {
      const context = await browser.newContext(SMALL);
      await context.addInitScript(countDraws);
      const page = await context.newPage();
      await page.goto(base + path + "?tier=low", { waitUntil: "load" });
      await sceneSettled(page);
      const before = await draws(page);
      await page.waitForTimeout(1500);
      const after = await draws(page);
      const perFrame = await page.evaluate(() => window.__draws.maxPerFrame);
      check(name, `the loop runs, fewer than ${DRAW_CALL_LIMIT} draw calls a frame`, after > before && perFrame > 0 && perFrame < DRAW_CALL_LIMIT, `${perFrame} a frame`);
      await context.close();
    }
    {
      const context = await browser.newContext({ ...DESKTOP, reducedMotion: "reduce" });
      await context.addInitScript(countDraws);
      const page = await context.newPage();
      await page.goto(base + path, { waitUntil: "load" });
      await sceneSettled(page);
      await page.waitForTimeout(600);
      const before = await draws(page);
      await page.waitForTimeout(1500);
      const after = await draws(page);
      check(name, "reduced motion: one still frame, no loop", before > 0 && after === before && (await html(page, "scene")) === "ready", `${after - before} draw calls in 1.5 s`);
      await context.close();
    }
    {
      const context = await browser.newContext(DESKTOP);
      await context.addInitScript(removeWebGL);
      const page = await context.newPage();
      const loadedThree = watchScripts(page);
      await page.goto(base + path, { waitUntil: "networkidle" });
      await sceneSettled(page);
      const state = await pageComplete(page);
      const further = await page.locator('a[href="/"]', { hasText: "Further" }).count();
      check(name, "no WebGL: poster, name, line, Further, no 3D code", (await html(page, "scene")) === "static" && state.posterLoaded && state.canvases === 0 && state.headline.length > 0 && state.line.length > 0 && further === 1 && !(await loadedThree()), `"${state.headline}"`);
      await context.close();
    }
  }

  // 8. the flow, with motion: dive in through the veil, then Further back out
  {
    const context = await browser.newContext(SMALL);
    await context.addInitScript(watchVeil);
    const page = await context.newPage();
    const problems = [];
    page.on("console", (msg) => msg.type() === "error" && problems.push(msg.text()));
    page.on("pageerror", (err) => problems.push(err.message));
    await page.goto(base + PINNED, { waitUntil: "load" });
    await sceneSettled(page);
    await (await spotFor(page, "/black-hole")).click();
    await page.waitForURL("**/black-hole", { timeout: 15000 });
    const arrived = await settledFlow(page);
    const fell = await page.evaluate(() => window.__veil.fell);
    check("flow", "a click on a place dives in, through the veil, and the veil lifts on its page", arrived && fell > 0, `veil fell ${fell} times`);
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: "Further" }).click();
    await page.waitForURL(base + "/", { timeout: 15000 });
    const back = await settledFlow(page);
    const canvases = await page.evaluate(() => document.querySelectorAll("canvas").length);
    check("flow", "Further shrinks the place away and comes back to the galaxy", back && canvases === 1 && problems.length === 0, problems.join("; "));

    // Back in the middle of a dive calls the move off: the visitor is not pushed forward again
    await page.goto(base + "/about?tier=low", { waitUntil: "load" });
    await page.getByRole("link", { name: "Cosmic Archive" }).first().click();
    await page.waitForURL((url) => url.pathname === "/");
    await sceneSettled(page);
    await (await spotFor(page, "/black-hole")).click();
    await page.waitForTimeout(300);
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/about", { timeout: 10000 });
    await page.waitForTimeout(2500);
    const stayed = new URL(page.url()).pathname === "/about";
    const lifted = (await page.locator("[data-active]").count()) === 0;
    check("flow", "Back mid-dive calls the move off, and the veil lifts", stayed && lifted, new URL(page.url()).pathname);
    await context.close();
  }

  // 9. the flow with reduced motion: a short cross-fade each way, never a veil left down
  {
    const context = await browser.newContext({ ...SMALL, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base + "/", { waitUntil: "load" });
    await sceneSettled(page);
    const started = Date.now();
    await (await spotFor(page, "/nebula")).click();
    await page.waitForURL("**/nebula", { timeout: 10000 });
    const arrived = await settledFlow(page, 10000);
    check("calm flow", "reduced motion: a place opens through a short cross-fade", arrived, `${Date.now() - started} ms`);
    await page.keyboard.press("Escape");
    await page.waitForURL(base + "/", { timeout: 10000 });
    check("calm flow", "reduced motion: Escape comes back, and the veil lifts", await settledFlow(page, 10000));
    await context.close();
  }

  // 10. keyboard only: the controls are reachable and visibly focused, the keys zoom, a place opens
  // and Escape comes back out
  {
    const context = await browser.newContext(SMALL);
    const page = await context.newPage();
    await page.goto(base + PINNED, { waitUntil: "load" });
    await sceneSettled(page);
    await page.waitForTimeout(3500); // the opening glide from the web to the galaxy
    const further = page.getByRole("button", { name: "Further" });
    let reached = false;
    let visible = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      ({ reached, visible } = await page.evaluate(() => {
        const active = document.activeElement;
        return { reached: active?.textContent?.trim() === "Further", visible: !!active?.matches(":focus-visible") };
      }));
    }
    check("keyboard", "Tab reaches the controls, with a visible focus", reached && visible);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const atWeb = (await further.getAttribute("aria-disabled")) === "true";
    await page.keyboard.press("+");
    await page.waitForTimeout(300);
    const closer = (await further.getAttribute("aria-disabled")) === "false";
    check("keyboard", "Enter glides to the next stop, + moves closer", atWeb && closer);
    await page.keyboard.press("-");
    await page.waitForTimeout(2500); // the camera eases out and the web's places appear
    let onPlace = false;
    for (let i = 0; i < 12 && !onPlace; i++) {
      await page.keyboard.press("Shift+Tab");
      onPlace = await page.evaluate(() => !!document.activeElement?.matches("a[data-anchor]"));
    }
    if (onPlace) await page.keyboard.press("Enter");
    const opened = onPlace && (await page.waitForURL((url) => url.pathname === "/quasar", { timeout: 15000 }).then(() => true, () => false));
    check("keyboard", "Enter on a place opens it", opened && (await settledFlow(page)), page.url().replace(base, ""));
    await page.keyboard.press("Escape");
    const out = await page.waitForURL(base + "/", { timeout: 15000 }).then(() => true, () => false);
    check("keyboard", "Escape comes back out", out && (await settledFlow(page)));
    await context.close();
  }

  // 11. touch only: a pinch zooms, a tap on a place opens it
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(base + PINNED, { waitUntil: "load" });
    await sceneSettled(page);
    await page.waitForTimeout(3500); // the opening glide
    const further = page.getByRole("button", { name: "Further" });
    const before = await further.getAttribute("aria-disabled");
    const cdp = await context.newCDPSession(page);
    const cx = 195;
    const cy = 300;
    const touch = (type, d) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }] });
    await touch("touchStart", 140);
    for (let d = 130; d >= 30; d -= 10) await touch("touchMove", d);
    await touch("touchEnd", 0);
    await page.waitForTimeout(400);
    const after = await further.getAttribute("aria-disabled");
    check("touch", "a pinch pulls back to the cosmic web", before !== "true" && after === "true", `Further disabled: ${before} then ${after}`);
    const spot = await spotFor(page, "/quasar").catch(() => null);
    if (spot) await spot.tap();
    const opened = !!spot && (await page.waitForURL((url) => url.pathname === "/quasar", { timeout: 15000 }).then(() => true, () => false));
    check("touch", "a tap on a place opens it", opened && (await settledFlow(page)), page.url().replace(base, ""));
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
