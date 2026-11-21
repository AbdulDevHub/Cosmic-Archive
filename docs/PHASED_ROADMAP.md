# Cosmic Archive: Roadmap

**Status:** v4, 2026-11-20. The owner turned the site into a spectacle at O8 (D-092): the S sessions below replace O8. Each numbered item is sized for one working session and ends with a commit. Progress is tracked in `PHASE_CHECKLIST.md`. F and O sessions are history: what they built is partly removed (D-093 to D-095).

## Foundation

F0 and F1 were done by Fable and are finished. The owner then moved Fable to another project (D-028), so Opus builds the rest, starting at F2. The "Next session" section at the top of `PHASE_CHECKLIST.md` describes the next session; update it at every commit (it replaced `OPUS_NEXT_WEEK_PROMPT.md`, D-106).

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| F0 | Re-plan (done) | These docs, the decisions log, a short `CLAUDE.md`, the Opus prompt | Owner approved the plan |
| F1 | Look prototype (done) | `prototype/look.html`: hero and atlas look, type, palette | Owner approved the look, with Syne as the headline face |
| F2 | Scaffold | Next 16 app, tokens, fonts, header and footer shell, hero copy and actions, `check` / `shots` / `posters` scripts | `npm run check` and `npm run build` pass; hero copy matches the prototype |
| F3a | Scene system + the hero galaxy | `SceneHost`, `SceneSlot`, registry, store, tiers, governor, fallbacks, pause; atlas Level 1 at the hero view with linework, vessel and trail; `/` hero live | Fallback tests in `ARCHITECTURE.md` section 8 pass; hero screenshots match `prototype/shots/` |
| F3b | Atlas chart, zoom out, Explore | Atlas Level 2, the scroll-driven zoom through all three stages, beacon links, list view, the map margin; `/explore` with free control | Chart and zoom-out screenshots match the prototype; every beacon is a working link |
| F4 | Content model + Black Holes | MDX pipeline, content check, the Black Holes page with its live scene and sourced copy | `npm run check` fails when a source is removed; owner reads the copy |

## Atlas sessions (done; partly removed by S1)

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| O1 | Homepage, lower half + About + Archive | Destinations, journey preview, Uncharted teaser, footer; `/about` with the evidence legend and method; `/archive` index | No dead links; all nav items resolve; phone layout composed |
| O2 | Galaxies | Subject page reusing the atlas galaxy in a subject framing | Sourced copy passes the content check |
| O3 | Nebulae | Subject page and a nebula scene | Scene meets the budgets on `low` |
| O4 | Quasars | Subject page; the black-hole scene with jets and a distant framing | Explains the link to Black Holes and Galaxies |
| O5 | Journey: A star's life | `/journeys/a-stars-life`, the branching trail line | Each step says why it leads to the next |
| O6 | Explore polish | Touch and keyboard control, list view, atlas-to-subject transition | Usable by keyboard only and by touch only |
| O7 | Release prep | Metadata, OG images, sitemap, JSON-LD, performance and accessibility audit | Budgets in `ARCHITECTURE.md` measured and met |
| O8 | Owner review, then deploy | Superseded: the read-through changed the direction (D-092) | — |

## Spectacle sessions (one per session, in order)

| # | Session | Outcome | Acceptance |
|---|---|---|---|
| S1 | Strip to spectacle (done) | Words cut to a name and a line; ink, vessel and reading pages removed; `/` with three stops and `/black-hole`, `/nebula`, `/quasar`; click-to-zoom; the flow between scenes (dive, veil, arrive) | Shots, fallbacks (with the flow, keyboard and touch) and a11y pass; owner clicks through |
| S2 | Galaxy and cosmic web | Richer colour from core to arms, star-forming knots and young clusters along the arms, layered dust, a light bloom of our own (no dependency), a deeper, glowing web, a finer dive through the disc | Budgets on `low`; owner's look |
| S3 | Black hole and quasar | A crisper photon ring, Doppler brightening, a finer lensed star field, knots in the jets, a richer host galaxy | Budgets on `low`; owner's look |
| S4 | Nebula | Layered depth with parallax as you drag, embedded young stars, deeper colour and contrast | Budgets on `low`; owner's look |
| S5 | Owner review, then deploy | Fixes from the owner's look; Vercel only when the owner says so | Owner sign-off |

## After that

More places to fly into (a supernova, a planet, the Solar System); more atlas stops (the Local Group, the observable universe); optional sound. None of these start without the owner.

## Discipline

- One session, one item, one commit. Stop at the stop point.
- Do not add a dependency for a later item.
- A visual task is not done until its screenshots pass the checklist in `DESIGN_SPEC.md` section 11.
- Record changed decisions in `DECISIONS.md`; do not reopen settled ones.
