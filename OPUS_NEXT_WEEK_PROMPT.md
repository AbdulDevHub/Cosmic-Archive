# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-11, after session F0 (re-plan). Fable keeps this current after every commit. If you are reading this, Fable's access has ended or the owner chose to hand over; start from "Your session" below.

You are Claude Opus 5.5, continuing Cosmic Archive alone. You have no memory of earlier sessions. Everything you need is in this file and the docs it names.

## What this is

A living atlas of the universe: a Next.js site with real-time WebGL scenes behind server-rendered science pages. The identity is "cosmos plus ink": luminous stylised scenery with a map-maker's hairline linework over it. Fable (a stronger model) re-planned the project with the owner on 2026-11-11 and is building the hard core. You build on it without redesigning it.

## What exists

| Commit | Contents |
|---|---|
| `15e3478` | Snapshot of the original ChatGPT planning docs (history only; superseded) |
| *(F0, this commit)* | Re-plan: rewritten docs in `docs/`, `CLAUDE.md`, `README.md`, this file |

Not built yet: the look prototype, the app scaffold, the scene system, the atlas, any page.

## Read first, in this order

1. `CLAUDE.md`
2. `docs/PHASE_CHECKLIST.md`
3. `docs/DESIGN_SPEC.md`
4. `docs/ARCHITECTURE.md`
5. `docs/PROJECT_BLUEPRINT.md`
6. `docs/DECISIONS.md` (skim; read fully before changing anything that looks deliberate)

## Rules you must not change

1. **The visual language.** Cosmos plus ink, the tiny vessel and its trail, line style as evidence, Fraunces and Hanken Grotesk, one UI accent. The bans in `DESIGN_SPEC.md` section 2 are absolute. The approved look is `prototype/look.html`; match it.
2. **The architecture boundaries.** Only `src/scene/` imports three. Pages use `<SceneSlot>`. One persistent canvas. Content holds facts; components hold layout.
3. **The budgets** in `ARCHITECTURE.md` section 3: tiers, pixel budgets, particle counts, bundle sizes, the governor thresholds.
4. **The science process.** No fact from memory. Fetch the source, wrap the claim, record the checked date. Own illustrations only; link to real observations, never embed them.
5. **Scope.** The v1 table in the blueprint. One session from the roadmap, then stop and report.

If one of these seems wrong, do not work around it. Say so in your report and leave it for the owner.

## Your session

**As of this update there is no approved look and no code, so do not start building.** The look prototype (F1) needs the owner's approval of an art direction, which was Fable's job. If you are handed the project in this state, your session is:

**Scope:** build `prototype/look.html` exactly as `DESIGN_SPEC.md` sections 1 to 7 describe (single file, plain three from a CDN, hero view, chart view, zoomed-out view; `?stage=0|1|2` selects the view and `?t=` fixes the time), serve it locally, and screenshot each stage at 1440x900 and 390x844 into `prototype/shots/`.

**Acceptance:**
- The three stages render in headless Chromium with no console errors.
- Each screenshot passes the checklist in `DESIGN_SPEC.md` section 10.
- At most three rounds of changes.

**Verify:** look at every screenshot yourself. There is no build yet.

**Stop point:** show the owner the six screenshots and wait for approval of the look. Do not scaffold the app.

## Later sessions (one each; details in `docs/PHASED_ROADMAP.md`)

F2 scaffold. F3 scene system and atlas. F4 content model and Black Holes page. O1 homepage lower half, About, Archive. O2 Galaxies. O3 Nebulae. O4 Quasars. O5 Journey: A star's life. O6 Explore polish. O7 release prep. O8 owner review, then deploy.

## Self-review before you report

1. `DESIGN_SPEC.md` section 10, all nine questions, on every screenshot.
2. Did anything outside `src/scene/` import three?
3. Does the page work with WebGL off and with reduced motion on? Did you test it or assume it?
4. Is every fact on a content page tied to a source you fetched this session?
5. Did you stay inside one roadmap session? List anything you were tempted to add and did not.
6. Are `PHASE_CHECKLIST.md` and `DECISIONS.md` updated, and is the work committed (gitmoji style, no push)?

## Report format

What you built; files changed; checks run with their actual results; what the owner should look at; known problems; the next session. Ten lines or fewer.
