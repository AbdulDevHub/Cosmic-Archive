// The repo's social preview (GitHub, 1280x640): the real start page, drawn live. `npm run build` first.
// Upload the result in GitHub: Settings > General > Social preview.
import { launchBrowser, sceneSettled, serveBuild } from "./lib/serve.mjs";

const { base, stop } = await serveBuild("social");
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/?tier=high`, { waitUntil: "load" });
  await sceneSettled(page, 180000);
  await page.waitForTimeout(4000); // the start page's own entrance settles
  await page.screenshot({ path: ".github/social-preview.png" });
  console.log("ok   .github/social-preview.png  1280x640");
} finally {
  await browser.close();
  await stop();
}
