# Cosmic Archive: Phase Checklist

Tick an item only when it is implemented and verified. Sessions are defined in `PHASED_ROADMAP.md`.

## Next session (read this first)

Folded in from the old `OPUS_NEXT_WEEK_PROMPT.md` (D-106). A fresh session has no memory: read `CLAUDE.md`, this section, `docs/DESIGN_SPEC.md` (2 bans and their start-page exception, 7.0 the start page, 7 the screens), `docs/ARCHITECTURE.md` (3 the scene system and the flow, 4 the atlas) and `docs/DECISIONS.md` from D-092 on. The original ChatGPT direction is in git commit `15e3478` (the owner also keeps a copy in `Cosmic_Archive_Opus_Handoff/`, not in git). **The owner's newer decisions override it**: where the two disagree, the decision log wins.

### Where things stand (2026-11-21, end of a long session)

Last commit: `2499543` (start page). Everything is committed; nothing is pushed or deployed. Sessions this day, in order: S1 spectacle (D-092 to D-098), S1b fuller with sound (D-099 to D-102), S1c nebula, jets, gentle sound (D-103 to D-105), S1d start page and file tidy (D-106, D-107).

The site now: `/` opens on the start page (Home.png); Begin flies into the galaxy (stops 0 close in, 1 galaxy, 2 cosmic web, hotspots); from there dive into `/black-hole`, `/nebula`, `/quasar` (Closer, Further, drag, pinch); Further or Escape flies back. No About page, no Pause button (reduced motion still respected). Sound: the owner's "Magical Space" plus Web Audio whooshes, started by Begin or any first gesture, Sound button in the header.

### What the owner wants (their words, so nothing is misread again)

- "A spectacle site that showcases beauty, not an educational site." Almost no text: a name and one line per view.
- Click to travel, smooth flow between scenes; wheel and pinch as extras; nothing scrolls.
- No drawn lines over the scenery ("the universe doesn't have them"). Dust must never look like lines.
- "Fill it", "it feels empty": full, colourful frames, as in `reference images/` (not in git; look at them).
- They love the black hole effect ("really cool"). They wanted quasar jets that show power. The new nebula replaced one they found ugly.
- The start page follows `reference images/Home.png`: they asked for it "like the image", including the gradient text, glass bar and dock, pill button, menus and search kept as "coming soon" decoration for pages they may build later, and the ship ("make it as cool as possible; if it looks bad or fake we can remove it").
- On S1d, their verdict: **"It's a good start, definitely needs some polish."** They did not yet say what to polish.

### Next: polish the start page (S1e), then S2

