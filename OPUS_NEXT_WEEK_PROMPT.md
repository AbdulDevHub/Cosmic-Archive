# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-11, at the end of Fable's work. The plan and the look are finished and approved by the owner. No app code exists yet. Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

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
| latest (`git log -1`) | Owner approved the look and picked Syne; stills re-shot; docs and this file brought up to date |

`prototype/look.html` is the approved look. It is one file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. It needs internet for three and the fonts. The six stills in `prototype/shots/` (`desktop-stage0..2.png`, `phone-stage0..2.png`) are the visual bar. `prototype/fonts.html` and `font-options.png` are a record of the font choice; ignore them.

Not built: the app scaffold, the scene system, the atlas in the app, any page. Nothing has been pushed or deployed.

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

## Your session: F2, the scaffold

**Scope**

- Create the Next.js 16 app in this folder (App Router, TypeScript strict, `src/` directory, `@/*` alias, npm, ESLint flat config, no Tailwind). Check the current Next.js docs through context7 first; do not rely on remembered flags. Keep the existing files (`docs/`, `prototype/`, `CLAUDE.md`, `README.md`, this file). If the generator refuses a non-empty folder, generate into a temporary folder and move the files in.
- Folder layout exactly as `ARCHITECTURE.md` section 1. Create `src/scene/` with only a README stub saying what goes there; do not install three yet.
- `src/styles/tokens.css`: colour tokens copied from the `@supports` block of `prototype/look.html` (OKLCH), plus the type scale, spacing and motion durations from `DESIGN_SPEC.md` sections 3, 4 and 6.
- Fonts through `next/font/google`: Syne (weight 600) and Hanken Grotesk (400, 500, 600, and 400 italic).
- Root layout with the header (wordmark, nav showing only routes that exist, a Pause motion button that sets `data-motion="paused"` or `"on"` on `<html>` and persists it in `localStorage`; reduced motion defaults it to paused) and a minimal footer. Copy the header's look from the prototype.
- `/` renders the hero copy over a plain `--space` background: headline, supporting line, and the two actions built exactly as `.go` and `.index` in the prototype (the ticked-ring button with its circling dot, and the index link; `DESIGN_SPEC.md` section 7.2). No scene yet. The actions must not be dead links: point both at an `/about` stub (one paragraph saying the atlas is being built) until their routes exist.
- Scripts: `check` (`tsc --noEmit && eslint .`), `shots` (a Playwright script that starts the built app and captures `/` at 1440x900, 390x844, and 1440x900 with reduced motion, into `screenshots/`), `posters` (a stub that prints a message and exits 0).
- Update `CLAUDE.md`: replace `Verify: none` with `Verify: npm run check`, add `Verify-full: npm run build && npm run shots`, and delete the sentence about there being no scaffold. Update the README's "Running it" section.

**Acceptance**

- `npm run check` passes. `npm run build` passes. `npm run shots` writes three screenshots.
- First-load JS for `/` is under 130 KB gzip (read it from the build output and report the number).
- The header, hero copy and both actions match `prototype/shots/desktop-stage0.png` and `phone-stage0.png` in type, colour, size and position. The headline does not overflow at 390 px.
- With reduced motion, the dot on the ring button does not move. Hovering the ring button fills the ring gold; both actions show a visible focus ring from the keyboard.
- No dependency beyond next, react, react-dom, typescript, eslint and its Next config, the type packages, and playwright as a dev dependency.

**Verify:** run the three commands; open the three screenshots beside the two prototype stills and compare; run the self-review below.

**Stop point:** commit (gitmoji style, no push), tick F2 in the checklist, rewrite "Your session" in this file for F3a, report. Do not start the scene system.

## Later sessions (one each; acceptance in `docs/PHASED_ROADMAP.md`)

- **F3a Scene system and the hero galaxy.** The hardest session; give it a whole one. Build `SceneHost`, `SceneSlot`, registry, store, tiers, governor, poster and still fallbacks, then port the prototype's galaxy, ink, vessel and trail at the hero view. Install three and React Three Fiber here, checking their current docs first. Replace the prototype shortcuts listed in `DESIGN_SPEC.md` section 10 that touch the hero (constant-width lines, instanced quads for large sprites).
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
