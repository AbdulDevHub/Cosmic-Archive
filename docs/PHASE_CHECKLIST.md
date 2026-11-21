# Cosmic Archive: Phase Checklist

Tick an item only when it is implemented and verified. Sessions are defined in `PHASED_ROADMAP.md`.

## F0 Re-plan

- [x] Docs read, blind spots listed, owner interviewed (5 questions).
- [x] Plan approved by the owner.
- [x] Git repository created; original docs snapshotted (`15e3478`).
- [x] Blueprint, technical direction, roadmap, design spec rewritten; architecture written.
- [x] Decisions D-011 to D-025 recorded.
- [x] `CLAUDE.md` rewritten; `README.md` added.
- [x] First draft of `OPUS_NEXT_WEEK_PROMPT.md`.

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
  - [ ] Re-run `npm run fallbacks` and `npm run a11y` on the build with the review fixes: the run was stopped by the system for low memory. Both passed on the build before the fixes (31 of 31; 18 of 18).
  - [ ] Not measured: frame rate on real hardware, LCP and CLS on a real 4G phone.
- [ ] O8 Owner review, then deploy.