1. **Ask the owner first what to polish** on the start page; do not guess at large changes. Offer the known candidates below.
2. Known candidates, from our own look at the screenshots (`npm run shots`, `screenshots/start-still-*`, and a filmed flight):
   - the ship: simple primitives, reads a little like a paper plane; more detail (panel lines, lights, a more sculpted hull) or remove, as the owner says;
   - the planet: seen almost edge-on its continents stretch; the city lights and clouds could be richer; compare with Home.png's planet;
   - phone: asteroids sit close to the words at the bottom;
   - the flight in (3.8 s): check it at real speed on a GPU, not only software WebGL;
   - the galaxy on the start page and in the atlas is thinner between its arms than the references (this is S2's work).
3. Then **S2, galaxy and cosmic web** (atlas scene only): richer colour from core to arms; pink star-forming knots and blue young clusters; the disc denser between the arms; a deeper, glowing web (thin on a phone at `low`); a finer dive through the disc; posters re-rendered.
4. Later: S3 black hole and quasar polish, S4 nebula (phone composition), S5 owner review then deploy (Vercel, only when the owner says so; they set `NEXT_PUBLIC_SITE_URL`).

### How to check (all must pass before reporting)

`npm run check`; `npm run build`; `npm run posters` then build again if a scene changed; `npm run shots` (33, look at the stills against DESIGN_SPEC 11); `npm run fallbacks` (41; slow under software WebGL, run it in the background); `npm run a11y` (8). Draw calls on `low` under 30; scene chunks under 40 KB. Tests that need the atlas itself use `/#atlas` (skips the start page). Under software WebGL some frames take seconds: click heavy scenes from inside the page (`locator.evaluate(el => el.click())`), as test 12 does.

### Working habits the owner expects

Short replies, results first. Commit each finished piece with the `gitmoji-commit` style, never push. Run the reviewer agent on substantial diffs before reporting (it found real bugs twice). Leave the production server running for them (`npx next start -H 0.0.0.0 -p 3000`; phone at the computer's LAN address). Update this section, `DECISIONS.md` and the memory note at the end of every session.

## F0 Re-plan

- [x] Docs read, blind spots listed, owner interviewed (5 questions).
- [x] Plan approved by the owner.
- [x] Git repository created; original docs snapshotted (`15e3478`).
- [x] Blueprint, technical direction, roadmap, design spec rewritten; architecture written.
- [x] Decisions D-011 to D-025 recorded.
- [x] `CLAUDE.md` rewritten; `README.md` added.
- [x] First draft of `OPUS_NEXT_WEEK_PROMPT.md` (folded into the "Next session" section above in S1d, D-106).

## F1 Look prototype

- [x] `prototype/look.html` shows the hero, the chart and the zoom out (`?stage=0|1|2`, `?t=` fixes time; scroll drives the zoom without the switches).
- [x] Headless WebGL screenshots work (1440x900, 390x844); six stills in `prototype/shots/`. No console errors.
- [x] Second round from the owner's notes: sans headline face (Jost, with Syne as the alternative), redrawn hero actions, bigger and fuller galaxy. Stills re-shot; `font-options.png` and `desktop-stage0-syne.png` added.
- [x] Owner approved the look and picked the headline face: Syne (2026-11-11). Stills re-shot in Syne.
- [x] Tokens and type in `DESIGN_SPEC.md` corrected to match and locked.

Fable's part ends here (D-028). Everything below is built by Opus.

## F2 Scaffold

- [x] Next 16 app (16.4.6, React 19.3), TypeScript strict, ESLint flat config.
- [x] Folder boundaries from `ARCHITECTURE.md` in place (`src/scene/` holds only a README).
- [x] `tokens.css`, fonts, header and footer shell; hero copy and both actions; `/about` stub.
- [x] `check`, `shots`, `posters` scripts.
- [x] `npm run check` and `npm run build` pass; `npm run shots` writes three screenshots with no console errors (2026-11-14).
- [x] Hero copy, header and actions line up with `prototype/shots/*-stage0.png`; reduced motion stills the dot; hover fills the ring; focus rings show; Pause persists across reloads (Playwright, 2026-11-14).
- [x] First-load JS for `/` is 135 KB gzip, inside the 140 KB budget the owner set after F2 (D-033).

## F3a Scene system + the hero galaxy

- [x] `SceneHost`, `SceneSlot`, registry, store.
- [x] Tiers and frame-time governor.
- [x] Poster-first loading; `still` and `static` fallbacks; Pause motion control.
- [x] Atlas Level 1 (galaxy) at the hero view, linework, vessel and trail.
- [x] Fallback tests pass (reduced motion, no WebGL, throttled CPU, no three on a no-scene route): `npm run fallbacks`, 14 of 14 including going to another page and back (2026-11-16).
- [x] Hero screenshots pass the design checklist against `prototype/shots/` (`screenshots/home-still-desktop.png` and `home-still-phone.png`, 2026-11-16).
- [x] Budgets measured (gzip): first load 138.3 KB for `/` and 137.8 KB for `/about` (limit 140); host + three + R3F 185 KB (220); atlas chunk 11 KB (40); 19 draw calls a frame (30).
- [ ] Not yet measured on real hardware: frame rate on an integrated-GPU laptop and on a mid-range phone. The automated runs use software WebGL, which only proves the governor reacts.

## F3b Atlas chart, zoom out and Explore

- [x] Atlas Level 2 (cosmic web) and the zoom between levels.
- [x] Beacons are real links; list view. Every beacon points at `/about` until its subject page exists (D-044).
- [x] `/` wired to scroll through all three stages; `/explore` with free control (wheel, drag, + and - keys, arrow keys, two step buttons).
- [x] Chart and zoom-out screenshots pass the design checklist against `prototype/shots/` (`screenshots/chart-still-*`, `web-still-*`, `explore-still-*`; `npm run shots` 21 of 21, 2026-11-17).
- [x] Labels checked in motion at 1440x900, 1024x700 and 390x844: steady while the disc turns (one small move in 30 s), on screen and off the copy after turning, zooming and scrolling. Still rough: between the chart and the web (zoom about 1.3) the fading labels crowd the small galaxy.
- [x] `npm run fallbacks` 14 of 14; 20 draw calls a frame (limit 30).
- [x] Budgets measured (gzip, 2026-11-17): `/about` first load 138.1 KB (limit 140); host + three + R3F 183 KB (220); atlas chunk 13.4 KB (40).
- [ ] For the owner: first-load JS on the two scene routes is now 144.7 KB (`/`) and 145.1 KB (`/explore`), up from 138.3 KB, because the beacons and their label placement are page code. The 140 KB limit is written for routes with no scene (D-047).
- [ ] Not yet tried on real hardware: touch on `/explore` (a sideways drag only; the rest is O6), frame rate (as F3a).

## F4 Content model + Black Holes

- [x] MDX pipeline with validated frontmatter (`@next/mdx`, zod; D-049, D-050). `npm run check` and `npm run build` pass (2026-11-17).
- [x] `check-content` fails on a missing source: removing `ligo-gw150914` gave `FAIL ... names a source that is not in the frontmatter`, exit 1 (2026-11-17).
- [x] Subject page framework components: hero with scene and callouts, claims, evidence blocks, diagram, unknowns, sources, related.
- [x] Black-hole scene within budget on `low`: 1 draw call a frame (30), scene chunk 4.4 KB (40), host + three + R3F 183 KB (220). No WebGL: poster, full page, no 3D code. First-load JS 142.1 KB (scene route, D-047, D-054).
- [x] Screenshots pass the design checklist: `npm run shots` 27 of 27; phone callout overlap fixed (D-053); atlas stills unchanged against `prototype/shots/`. `npm run fallbacks` 14 of 14.
- [x] Black Holes copy written from fetched sources (9, all checked 2026-11-17). Spot check re-fetched on 2026-11-17: 10 claims from the two main NASA pages match.
- [ ] Owner has read the copy.
- [ ] Not yet measured on real hardware: the ray-marched scene's frame rate on a mid-range phone.

## Opus sessions

- [x] O1 Homepage lower half, About, Archive index (2026-11-17):
  - [x] Destinations (four windows of own art, D-055), the journey preview as one branching line, the Uncharted teaser in dashed and dotted ink with the legend, the full footer.
  - [x] `/about` (purpose, evidence legend, method, imagery, credits) and `/archive` (published, then being written). Nav: Explore, Archive, About; phone menu (D-059).
  - [x] No dead links: every internal link on `/`, `/about`, `/archive`, `/explore` and `/subjects/black-holes` resolves; unwritten pages are not links (D-056).
  - [x] Phone layout composed: header on one line, menu tested by keyboard (opens with focus inside, Escape closes and returns focus, closes on navigation), no horizontal overflow.
  - [x] Checks: `npm run check` (now also `content/destinations.ts` and `content/home.ts`; a wrong source id fails), `npm run build`, `npm run shots` 37 of 37, `npm run fallbacks` 14 of 14.
  - [x] Budgets (gzip): `/about` and `/archive` first load 138.4 KB (limit 140); `/` 145.4, `/explore` 145.8, `/subjects/black-holes` 142.4 (scene routes, D-047). No 3D code without WebGL on any of them.
  - [ ] Owner has read the new copy (destination lines, the journey preview, About).
- [x] O2 Galaxies (2026-11-17):
  - [x] `content/subjects/galaxies.mdx`: what a galaxy is, reading the picture, shapes (with the `galaxy-types` diagram), how they form and grow, scale and our place (Local Group, Laniakea), what telescopes show (linked, not embedded), what nobody knows yet. Seven sources fetched and checked 2026-11-17 (D-066); formation marked theoretical, the origin of shapes hypothetical.
  - [x] Opening scene: the atlas galaxy in `subject` mode (own camera key, no vessel), four callouts on real anchors (D-062, D-063). Posters `atlas-subject-wide/narrow` (D-064).
  - [x] The Galaxies and "Where you started" beacons, the Destinations window, the archive row and Black Holes' "Where to go next" link to `/subjects/galaxies` (checked in the built HTML).
  - [x] Checks: `npm run check` passes and exits 1 when `esa-andromeda-fate` is removed from the sources; `npm run build`; `npm run shots` 46 of 46 (new `galaxies`, `galaxies-still`, `galaxies-body`); `npm run fallbacks` 14 of 14. On `/subjects/galaxies` itself: no WebGL shows the poster, the full text and no 3D code; reduced motion draws one still frame and no loop.
  - [x] Callouts placed without overlap at 1440x900 and 390x844 (`galaxies-still-*`).
  - [x] Budgets (gzip): `/about` 138.5 KB (limit 140); `/subjects/galaxies` 142.6 (scene route, D-047); atlas chunk 13.5 KB (40); host + three + R3F 183 KB (220); 16 draw calls a frame on `low` (30).
  - [ ] Owner has read the Galaxies copy.
- [x] O3 Nebulae (2026-11-17):
  - [x] `content/subjects/nebulae.mdx`: what a nebula is, reading the picture, kinds (with the `nebula-kinds` diagram), where stars are born, where stars leave their mark (planetary nebulae, supernova remnants, recycling), distances, what nobody knows yet; real observations linked from the frontmatter, never embedded. Eleven sources fetched and checked 2026-11-17 (D-072).
  - [x] `nebula` scene: one shader, our own blister-shaped star-forming cloud with contour ink, ticked ring and vessel (D-067 to D-069). Four callouts on its own anchors (D-070). Posters `nebula-wide/narrow`; the homepage Nebulae window is now a crop of it (D-071).
  - [x] The Nebulae beacon, the Destinations window and the archive row link to `/subjects/nebulae` (built page list).
  - [x] Checks: `npm run check` passes and exits 1 when `nasa-hubble-m1` is removed from the sources; `npm run build`; `npm run shots` 55 of 55 (new `nebulae`, `nebulae-still`, `nebulae-body`); `npm run fallbacks` 14 of 14. On `/subjects/nebulae` itself: no WebGL shows the poster, the full text (4 callouts, 11 sources) and downloads no 3D code; reduced motion draws one frame and no loop; on `low` the loop runs at 1 draw call a frame.
  - [x] Callouts placed without overlap at 1440x900 and 390x844 (`nebulae-still-*`).
  - [x] Budgets (gzip): `/about` 138.6 KB (limit 140); `/subjects/nebulae` 142.7 (scene route, D-047); nebula chunk 4.5 KB (40); host + three + R3F 182.5 KB (220); 1 draw call a frame, no particles.
  - [ ] Owner has read the Nebulae copy.
  - [ ] Not yet measured on real hardware: the shader's frame rate on a mid-range phone (its cost is noise per pixel).
- [x] O4 Quasars (2026-11-20):
  - [x] `content/subjects/quasars.mdx`: a light brighter than a galaxy, reading the picture, how a quasar shines (with the `quasar-views` diagram; the donut model marked theoretical), black holes and galaxies (feeding, outflows, growing together; links to both pages), the first quasar (3C 273), how far and how many, what nobody knows yet. Twelve sources fetched and read 2026-11-20, every claim checked against the fetched text (D-076).
  - [x] `quasar` scene: the black-hole shader with `QUASAR` defined, seen from far off, with jets (the far one dimmer), the core's glare, a host galaxy, and a measured baseline along the jets (D-073, D-074). Four callouts on its own anchors. Posters `quasar-wide/narrow`. The Black Holes stills are byte-identical to before.
  - [x] The Quasars beacon, the Destinations window and the archive row link to `/subjects/quasars` (built page list).
  - [x] Checks: `npm run check` passes and exits 1 when `esawebb-qso1` is removed from the sources; `npm run build`; `npm run shots` 64 of 64 (new `quasars`, `quasars-still`, `quasars-body`); `npm run fallbacks` 26 of 26, now with test 7 for every subject page (loop on `low`, reduced motion, no WebGL; D-077). One earlier run timed out clicking Pause motion on the homepage under software WebGL; the re-run passed.
  - [x] Callouts placed without overlap at 1440x900 and 390x844 (`quasars-still-*`).
  - [x] Budgets (gzip): `/about` 138.5 KB (limit 140); `/subjects/quasars` 142.7 (scene route, D-047); quasar chunk 6.5 KB (40); host + three + R3F 183 KB (220); 1 draw call a frame, no particles.
  - [ ] Owner has read the Quasars copy.
  - [ ] Not yet measured on real hardware: the scene's frame rate on a mid-range phone.
- [x] O5 Journey: A star's life (2026-11-20):
  - [x] `content/journeys/a-stars-life.ts`: cloud, protostar, star, then the fork on mass (low-mass: giant, planetary nebula, white dwarf; high-mass: heavier fuels, supernova, then the fork on the core: neutron star or black hole). Every stop that leads on says why; the check enforces it (D-078). Six sources fetched and read 2026-11-20 (D-081).
  - [x] `/journeys/a-stars-life`: the trail as one branching hairline, no scene, plain server HTML (D-080). Stops link to Nebulae and Black Holes.
  - [x] The homepage preview is made from the journey and links to it; Journeys is in the nav; the archive lists the journey; Nebulae and Black Holes list it under "Where to go next".
  - [x] Checks: `npm run check` passes and exits 1 when a stop loses its `why` or names a source that is not listed; `npm run build`; `npm run shots` 67 of 67 (new `journey-full`; the phone menu shows Journeys). `/journeys/a-stars-life` first load 138.6 KB (limit 140), no scene. `npm run fallbacks` was run with O6.
  - [ ] Owner has read the journey copy.
- [x] O6 Explore polish (2026-11-20):
  - [x] Touch: sideways drag turns, two fingers pinch to zoom, a swipe up or down still scrolls the page (two-finger tilt dropped after review). Keys: + and − zoom, left and right turn, up and down tilt with focus in the atlas (D-082).
  - [x] Atlas to subject: a beacon eases the camera in and fades the words, then opens its page; reduced motion, paused motion and modified clicks just open it (D-083).
  - [x] List view marks the one destination without its own page (D-084).
  - [x] Checks: `npm run check`; `npm run build`; `npm run fallbacks` 31 of 31, twice in a row, with the new keyboard-only (Tab reaches the controls with a visible focus, Enter steps, + moves closer, Enter on a beacon opens Galaxies) and touch-only tests (a real two-finger pinch pulls back to the web, a tap on a beacon opens its page) (D-085, D-086).
  - [x] `npm run shots` 66 of 67: `chart-still-desktop-reduced` (homepage, untouched since O5) placed 2 labels where 3 were expected; re-run in O7. `/explore` first load 146.3 KB (scene route, D-047).
  - [ ] Not yet tried on a real phone: the pinch.
- [x] O7 Release prep (2026-11-20):
  - [x] Metadata on every route through `pageMetadata` (canonical, Open Graph, Twitter card); `metadataBase` from `NEXT_PUBLIC_SITE_URL` with a placeholder and a build warning when it is unset (D-087, D-091).
  - [x] Open Graph images: 1200x630 JPEG crops of our own stills in `public/og/` (D-088). Sitemap, robots.txt, JSON-LD `WebSite` and `Article` with sources as citations (D-090), checked in the built HTML.
  - [x] `npm run a11y` (axe-core, every route, wide and phone): 18 of 18 with no findings, 37 to 42 rules passing per page (D-089). Run before the review fixes.
  - [x] Budgets (gzip): no-scene routes `/about`, `/archive`, `/journeys/a-stars-life` 138.6 KB (limit 140); scene routes `/` 145.6, `/explore` 146.3, `/subjects/quasars` 142.7 (D-047); host + three + R3F 183.0 KB (220); scene chunks 4.5 to 13.5 KB (40); draw calls a frame on `low`: 1 (black hole, nebula, quasar), 16 (galaxies), 20 (atlas) (30).
  - [x] After the review fixes: `npm run check`, `npm run build`, `npm run shots` 67 of 67.
  - [x] Re-run `npm run fallbacks` and `npm run a11y`: done in S1 on the new screens (35 of 35; 10 of 10).
  - [ ] Not measured: frame rate on real hardware, LCP and CLS on a real 4G phone.
- [x] O8 Owner review: superseded. The owner's read-through turned the site into a spectacle (D-092); the copy items above marked "Owner has read" no longer apply, because that copy is removed.

## Spectacle sessions

- [x] S1 Strip to spectacle (2026-11-20):
  - [x] Content: `content/places.ts` (three stops, three places, eight sources, every line at most twelve words); the MDX pipeline, subject pages, journey, archive, home sections and footer removed, and seven packages with them (D-095).
  - [x] Ink and vessel removed from all four scenes; shader scenes centred and larger; posters and share images re-rendered (D-094).
  - [x] Screens: `/` (three stops, Closer and Further, hotspots on the canvas) and `/black-hole`, `/nebula`, `/quasar` (name, line, Further). Wheel, pinch, drag and keys as extras; nothing scrolls (D-097).
  - [x] The flow: dive, veil in the place's colour, loader after 400 ms, arrival; reversed going out; a 220 ms cross-fade with reduced motion; scene chunks fetched when idle (D-096). Filmed headlessly in and out of the black hole: no black frame, the loader shows while the scene compiles.
  - [x] Checks: `npm run check`; `npm run build`; `npm run shots` 36 of 36 (one earlier run timed out on the live black hole under software WebGL; the re-run passed); `npm run fallbacks` 35 of 35 (after the review fixes: the flow is busy from the first click, Back mid-dive calls it off, the opening is cleared when the veil lifts, the intro plays once a visit); `npm run a11y` 10 of 10.
  - [x] Budgets (gzip): `/about` 138.8 KB first load (limit 140; the 2.4 KB home-route chunk the header link prefetches is not counted); scene routes 143.8 to 145.0 KB (D-047); host + three + R3F 180.5 KB (220); scene chunks 3.8 to 7.0 KB (40); draw calls a frame on `low`: 15 (atlas), 1 (each place) (30).
  - [x] Owner clicked through: "Much better", with the notes that became S1b.
  - [ ] Not measured on real hardware: frame rate, the pinch, and how the flow feels at 60 fps.
- [x] S1b Fuller, with sound (2026-11-21), from the owner's notes on S1:
  - [x] About and Pause motion removed; motion follows the device (D-099).
  - [x] Sound: the owner's "Magical Space" (Ogg and AAC), Web Audio whooshes for flights, a Sound button, on after the first gesture (D-100).
  - [x] The deep sky behind every scene, clouds baked into a cube texture; the black hole at its galaxy's lensed heart; a wider, cooler and warmer nebula; no seam around the quasar (D-101).
  - [x] Closer and Further in places (into the quasar 14x); drag turns around the black hole and quasar, pans the nebula; grab cursor; a one-time drag hint (D-102).
  - [x] Checks: `npm run check`; `npm run build`; `npm run posters`; `npm run shots` 30 of 30; `npm run fallbacks` 38 of 38 (new: zoom into a place, the drag hint, Sound; the first runs failed on a test selector and on software-WebGL slowness before the sky was baked); `npm run a11y` 8 of 8.
  - [ ] Owner listens and looks on their laptop and phone.
  - [ ] Open: the nebula's dark dust bank fills the lower part of a phone screen (S4).
- [x] S1c Gentler, more beautiful, more powerful (2026-11-21): the flight sound a breath of air (D-103), quasar jets with a hot spine, bursts and a shared pulse (D-104), a new luminous nebula (D-105). Checks: fallbacks 38 of 38, shots 30 of 30.
- [x] S1d The start page (2026-11-21), from the owner's `Home.png` (D-107): planet, moons, asteroids and ship drawn in code before the galaxy; the image's words, glowing Begin, dock and header (Outfit); Begin starts the music and flies into the galaxy; Home flies back out; `/#atlas` skips it. Prompt files folded into this checklist (D-106).
  - [x] Checks: `npm run check`; `npm run build`; `npm run posters`; `npm run shots` 33 of 33; `npm run fallbacks` 41 of 41 (new: the start page and Begin, Home back out; the no-WebGL start page); `npm run a11y` 8 of 8 after naming the wordmark by its visible words.
  - [x] Owner looked: "It's a good start, definitely needs some polish." What to polish: ask next session (S1e).
- [ ] S2 Galaxy and cosmic web.
- [ ] S3 Black hole and quasar.
- [ ] S4 Nebula.
- [ ] S5 Owner review, then deploy.
