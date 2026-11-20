# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-20, after O4 (Quasars). Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

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
| `3a25322` | F3a: the scene system (`src/scene/host`, `src/scene/quality`), the atlas galaxy at the hero view, posters, `npm run fallbacks` |
| `8ffd3e0` | F3b: the atlas chart, the zoom out to the cosmic web, beacons and labels, `/explore` |
| `bd7e6de` | F4: MDX content model and content check, the Black Holes page and its ray-marched scene |
| `e40f1f6` | O1: homepage Destinations, journey preview, Uncharted, footer; `/about`; `/archive`; phone menu |
| `8196726` | O2: the Galaxies page, the atlas galaxy in a subject framing, the `galaxy-types` diagram |
| `3c66385` | O3: the Nebulae page, the `nebula` scene (one shader, contour ink), the `nebula-kinds` diagram, the new Nebulae window |
| latest (`git log -1`) | O4: the Quasars page, the `quasar` scene (the black-hole shader with `QUASAR` defined: jets, glare, host galaxy), the `quasar-views` diagram, fallback test 7 for every subject page |

`prototype/look.html` is the approved look. It is one file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. It needs internet for three and the fonts. The six stills in `prototype/shots/` (`desktop-stage0..2.png`, `phone-stage0..2.png`) are the visual bar. `prototype/fonts.html` and `font-options.png` are a record of the font choice; ignore them.

Built: routes `/`, `/explore`, `/about`, `/archive`, `/subjects/black-holes`, `/subjects/galaxies`, `/subjects/nebulae`, `/subjects/quasars`; the scene system with four scenes (`atlas`, also in a `subject` framing for Galaxies; `black-hole`; `nebula`; `quasar`, the black-hole shader seen from far off); the content model (`content/subjects/*.mdx` checked by `src/lib/content/subject-check.ts`; data in `content/destinations.ts` and `content/home.ts` checked by `src/lib/content/cited.ts`); four diagrams; scripts `check`, `shots` (64 shots), `posters` (with crops), `fallbacks` (26 tests, every subject page included). Read `src/scene/README.md` before touching a scene. Nothing has been pushed or deployed.

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

## Your session: O5, Journey: A star's life

Do only this.

**Before you write code**

- Read `docs/PROJECT_BLUEPRINT.md` 7 (Journeys), `DESIGN_SPEC.md` 1 (the trail) and 7.5 (the journey preview), and `ARCHITECTURE.md` 6 (`content/journeys/*.ts`: ordered stops with the reason each leads to the next).
- Read `content/home.ts` (`STARS_LIFE`, the homepage preview) and `src/components/home/` (how the preview draws one branching line), `src/lib/content/cited.ts` (the rule for facts kept as data) and `src/lib/content/subject-context.ts` (it already reads `content/journeys/*.ts` names for a subject's `journeys` list).
- Check current Next.js docs through context7 before relying on an API.

**Scope**

- Research first: fetch the sources for each stop (NASA Stars is already used; the subject pages already cite molecular clouds, planetary nebulae, supernovae and stellar-mass black holes). No fact, number or name from memory.
- `content/journeys/a-stars-life.ts`: the stops (cloud, star forming, main-sequence star, then the fork to white dwarf, neutron star or black hole), each with **why it leads to the next**, its evidence status and its sources. Move the homepage preview to read from it so the two never disagree.
- `/journeys/[slug]`: no scene in v1 (`ARCHITECTURE.md` 2). The page is the trail itself: one branching hairline down the page, a stop on it per section, the fork with its reason in a few words. Stops link to subject pages that exist (Nebulae, Black Holes). Add Journeys to the nav (`src/lib/nav.ts`) now that a page exists, and the journey to the archive and to the subjects' `journeys` lists.

**Acceptance**

- Roadmap: **each step says why it leads to the next**.
- `npm run check` passes and fails when a journey cites a source that is not listed; `npm run build`; `npm run shots` (add the journey page, desktop and phone, and the phone menu with the new item); `npm run fallbacks`.
- Screenshots pass `DESIGN_SPEC.md` 11; no dead links; the page works with no JavaScript.
- `/journeys/a-stars-life` first load under 140 KB (no scene route).

**Open items the owner may raise**

- The owner has not read the Black Holes, O1, Galaxies, Nebulae or Quasars copy yet.
- Real-hardware frame rate is unmeasured for every scene; the one-shader scenes cost per pixel.
- Scene routes load about 142 to 146 KB of JS up front; the 140 KB limit is for routes with no scene (D-047).
- First-load sizes are measured by gzipping the scripts each built page lists, leaving out the `noModule` polyfill.
- `npm run posters` re-renders every poster unless given a word (`npm run posters -- quasar-`); software WebGL can change unrelated ones slightly.
- `npm run fallbacks` once timed out clicking Pause motion on the homepage under software WebGL; a re-run passed.

**Stop point:** commit (gitmoji style, no push), tick O5 in the checklist, rewrite this section for O6, report.

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
