# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-14, after F2 (the scaffold). Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

You are Claude Opus 5.5, continuing Cosmic Archive alone. You have no memory of earlier sessions. Everything you need is in this file and the docs it names.

## What this is

A living atlas of the universe: a Next.js site with real-time WebGL scenes behind server-rendered science pages. The identity is "cosmos plus ink": luminous stylised scenery with a map-maker's hairline linework over it. Fable (a stronger model) re-planned the project with the owner, designed the look with them, and stopped there at the owner's request. You build the app. You do not redesign it.

## What exists

| Commit | Contents |
|---|---|
| `15e3478` | Snapshot of the original ChatGPT planning docs (history only; superseded) |
| `825ef56` | F0 re-plan: rewritten docs in `docs/`, `CLAUDE.md`, `README.md`, this file |
| `8dae442` | F1: first look prototype |
| `0c6ac42` | F1 second round from the owner's notes: sans headline, redrawn hero actions, bigger and fuller galaxy |
| `528af1b` | Owner approved the look and picked Syne; stills re-shot; docs and this file brought up to date |
| latest (`git log -1`) | F2 scaffold: Next 16 app, tokens, fonts, header with Pause motion, footer, hero copy and actions, `/about` stub, `check` / `shots` / `posters` scripts |

`prototype/look.html` is the approved look. It is one file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. It needs internet for three and the fonts. The six stills in `prototype/shots/` (`desktop-stage0..2.png`, `phone-stage0..2.png`) are the visual bar. `prototype/fonts.html` and `font-options.png` are a record of the font choice; ignore them.

Built (F2): the Next.js app in `src/` (routes `/` and `/about`), `src/styles/tokens.css`, the header and footer, `src/lib/motion.ts` (Pause motion), `scripts/shots.mjs`. Not built: the scene system, the atlas in the app, any content page. Nothing has been pushed or deployed.

## Read first, in this order

1. `CLAUDE.md`
2. `docs/PHASE_CHECKLIST.md`
3. `docs/DESIGN_SPEC.md` (section 2 bans, section 7 homepage, section 10 what the prototype settled and what production must replace, section 11 screenshot checklist)
4. `docs/ARCHITECTURE.md`
5. `docs/PROJECT_BLUEPRINT.md`
6. `docs/DECISIONS.md` (skim; read fully before changing anything that looks deliberate)
7. `prototype/look.html` and the six stills. Open the stills and look at them before writing any UI.

## Rules you must not change

1. **The visual language.** Cosmos plus ink, the tiny vessel and its trail, line style as evidence, Syne for display with Hanken Grotesk for text, no serif, one UI accent (`--beacon`). The bans in `DESIGN_SPEC.md` section 2 are absolute. Match the prototype's palette, type, line weights and compositions.
2. **The galaxy is big and full.** The owner asked for this directly. In the hero it overflows the frame. Do not pull the camera back, thin the layers or simplify the scene to save effort; port the prototype's generation code and camera keys as they are (`ARCHITECTURE.md` section 4).
3. **The architecture boundaries.** Only `src/scene/` imports three. Pages use `<SceneSlot>`. One persistent canvas. Content holds facts; components hold layout.
4. **The budgets** in `ARCHITECTURE.md` section 3: tiers, pixel budgets, particle counts, bundle sizes, the governor thresholds.
5. **The science process.** No fact from memory. Fetch the source, wrap the claim, record the checked date. Own illustrations only; link to real observations, never embed them.
6. **Scope.** The v1 table in the blueprint. One session from the roadmap, then stop and report.

If one of these seems wrong, do not work around it. Say so in your report and leave it for the owner.

## Your session: F3a, the scene system and the hero galaxy

The hardest session. Do only this.

**Before you write code**

- Open `prototype/shots/desktop-stage0.png` and `phone-stage0.png`, then run `prototype/look.html?stage=0&t=12` and read its script top to bottom. It is the reference implementation.
- Check the current three and React Three Fiber docs through context7 (canvas creation, `frameloop="demand"`, `invalidate`, `dpr`, disposal, context loss). Do not rely on remembered APIs.
- Install `three`, `@react-three/fiber` and `@types/three`, and add a `DECISIONS.md` row saying why. Anything else (drei, postprocessing) needs its own reason; the prototype needed neither.

**Scope**

