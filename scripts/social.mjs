// The share card: `scripts/social-card.html` laid over the site's own scene stills in `public/posters/`
// (run `npm run posters` first if they changed). No build or server needed. It makes two:
// - `.github/social-preview.png` (1280x640): upload it in GitHub, Settings > General > Social preview.
// - `public/og/atlas.jpg` (1200x630): the home page's Open Graph image and the site's default (D-207).
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { launchBrowser } from "./lib/serve.mjs";

const CARDS = [
  { path: ".github/social-preview.png", width: 1280, height: 640, type: "png" },
  { path: "public/og/atlas.jpg", width: 1200, height: 630, type: "jpeg", quality: 86 },
];

const browser = await launchBrowser();
try {
  for (const card of CARDS) {
    const page = await browser.newPage({ viewport: { width: card.width, height: card.height }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(resolve("scripts/social-card.html")).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: card.path, type: card.type, ...(card.quality ? { quality: card.quality } : {}) });
    console.log(`ok   ${card.path}  ${card.width}x${card.height}`);
    await page.close();
  }
} finally {
  await browser.close();
}
