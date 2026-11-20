// Renders scene stills into public/posters/ (docs/ARCHITECTURE.md section 3.3).
// Usage: npm run build && npm run posters, then build again so the new stills are served.
//
// Each poster is the scene's own canvas at `?shot=1&t=12` (one deterministic frame, the same
// time live scenes start at, so the cross-fade from poster to canvas is seamless). Only the
// canvas is saved: no page copy, no header. Our own illustration, never a photograph (D-018).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const OUT = join("public", "posters");

// `wide` covers landscape screens, `narrow` the phone composition (SceneSlot picks by aspect).
const POSTERS = [
  { file: "atlas-hero-wide.webp", path: "/?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.8 },
  { file: "atlas-hero-narrow.webp", path: "/?shot=1&t=12&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.8 },
  // The chart is what /explore opens on. The chart and the web also stand in for their sections of
  // the homepage on a device that will not draw the scene at all.
  { file: "atlas-chart-wide.webp", path: "/?shot=1&t=12&zoom=1&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.8 },
  { file: "atlas-chart-narrow.webp", path: "/?shot=1&t=12&zoom=1&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.8 },
  { file: "atlas-web-wide.webp", path: "/?shot=1&t=12&zoom=2&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.75 },
  { file: "atlas-web-narrow.webp", path: "/?shot=1&t=12&zoom=2&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.75 },
  // Subject scenes: `<scene id>-wide` and `<scene id>-narrow`, the names the subject page asks for.
  { file: "black-hole-wide.webp", path: "/subjects/black-holes?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.8 },
  { file: "black-hole-narrow.webp", path: "/subjects/black-holes?shot=1&t=12&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.8 },
  // the atlas galaxy in its subject framing (the Galaxies page asks for `atlas-subject-*`)
  { file: "atlas-subject-wide.webp", path: "/subjects/galaxies?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.8 },
  { file: "atlas-subject-narrow.webp", path: "/subjects/galaxies?shot=1&t=12&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.8 },
  { file: "nebula-wide.webp", path: "/subjects/nebulae?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, quality: 0.8 },
  { file: "nebula-narrow.webp", path: "/subjects/nebulae?shot=1&t=12&tier=low", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, quality: 0.8 },
  // Windows for the homepage's Destinations section: a part of a scene, cropped. `crop` is in CSS
  // pixels of the viewport; `out` is the saved width. A destination whose own scene is not built yet
  // looks at the place on the atlas where it is found (quasars on the web).
  { file: "window-black-holes.webp", path: "/subjects/black-holes?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, crop: { x: 630, y: 90, w: 640, h: 640 }, out: 720, quality: 0.8 },
  { file: "window-galaxies.webp", path: "/?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, crop: { x: 540, y: 110, w: 900, h: 600 }, out: 960, quality: 0.78 },
  { file: "window-nebulae.webp", path: "/subjects/nebulae?shot=1&t=12&tier=high", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3, crop: { x: 773, y: 150, w: 340, h: 430 }, out: 480, quality: 0.8 },
  { file: "window-quasars.webp", path: "/?shot=1&t=12&zoom=2&tier=high", viewport: { width: 1440, height: 900 }, crop: { x: 800, y: 560, w: 480, h: 160 }, out: 960, quality: 0.8 },
];

// `npm run posters -- window-` makes only the posters whose file name contains the word.
const only = process.argv[2];

mkdirSync(OUT, { recursive: true });

let failed = false;
let browser;
const { base, stop } = await serveBuild("posters");
try {
  browser = await launchBrowser();
  for (const poster of POSTERS) {
    if (only && !poster.file.includes(only)) continue;
    const context = await browser.newContext({ viewport: poster.viewport, deviceScaleFactor: poster.deviceScaleFactor });
    const page = await context.newPage();
    const problems = [];
    // On a first run the posters do not exist yet, so the page's own poster request is a 404: expected.
    page.on("console", (msg) => msg.type() === "error" && !msg.text().startsWith("Failed to load resource") && problems.push(`console: ${msg.text()}`));
    page.on("response", (res) => res.status() >= 400 && !new URL(res.url()).pathname.startsWith("/posters/") && problems.push(`${res.status()}: ${res.url()}`));
    page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));

    await page.goto(base + poster.path, { waitUntil: "load" });
    await sceneSettled(page);
    const result = await page.evaluate(({ quality, crop, out }) => {
      if (document.documentElement.dataset.scene !== "ready") return { error: "the scene did not draw (static fallback)" };
      let canvas = document.querySelector("canvas");
      if (!canvas) return { error: "no canvas" };
      if (crop) {
        const k = canvas.width / innerWidth; // device pixels per CSS pixel of the drawing buffer
        const part = document.createElement("canvas");
        part.width = out;
        part.height = Math.round((out * crop.h) / crop.w);
        part.getContext("2d").drawImage(canvas, crop.x * k, crop.y * k, crop.w * k, crop.h * k, 0, 0, part.width, part.height);
        canvas = part;
      }
      const url = canvas.toDataURL("image/webp", quality);
      if (!url.startsWith("data:image/webp")) return { error: "this browser cannot encode WebP" };
      return { url, width: canvas.width, height: canvas.height };
    }, { quality: poster.quality, crop: poster.crop ?? null, out: poster.out ?? 0 });

    if (result.error) problems.push(result.error);
    if (problems.length) {
      failed = true;
      console.log(`FAIL ${poster.file}`);
      for (const p of problems) console.log(`     ${p}`);
    } else {
      const bytes = Buffer.from(result.url.split(",")[1], "base64");
      writeFileSync(join(OUT, poster.file), bytes);
      console.log(`ok   ${join(OUT, poster.file)}  ${result.width}x${result.height}  ${(bytes.length / 1024).toFixed(0)} KB`);
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
