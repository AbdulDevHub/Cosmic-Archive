# Cosmic Archive: Roadmap

**Status:** v2, 2026-11-11. Re-ordered: the scenes come first. Each numbered item is sized for one working session and ends with a commit. Progress is tracked in `PHASE_CHECKLIST.md`.

## Fable week (ends Sun Nov 16 2026)

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| F0 | Re-plan | These docs, the decisions log, a short `CLAUDE.md`, first draft of the Opus prompt | Owner approved the plan |
| F1 | Look prototype | `prototype/look.html`: hero and atlas look, type, palette | Owner approves the screenshots |
| F2 | Scaffold | Next 16 app, tokens, fonts, header and footer shell, `check` / `shots` / `posters` scripts | `npm run check` and `npm run build` pass |
| F3 | Scene system + atlas | `SceneHost`, `SceneSlot`, tiers, governor, fallbacks, pause; atlas Level 1 and 2, zoom, linework, vessel, beacon links; `/` hero and `/explore` | Fallback tests in `ARCHITECTURE.md` section 8 pass; screenshots match the prototype |
| F4 | Content model + Black Holes | MDX pipeline, content check, the Black Holes page with its live scene and sourced copy | `npm run check` fails when a source is removed; owner reads the copy |
| F5 | If budget remains | Lower homepage sections | As O1 below |

If Fable time runs out, the unfinished item becomes Opus's first session. `OPUS_NEXT_WEEK_PROMPT.md` is updated at every commit so this is always safe.

## Opus sessions (one per session, in order)

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
