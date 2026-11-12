# Cosmic Archive: Decisions Log

Append rows; never rewrite history. A newer row overrides an older one and says which. The owner's newest instruction overrides everything here.

## Original brief (ChatGPT planning, 2026-11-09)

| ID | Decision | Status |
|---|---|---|
| D-001 | Working name: Cosmic Archive. | Stands |
| D-002 | Universe-first art direction; a tiny explorer vessel as a scale cue. | Stands |
| D-003 | Original colourful science storytelling with cinematic depth; no copying of third-party art. | Stands, made concrete by D-011 |
| D-004 | Hybrid artistic / semi-scientific atlas that puts beauty before density. | Stands, made concrete by D-013 |
| D-005 | Minimal initial content, progressive depth, natural journeys. | Stands |
| D-006 | Flagship topics: black holes, galaxies, nebulae, quasars. | Stands |
| D-007 | Sound optional, user-initiated, off by default. | Stands; not in v1 (D-019) |
| D-008 | Blender optional for later authoring, never a runtime requirement. | Stands; not used so far |
| D-009 | Claude Code with Opus is the implementation environment. | Amended by D-021 |
| D-010 | Preferred stack: Next.js App Router, React, TypeScript, npm, CSS Modules. | Confirmed by D-014 |

## Re-plan (Fable with the owner, 2026-11-11)

| ID | Decision | Reason | Alternatives rejected |
|---|---|---|---|
| D-011 | **Identity is the "Living Atlas":** stylised luminous real-time cosmos with a map-maker's hairline ink layer over it; the vessel's trail is the ink line. Owner picked from three pitches. | Gives the site a look of its own and a visual language for teaching. | "Deep Field" (pure cinematic, no linework): most awe, no identity. "Paper Cosmos" (flat layered diorama): light and friendly, not immense. |
| D-012 | **Evidence status is drawn:** solid ink observed/established, long dash theoretical, short dash hypothetical, dotted speculative, always with the word. | Makes honesty part of the art instead of a badge. Works without colour. | Colour-coded badges only: relies on colour, easy to ignore. |
| D-013 | **The atlas is a scale ladder and is the same scene as the homepage hero.** Level 1 a galaxy, Level 2 the cosmic web; theories at the margin as "Uncharted". Two levels in v1. Owner picked. | One scene instead of two; the zoom-out is the site's central moment; nothing is pinned where it does not exist. | One galaxy with beacons for everything: half the work, false precision. Four or five levels now: too much for the week. Separate hero and atlas scenes (the original spec): double work, weaker idea. |
| D-014 | **3D is built first, not in "Phase 6".** three + React Three Fiber, WebGL2, GLSL, all procedural. Overrides the dependency bans in the original `CLAUDE.md` and D-010's deferrals. | The scenes are the identity and the hardest part; a static page cannot reach the look. | Static homepage first (original roadmap). WebGPU/TSL: narrower device support, weaker tooling. Plain three without R3F: more lifecycle code to write by hand. Painted image plates: heavy downloads, licence questions, not scalable by device. |
| D-015 | **One persistent canvas** in the root layout; routes request scenes through `SceneSlot`; routes without one never load three. | One WebGL context, clean transitions, no 3D cost on text pages. | A canvas per page: context churn and repeated start-up cost. |
| D-016 | **Phones get a lighter live scene;** a still rendered from our own scene shows first on every device and is the fallback. Owner picked. Overrides the original spec's "no 3D on mobile". | Half the visitors are on phones and the zoom is the point. | Still image on all phones: no atlas on mobile. Tap-to-load: most visitors never see it. |
| D-017 | **Performance budgets are numbers** (tiers, pixel budgets, particle counts, bundle sizes, frame-time governor) in `ARCHITECTURE.md`. | "Degrade gracefully" was never quantified. | Leaving it to judgement per scene. |
| D-018 | **Own art only.** No telescope photographs or third-party images are embedded or hosted; real observations are linked. Owner picked. | Consistent look, no licence or credit handling. | Embedding credited NASA/ESA/EHT images in an "actually seen" section. |
| D-019 | **Science copy is checked as written:** sources fetched and read at authoring time, claims tied to source ids, a build check enforces it, the owner reads before launch. | AI-recalled citations are the largest accuracy risk. | Draft now, fact-check later: unverified pages stay unverified. |
| D-020 | **v1 boundary:** Home, Explore (two levels), four flagship pages, one journey, Archive index, About. Frontiers pages, more levels, search, sound and the fiction collection are after v1. | The topic list has 150+ entries and no stopping point. | Open-ended phases. |
| D-021 | **Fable builds the core this week** (look, scene system, atlas, black-hole scene, content model, Black Holes page); Opus 5.5 continues from `OPUS_NEXT_WEEK_PROMPT.md`. Order: atlas, then Black Holes, then the rest of the homepage. Owner picked the order. | Put the strongest model on the parts with the most judgement; leave Opus a finished example of each hard thing. | Finish the whole homepage first; atlas only. |
| D-022 | **Docs consolidated in `docs/`** (lowercase). Removed: `OPUS_HANDOFF_PROMPT.md`, `README_START_HERE.md`, `PACKAGE_MANIFEST.md`, `CLAUDE_CODE_WORKFLOW.md` (all in commit `15e3478`). `HOMEPAGE_DESIGN_SPEC.md` became `DESIGN_SPEC.md` and covers the whole site. | Eleven files with heavy duplication; `Docs/` vs `docs/` breaks on case-sensitive hosts. | Editing every file where it stood. |
| D-023 | **The AI-generated reference images are not a reference** and were deleted at the owner's request. The look is defined by `prototype/look.html`. | The owner did not want the design swayed by them; they also contradicted the brief (large ship, glass HUD). | Treating them as the visual bar. |
| D-024 | **Type and colour:** Fraunces for display, Hanken Grotesk for text and UI; deep indigo `--space`, warm white `--ink`, one UI accent `--beacon` (gold); scenery colours stay in the scenes. Locked when the prototype is approved. | A warm serif on indigo reads as an atlas, not a dashboard. One accent keeps the UI quiet so the scenery carries the colour. | A geometric or "futuristic" display face; several accent colours in the UI. |
| D-025 | **Verify commands:** `npm run check` (fast, no build) and `npm run build && npm run shots` (full). | The stop hook runs the fast one; builds and screenshots are too slow for every turn. | A single slow verify command. |
| D-026 | **Display face is a sans, not a serif** (changes the type half of D-024). Default Jost Light; Syne is the bolder alternative in the prototype (`?font=syne`). The owner picks; no serif anywhere, and map notes use Hanken Grotesk italic. | The owner read Fraunces as Times New Roman and disliked it. Jost's compass-drawn round letters echo the chart's rings and hairlines. | Fraunces; Bricolage Grotesque, Unbounded, Familjen Grotesk (compared in `prototype/fonts.html`). |
| D-027 | **The hero galaxy overflows the frame and is drawn full:** closer, higher camera; a soft glow under the whole disc; brighter stars between the arms; dark dust lanes; a halo of old stars; one small companion galaxy. The two hero actions are drawn in the chart's own language (a ticked ring with a circling vessel; an index mark). Owner asked for all three. | A galaxy that fills the screen makes the pull-back to the cosmic web land harder. Plain rectangle and underline actions looked generic beside the scene. | The first prototype's smaller, sparser galaxy and plain button. |
