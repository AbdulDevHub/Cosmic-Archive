# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-17, after O3 (Nebulae). Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

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
| latest (`git log -1`) | O3: the Nebulae page, the `nebula` scene (one shader, contour ink), the `nebula-kinds` diagram, the new Nebulae window |

`prototype/look.html` is the approved look. It is one file (plain three from a CDN) showing the three stages of the homepage scene: hero (`?stage=0`), chart (`?stage=1`), zoomed-out cosmic web (`?stage=2`). `?t=12` fixes the time. Without switches, scrolling drives the zoom. It needs internet for three and the fonts. The six stills in `prototype/shots/` (`desktop-stage0..2.png`, `phone-stage0..2.png`) are the visual bar. `prototype/fonts.html` and `font-options.png` are a record of the font choice; ignore them.

Built: routes `/`, `/explore`, `/about`, `/archive`, `/subjects/black-holes`, `/subjects/galaxies`, `/subjects/nebulae`; the scene system with three scenes (`atlas`, also in a `subject` framing for Galaxies; `black-hole`; `nebula`); the content model (`content/subjects/*.mdx` checked by `src/lib/content/subject-check.ts`; data in `content/destinations.ts` and `content/home.ts` checked by `src/lib/content/cited.ts`); three diagrams; scripts `check`, `shots` (55 shots), `posters` (with crops), `fallbacks`. Read `src/scene/README.md` before touching a scene. Nothing has been pushed or deployed.

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

## Your session: O4, Quasars

Do only this.

**Before you write code**

- Read `content/subjects/black-holes.mdx`, `galaxies.mdx` and `nebulae.mdx`, `src/app/subjects/[slug]/page.tsx`, `src/components/subject/` and `src/lib/content/subject-check.ts`: a new subject is one MDX file plus, if it needs one, a diagram and a scene.
- Read `src/scene/README.md`, then `src/scene/scenes/black-hole/` closely: the roadmap asks for **the black-hole scene with jets and a distant framing**, so O4 extends that scene (a mode or a uniform) rather than writing a new one. `src/scene/scenes/nebula/` is the most recent one-shader scene and shows the anchor and composition pattern.
- Check current Next.js and React Three Fiber docs through context7 before relying on an API.

**Scope**

- Research first: fetch the sources (NASA and ESA pages on quasars and active galaxies, Hubble and Webb quasar results, the existing `nasa-hubble-quasars` source in `content/destinations.ts`) and keep the exact supporting sentences. No fact, number or name from memory. A research subagent's quotes come through a summariser: re-fetch every page you cite and confirm each sentence yourself (in O3 one quoted size turned out to describe a different structure).
- `content/subjects/quasars.mdx` following the subject framework (`PROJECT_BLUEPRINT.md` 7). Acceptance: **it explains the link to Black Holes and Galaxies.**
- The scene: the black hole with jets, seen from far off; palette azure, white, ember (`DESIGN_SPEC.md` 3). Its own anchors for callouts; posters named as the page asks for them (`<scene>-wide/narrow`, or a rule like the atlas's in `page.tsx` if it is a mode of `black-hole`). It must meet the budgets on `low`.
- Point the Quasars beacon (`href` in `content/destinations.ts`) at `/subjects/quasars`; consider replacing `window-quasars` with a crop of the new scene.

**Acceptance**

- Roadmap: explains the link to Black Holes and Galaxies; the scene meets the budgets on `low` (chunk under 40 KB gzip, under 30 draw calls a frame); `/about` first load under 140 KB.
- `npm run check` passes and fails when a cited source is removed; `npm run build`, `npm run shots` (add the page, its still and its body), `npm run fallbacks` pass. Test the new page with WebGL off and with reduced motion (`npm run fallbacks` only covers the homepage; O3 used a small script modelled on it).
- Screenshots at 1440x900 and 390x844 pass `DESIGN_SPEC.md` 11; callouts do not overlap. Label offsets in `SubjectHero` `PREFER` are fractions of `frame.radius`. The placer lays callouts out in frontmatter order, so list first the one whose spot is hardest to get, on a phone too.
- If you change the black-hole scene, the Black Holes page must look as before (`black-holes-still-*`).

**Open items the owner may raise**

- The owner has not read the Black Holes, O1, Galaxies or Nebulae copy yet (checklist F4, O1, O2, O3).
- Real-hardware frame rate is unmeasured for every scene; the one-shader scenes cost per pixel.
- Scene routes load about 142 to 146 KB of JS up front; the 140 KB limit is for routes with no scene (D-047).
- First-load sizes are measured by gzipping the scripts each built page lists, leaving out the `noModule` polyfill.
- `npm run posters` re-renders every poster, and software WebGL can change unrelated ones slightly: keep only the ones you meant to change.

**Stop point:** commit (gitmoji style, no push), tick O4 in the checklist, rewrite this section for O5, report.

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
