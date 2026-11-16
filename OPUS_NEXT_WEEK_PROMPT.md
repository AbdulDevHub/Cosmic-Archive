# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-16, after F3a (the scene system and the hero galaxy). Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

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
| `41dc000` | F2 scaffold: Next 16 app, tokens, fonts, header with Pause motion, footer, hero copy and actions, `/about` stub, `check` / `shots` / `posters` scripts |
| latest (`git log -1`) | F3a: the scene system (`src/scene/host`, `src/scene/quality`), the atlas galaxy at the hero view (`src/scene/scenes/atlas`), posters, `npm run fallbacks` |

`prototype/look.html` is the approved look. It is one file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. It needs internet for three and the fonts. The six stills in `prototype/shots/` (`desktop-stage0..2.png`, `phone-stage0..2.png`) are the visual bar. `prototype/fonts.html` and `font-options.png` are a record of the font choice; ignore them.

Built (F2, F3a): the Next.js app in `src/` (routes `/` and `/about`), `src/styles/tokens.css`, the header and footer, `src/lib/motion.ts` (Pause motion), and the scene system with the live hero galaxy on `/`. Read `src/scene/README.md` first: it says how a page gets a scene, how to add one, the URL switches and the scripts. Not built: the chart, the cosmic web, the zoom, beacons, `/explore`, any content page. Nothing has been pushed or deployed.

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

## Your session: F3b, the atlas chart, the zoom out and Explore

Do only this.

**Before you write code**

- Open all six stills in `prototype/shots/`, then run `prototype/look.html` and scroll it. Read the parts of its script F3a did not port: `buildWeb`, `buildWebGlow`, the web threads between near-neighbour nodes, `homeDot` and `quasarDot`, the beacons and labels (`setOffset`, the flip near the right edge), the margin, and the scroll handler that turns scroll position into `zoom`.
- Read `src/scene/README.md`, then `src/scene/scenes/atlas/` (`model.ts`, `world.ts`, `camera.ts`) and `src/scene/host/`.
- Check the current Next.js and React Three Fiber docs through context7 before relying on an API.

**What F3a left ready for you**

- The camera rig already interpolates all three keys (`placeCamera` in `camera.ts`), and `world.frame()` already applies the prototype's fade ranges to Level 1. `zoom` reaches the scene as a box that the host never changes yet (`zoomRef` in `SceneHost.tsx`): give it a source.
- `buildAtlas` already draws the web's nodes from the seeded generator first (`webNodes`), so adding the web must not change the approved galaxy. Keep the build order.
- `SceneMode` is only `"hero"`. Add the modes you need (scroll-driven on `/`, free control on `/explore`).
- The store holds slot, quality, ready and lost state. Add the scene inputs (zoom, pointer) and the outputs the DOM needs (projected beacon positions), as `ARCHITECTURE.md` 3.1 and 4 describe.

**Scope**

- Level 2, the cosmic web: points and glow sprites along threads between near-neighbour nodes, with the home galaxy on a thread (not in a void), and a denser, smaller web volume on narrow screens. Counts per tier from `ARCHITECTURE.md` 3.4 (15k / 35k / 60k).
- The cross-fade between levels from the one zoom scalar.
- `/` becomes a sticky stage inside a tall scroll track with all three stages and their copy (`DESIGN_SPEC.md` 7.2 to 7.4), a "Skip to destinations" link, and the scroll hint. The page never takes control of scrolling.
- `content/destinations.ts` and the beacons as real `<a>` elements positioned from projected coordinates, with their evidence line style, labels on leader lines derived from the projected disc radius, clamped to the viewport, with collision avoidance as the disc turns. Off-level beacons are hidden and out of the tab order. Until the subject pages exist, beacons point at `/about`, like the hero actions do.
- The map margin at the zoomed-out view: dashed rule, the Uncharted entry, the evidence legend as line samples.
- The list view of the same destinations as plain links.
- `/explore`: the atlas with free control (wheel, drag, keys; touch polish is O6). Point "Begin exploring" at it.
- Posters for the new views if a route opens on them; add them to `scripts/posters.mjs`.

**Acceptance**

- Chart and zoom-out screenshots at 1440x900 and 390x844 match `prototype/shots/*-stage1.png` and `*-stage2.png`; the hero still matches `*-stage0.png` as it does now. Add the stages to `scripts/shots.mjs`.
- Every beacon is a working link, reachable by keyboard, and present in the HTML without the scene.
- `npm run check`, `npm run build` and `npm run fallbacks` pass. Extend `fallbacks` if you add a fallback path.
- Budgets hold: first load under 140 KB gzip on `/about`, host + three + R3F under 220 KB, the atlas chunk under 40 KB, fewer than 30 draw calls a frame (F3a: 138 KB, 185 KB, 11 KB, 19). The checklist records how they were measured.

**Known, left open by F3a**

- Frame rate has only been seen under software WebGL. If you can, look at the live hero on a real GPU and note what the governor settles on.
- The wide poster is 234 KB. If LCP on 4G is over budget in O7, lower its quality or size in `scripts/posters.mjs`.
- On `medium` the arms are a little less bright than on `high` (`discAlpha` in `model.ts` is the dial).

**Stop point:** commit (gitmoji style, no push), tick F3b in the checklist, rewrite this section for F4, report.

## Later sessions (one each; acceptance in `docs/PHASED_ROADMAP.md`)

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
