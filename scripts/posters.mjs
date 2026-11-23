// Renders scene stills into public/posters/ (context/ARCHITECTURE.md section 3.3).
// Usage: npm run build && npm run posters, then build again so the new stills are served.
//
// Each poster is the scene's own canvas at `?shot=1&t=12` (one deterministic frame, the same
// time live scenes start at, so the cross-fade from poster to canvas is seamless). Only the
// canvas is saved: no page copy, no header. Our own illustration, never a photograph (D-018).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const OUT = join("public", "posters");

const WIDE = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 / 3 };
const NARROW = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };

// `wide` covers landscape screens, `narrow` the phone composition (SceneSlot picks by aspect).
// `/` opens on its start page (D-107): the galaxy on the right, the planet, moons, rocks and ship
// before it. That is its poster and its share image.
const POSTERS = [
  { file: "atlas-start-wide.webp", path: "/?shot=1&t=12&tier=high", ...WIDE, quality: 0.8 },
  { file: "atlas-start-narrow.webp", path: "/?shot=1&t=12&tier=low", ...NARROW, quality: 0.8 },
  // Places: `<scene id>-wide` and `<scene id>-narrow`, the names the place page asks for.
  ...["black-hole", "nebula", "quasar", "neutron-star", "star", "strange-star", "dyson-sphere", "wormhole", "gravastar", "supernova-remnant", "magnetar", "black-hole-merger", "comet", "ringed-giant", "dark-matter", "molecular-cloud", "red-giant", "planetary-nebula", "white-dwarf", "quasi-star", "solar-system", "blue-world", "moon", "asteroid", "quasar-galaxy"].flatMap((id) => [
    { file: `${id}-wide.webp`, path: `/${id}?shot=1&t=12&tier=high`, ...WIDE, quality: 0.8 },
    { file: `${id}-narrow.webp`, path: `/${id}?shot=1&t=12&tier=low`, ...NARROW, quality: 0.8 },
  ]),
  // Open Graph images (O7, D-088): 1200x630 JPEG crops of the same frames, into public/og/.
  ...[
    ["atlas", "/?shot=1&t=12&tier=high"],
    ["black-hole", "/black-hole?shot=1&t=12&tier=high"],
    ["nebula", "/nebula?shot=1&t=12&tier=high"],
    ["quasar", "/quasar?shot=1&t=12&tier=high"],
    ["neutron-star", "/neutron-star?shot=1&t=12&tier=high"],
    ["star", "/star?shot=1&t=12&tier=high"],
    ["strange-star", "/strange-star?shot=1&t=12&tier=high"],
    ["dyson-sphere", "/dyson-sphere?shot=1&t=12&tier=high"],
    ["wormhole", "/wormhole?shot=1&t=12&tier=high"],
    ["gravastar", "/gravastar?shot=1&t=12&tier=high"],
    ["supernova-remnant", "/supernova-remnant?shot=1&t=12&tier=high"],
    ["magnetar", "/magnetar?shot=1&t=12&tier=high"],
    ["black-hole-merger", "/black-hole-merger?shot=1&t=12&tier=high"],
    ["comet", "/comet?shot=1&t=12&tier=high"],
    ["ringed-giant", "/ringed-giant?shot=1&t=12&tier=high"],
    ["dark-matter", "/dark-matter?shot=1&t=12&tier=high"],
    ["molecular-cloud", "/molecular-cloud?shot=1&t=12&tier=high"],
    ["red-giant", "/red-giant?shot=1&t=12&tier=high"],
    ["planetary-nebula", "/planetary-nebula?shot=1&t=12&tier=high"],
    ["white-dwarf", "/white-dwarf?shot=1&t=12&tier=high"],
    ["quasi-star", "/quasi-star?shot=1&t=12&tier=high"],
    ["solar-system", "/solar-system?shot=1&t=12&tier=high"],
    ["blue-world", "/blue-world?shot=1&t=12&tier=high"],
    ["moon", "/moon?shot=1&t=12&tier=high"],
    ["asteroid", "/asteroid?shot=1&t=12&tier=high"],
    ["quasar-galaxy", "/quasar-galaxy?shot=1&t=12&tier=high"],
  ].map(([name, path]) => ({ file: `${name}.jpg`, dir: join("public", "og"), path, viewport: { width: 1440, height: 900 }, crop: { x: 0, y: 72, w: 1440, h: 756 }, out: 1200, quality: 0.82, type: "image/jpeg" })),
];

// `npm run posters -- nebula` makes only the posters whose path contains the word (`-- og` for the
// Open Graph images).
const only = process.argv[2];

mkdirSync(OUT, { recursive: true });

let failed = false;
let browser;
const { base, stop } = await serveBuild("posters");
try {
  browser = await launchBrowser();
  for (const poster of POSTERS) {
    if (only && !join(poster.dir ?? OUT, poster.file).includes(only)) continue;
    const context = await browser.newContext({ viewport: poster.viewport, deviceScaleFactor: poster.deviceScaleFactor });
    const page = await context.newPage();
    const problems = [];
    // On a first run the posters do not exist yet, so the page's own poster request is a 404: expected.
    page.on("console", (msg) => msg.type() === "error" && !msg.text().startsWith("Failed to load resource") && problems.push(`console: ${msg.text()}`));
    page.on("response", (res) => res.status() >= 400 && !new URL(res.url()).pathname.startsWith("/posters/") && problems.push(`${res.status()}: ${res.url()}`));
    page.on("pageerror", (err) => problems.push(`page error: ${err.message}`));

    await page.goto(base + poster.path, { waitUntil: "load" });
    await sceneSettled(page, 180000); // the heaviest scenes take minutes under software WebGL
    const result = await page.evaluate(({ quality, crop, out, type }) => {
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
      const url = canvas.toDataURL(type, quality);
      if (!url.startsWith(`data:${type}`)) return { error: `this browser cannot encode ${type}` };
      return { url, width: canvas.width, height: canvas.height };
    }, { quality: poster.quality, crop: poster.crop ?? null, out: poster.out ?? 0, type: poster.type ?? "image/webp" });

    if (result.error) problems.push(result.error);
    if (problems.length) {
      failed = true;
      console.log(`FAIL ${poster.file}`);
      for (const p of problems) console.log(`     ${p}`);
    } else {
      const bytes = Buffer.from(result.url.split(",")[1], "base64");
      const dir = poster.dir ?? OUT;
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, poster.file), bytes);
      console.log(`ok   ${join(dir, poster.file)}  ${result.width}x${result.height}  ${(bytes.length / 1024).toFixed(0)} KB`);
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
