# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-11, after session F1 (look prototype built; waiting for the owner to approve the look). Fable keeps this current after every commit. If you are reading this, Fable's access has ended or the owner chose to hand over; start from "Your session" below.

You are Claude Opus 5.5, continuing Cosmic Archive alone. You have no memory of earlier sessions. Everything you need is in this file and the docs it names.

## What this is

A living atlas of the universe: a Next.js site with real-time WebGL scenes behind server-rendered science pages. The identity is "cosmos plus ink": luminous stylised scenery with a map-maker's hairline linework over it. Fable (a stronger model) re-planned the project with the owner on 2026-11-11 and is building the hard core. You build on it without redesigning it.

## What exists

| Commit | Contents |
|---|---|
| `15e3478` | Snapshot of the original ChatGPT planning docs (history only; superseded) |
| `825ef56` | F0 re-plan: rewritten docs in `docs/`, `CLAUDE.md`, `README.md`, this file |
| latest (`git log -1`) | F1: `prototype/look.html` and six stills in `prototype/shots/` |

`prototype/look.html` is a single file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. Open it by double-clicking; it needs internet for three and the fonts.

Not built yet: the app scaffold, the scene system, the atlas in the app, any page.

**Check `docs/PHASE_CHECKLIST.md` for "Owner approved the look".** If it is not ticked, ask the owner before building anything; the look is theirs to approve.

## Read first, in this order

1. `CLAUDE.md`
2. `docs/PHASE_CHECKLIST.md`
3. `docs/DESIGN_SPEC.md` (section 10 lists what the prototype settled and the shortcuts production must replace)
4. `docs/ARCHITECTURE.md`
5. `docs/PROJECT_BLUEPRINT.md`
6. `docs/DECISIONS.md` (skim; read fully before changing anything that looks deliberate)
7. `prototype/look.html` and the stills in `prototype/shots/`. Look at the stills; they are the visual bar.

## Rules you must not change

1. **The visual language.** Cosmos plus ink, the tiny vessel and its trail, line style as evidence, Fraunces and Hanken Grotesk, one UI accent. The bans in `DESIGN_SPEC.md` section 2 are absolute. Match the prototype's palette, type and line weights.
2. **The architecture boundaries.** Only `src/scene/` imports three. Pages use `<SceneSlot>`. One persistent canvas. Content holds facts; components hold layout.
3. **The budgets** in `ARCHITECTURE.md` section 3: tiers, pixel budgets, particle counts, bundle sizes, the governor thresholds.
4. **The science process.** No fact from memory. Fetch the source, wrap the claim, record the checked date. Own illustrations only; link to real observations, never embed them.
5. **Scope.** The v1 table in the blueprint. One session from the roadmap, then stop and report.

If one of these seems wrong, do not work around it. Say so in your report and leave it for the owner.

## Your session: F2, the scaffold (only after the look is approved)

**Scope**

- Create the Next.js 16 app in this folder (App Router, TypeScript strict, `src/` directory, `@/*` alias, npm, ESLint flat config, no Tailwind). Check the current Next.js docs through context7 first; do not rely on remembered flags. Keep the existing files (`docs/`, `prototype/`, `CLAUDE.md`, `README.md`, this file).
- Folder layout exactly as `ARCHITECTURE.md` section 1. Create `src/scene/` with only a README stub saying what goes there; do not install three yet.
- `src/styles/tokens.css` with the tokens from `DESIGN_SPEC.md` sections 3 and 4, values copied from the `:root` block of `prototype/look.html`.
- Fonts through `next/font/google`: Fraunces (variable, with the `opsz` axis, normal and italic) and Hanken Grotesk.
- Root layout with the header (wordmark, nav showing only routes that exist, a Pause motion button that toggles a `data-motion` attribute on `<html>` and persists it) and a minimal footer. Copy the header's look from the prototype.
- `/` renders the hero copy over a plain `--space` background (headline, supporting line, the two actions). No scene yet. "Begin exploring" and "Browse the archive" must not be dead links: render them only when their routes exist, or point both at an `/about` stub that says the atlas is being built.
- Scripts: `check` (`tsc --noEmit && eslint .`), `shots` (a Playwright script that starts the built app, captures `/` at 1440x900, 390x844 and 1440x900 with reduced motion into `screenshots/`), `posters` (stub that exits 0 with a message for now).
- Update `CLAUDE.md`: replace `Verify: none` with `Verify: npm run check` and add `Verify-full: npm run build && npm run shots`. Update the README's "Running it" section.

**Acceptance**

- `npm run check` passes. `npm run build` passes. `npm run shots` writes three screenshots.
- First-load JS for `/` is under 130 KB gzip (read it from the build output and report the number).
- The header and hero copy match the prototype's type, colour and spacing at both widths.
- No dependency beyond next, react, react-dom, typescript, eslint and its Next config, the type packages, and playwright as a dev dependency.

**Verify:** run the three commands; look at the three screenshots beside `prototype/shots/desktop-stage0.png` and `phone-stage0.png`; run the self-review below.

**Stop point:** commit (gitmoji style, no push), tick F2 in the checklist, report. Do not start the scene system.

## Later sessions (one each; details in `docs/PHASED_ROADMAP.md`)

F3 scene system and atlas (port the prototype's shaders into `src/scene/`, replacing the shortcuts listed in `DESIGN_SPEC.md` section 10). F4 content model and Black Holes page. O1 homepage lower half, About, Archive. O2 Galaxies. O3 Nebulae. O4 Quasars. O5 Journey: A star's life. O6 Explore polish. O7 release prep. O8 owner review, then deploy.

## Self-review before you report

1. `DESIGN_SPEC.md` section 11, all nine questions, on every screenshot.
2. Did anything outside `src/scene/` import three?
3. Does the page work with WebGL off and with reduced motion on? Did you test it or assume it?
4. Is every fact on a content page tied to a source you fetched this session?
5. Did you stay inside one roadmap session? List anything you were tempted to add and did not.
6. Are `PHASE_CHECKLIST.md` and `DECISIONS.md` updated, and is the work committed (gitmoji style, no push)?

## Report format

What you built; files changed; checks run with their actual results; what the owner should look at; known problems; the next session. Ten lines or fewer.
