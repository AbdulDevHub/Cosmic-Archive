# Cosmic Archive: Roadmap

**Status:** v3, 2026-11-11. Re-ordered: the scenes come first. Opus builds from F2 on. Each numbered item is sized for one working session and ends with a commit. Progress is tracked in `PHASE_CHECKLIST.md`.

## Foundation

F0 and F1 were done by Fable and are finished. The owner then moved Fable to another project (D-028), so Opus builds the rest, starting at F2. `OPUS_NEXT_WEEK_PROMPT.md` always describes the next session in detail; update it at every commit.

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| F0 | Re-plan (done) | These docs, the decisions log, a short `CLAUDE.md`, the Opus prompt | Owner approved the plan |
| F1 | Look prototype (done) | `prototype/look.html`: hero and atlas look, type, palette | Owner approved the look, with Syne as the headline face |
| F2 | Scaffold | Next 16 app, tokens, fonts, header and footer shell, hero copy and actions, `check` / `shots` / `posters` scripts | `npm run check` and `npm run build` pass; hero copy matches the prototype |
| F3a | Scene system + the hero galaxy | `SceneHost`, `SceneSlot`, registry, store, tiers, governor, fallbacks, pause; atlas Level 1 at the hero view with linework, vessel and trail; `/` hero live | Fallback tests in `ARCHITECTURE.md` section 8 pass; hero screenshots match `prototype/shots/` |
| F3b | Atlas chart, zoom out, Explore | Atlas Level 2, the scroll-driven zoom through all three stages, beacon links, list view, the map margin; `/explore` with free control | Chart and zoom-out screenshots match the prototype; every beacon is a working link |
| F4 | Content model + Black Holes | MDX pipeline, content check, the Black Holes page with its live scene and sourced copy | `npm run check` fails when a source is removed; owner reads the copy |

## Later sessions (one per session, in order)

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| O1 | Homepage, lower half + About + Archive | Destinations, journey preview, Uncharted teaser, footer; `/about` with the evidence legend and method; `/archive` index | No dead links; all nav items resolve; phone layout composed |
| O2 | Galaxies | Subject page reusing the atlas galaxy in a subject framing | Sourced copy passes the content check |
| O3 | Nebulae | Subject page and a nebula scene | Scene meets the budgets on `low` |
| O4 | Quasars | Subject page; the black-hole scene with jets and a distant framing | Explains the link to Black Holes and Galaxies |
| O5 | Journey: A star's life | `/journeys/a-stars-life`, the branching trail line | Each step says why it leads to the next |
| O6 | Explore polish | Touch and keyboard control, list view, atlas-to-subject transition | Usable by keyboard only and by touch only |
| O7 | Release prep | Metadata, OG images, sitemap, JSON-LD, performance and accessibility audit | Budgets in `ARCHITECTURE.md` measured and met |
| O8 | Owner review, then deploy | Fixes from the owner's read-through; Vercel only when the owner says so | Owner sign-off |

## After v1

Theoretical Frontiers pages; more atlas levels (Solar System, Local Group, observable universe); more core subjects; search; optional sound; the separate fiction and technology collection. None of these start without the owner.

## Discipline

- One session, one item, one commit. Stop at the stop point.
- Do not add a dependency for a later item.
- A visual task is not done until its screenshots pass the checklist in `DESIGN_SPEC.md` section 11.
- Record changed decisions in `DECISIONS.md`; do not reopen settled ones.
