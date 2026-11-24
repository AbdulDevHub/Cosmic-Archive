// The repo's share card (GitHub, 1280x640): `scripts/social-card.html` laid over the site's own scene
// stills in `public/posters/` (run `npm run posters` first if they changed). No build or server needed.
// Upload the result in GitHub: Settings > General > Social preview.
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { launchBrowser } from "./lib/serve.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve("scripts/social-card.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: ".github/social-preview.png" });
  console.log("ok   .github/social-preview.png  1280x640");
} finally {
  await browser.close();
}