- `src/scene/host/`: `SceneHost` (client, mounted from the root layout through `next/dynamic` with `ssr: false`, loaded only after a slot registers), `SceneSlot` (renders the poster `<img>` as server HTML, registers on mount, withdraws on unmount; imports no three), the registry (`id` to a dynamic import), and the store (`useSyncExternalStore`). The store reads Pause motion from `src/lib/motion.ts` (`getMotion`, `subscribeMotion`); do not keep a second copy (D-032).
- `src/scene/quality/`: tier detection and the frame-time governor exactly as `ARCHITECTURE.md` 3.4 and 3.5, with `dpr = sqrt(budget / cssPixels)` capped at the device ratio.
- Time is passed in (3.3). `?shot=1&t=12` renders one deterministic frame. Reduced motion and Pause hold time and render on demand.
- `src/scene/scenes/atlas/`: port Level 1 at the hero view (`zoom = 0`) from the prototype as it is: seeded random, palette, `discColor`, `taper`, every `build*` function, the constants, the base strengths in `A`, `KEYS_DESK` and `KEYS_PHONE` with their log-distance interpolation and lens shift, the trail spiral in `layoutVessel`. Counts scale to the tier. Replace only the hero-related shortcuts in `DESIGN_SPEC.md` section 10: constant-width screen-space lines for the ink; instanced quads for the large glow sprites; a small bright bulge layer for phones.
- `/`: add `<SceneSlot id="atlas" mode="hero" poster="/posters/atlas-hero.avif" />` behind the existing hero copy, plus the caption "Illustration, not to scale". `npm run posters` becomes real and renders the poster through `?shot=1`. Leave the scroll hint and the zoom for F3b.

**Already in place (F2)**

- The hero is `src/app/page.tsx`: a `min-height: 100svh` section with the copy at the bottom left and the scrim (`.copy::before`) already behind it. F3b turns it into the sticky stage inside a tall scroll track; F3a does not need to.
- The header is fixed and transparent until scroll. `<html data-motion>` is set before paint; the hero dot already obeys it.
- `npm run shots` captures `/` at three views and fails on console errors, failed requests or horizontal overflow. Add `?shot=1&t=12` routes to its list for deterministic scene stills.
- First-load JS is measured by gzipping every module script the built HTML in `.next/server/app/*.html` loads (skip the `noModule` polyfill). F2 measured 135 KB for `/`; the budget is now 140 KB (D-033). Report the same number for `/` and for a no-scene route after your work, plus the host+three+R3F chunk (220 KB budget) and the atlas chunk (40 KB).

**Acceptance**

- The fallback tests in `ARCHITECTURE.md` section 8 pass and you ran each one: reduced motion (no loop), WebGL disabled (poster, page complete), CPU throttling (the governor steps down), cold load of `/about` (no three request).
- Hero screenshots at 1440x900 and 390x844 match `prototype/shots/desktop-stage0.png` and `phone-stage0.png`: as large, as full, as colourful, the ink as visible, the galaxy overflowing the top and right.
- Nothing outside `src/scene/` imports three (grep it). `npm run check` and `npm run build` pass.

**Stop point:** commit (gitmoji style, no push), tick F3a in the checklist, rewrite this section for F3b, report.

## Later sessions (one each; acceptance in `docs/PHASED_ROADMAP.md`)

- **F3b Atlas chart, zoom out, Explore.** The cosmic web, the scroll-driven zoom through all three stages, beacons as real links with collision-safe labels, the map margin with the evidence legend, the list view, `/explore`.
- **F4 Content model and Black Holes page.** MDX pipeline, content check, the page framework, the black-hole scene, sourced copy.
- **O1** homepage lower half, About, Archive. **O2** Galaxies. **O3** Nebulae. **O4** Quasars. **O5** Journey: A star's life. **O6** Explore polish. **O7** release prep. **O8** owner review, then deploy only when the owner says so.

## Self-review before you report

1. `DESIGN_SPEC.md` section 11, all nine questions, on every screenshot. Put each screenshot beside its prototype still: is the galaxy as large, as full and as colourful? Is the ink as visible?
2. Did anything outside `src/scene/` import three?
3. Does the page work with WebGL off and with reduced motion on? Did you test it or assume it?
4. Is every fact on a content page tied to a source you fetched this session?
5. Did you stay inside one roadmap session? List anything you were tempted to add and did not.
6. Are `PHASE_CHECKLIST.md`, `DECISIONS.md` and this file updated, and is the work committed (gitmoji style, no push)?

## Report format

What you built; files changed; checks run with their actual results; what the owner should look at; known problems; the next session. Ten lines or fewer.
