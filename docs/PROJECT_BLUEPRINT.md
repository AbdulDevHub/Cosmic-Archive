# Cosmic Archive: Project Blueprint

**Status:** v2, 2026-11-11. Rewritten by Fable after the owner interview. Replaces the ChatGPT draft v1.1 (kept in git, commit `15e3478`).
**This file answers:** what the product is, what is in scope, and the editorial rules. How it looks is in `DESIGN_SPEC.md`; how it is built is in `ARCHITECTURE.md`; the order of work is in `PHASED_ROADMAP.md`.

## 1. Vision

Cosmic Archive is a living atlas of the universe: an immersive, educational website where visitors explore real-time cosmic scenes and learn what we know, how we know it, and what is still unknown.

The feeling to aim for is **beautiful cosmic wonder**: the universe is enormous, colourful and worth understanding. The universe is always the subject. A tiny exploration vessel appears only as a scale cue.

## 2. Principles

1. **Awe first, depth on demand.** One strong image and one sentence, then progressively more.
2. **Understandable, not dumbed down.** Clear language without distorting the science.
3. **Honest by design.** Evidence status is part of the visual language (solid ink for observed, dashed for unconfirmed), not a footnote.
4. **Never blocked by 3D.** Every page is complete as server-rendered HTML. Scenes are an enhancement.
5. **Exploration is optional.** Atlas, archive list and journeys are parallel ways to the same content.
6. **Reuse structure, not art.** Pages share a framework; each subject gets its own palette and scene.
7. **Performance is a feature.** Budgets are numbers, in `ARCHITECTURE.md`, and are enforced.

Non-goals: a textbook, a game, a planetarium simulator, a Star Trek fan site, a sci-fi HUD.

## 3. Audience

Curious general visitors who like space and science videos and may have no scientific training. Half are on phones. Some arrive with a question (archive, search), some browse by eye (atlas), some want to be led (journeys).

## 4. Scope

### v1 (first public release)

| Area | Contents |
|---|---|
| Home | Hero and atlas as one continuous scene, then destinations, a journey preview, a frontiers teaser, footer |
| Explore | The atlas, two scale levels: a galaxy, then the cosmic web |
| Subjects | Four flagship pages: Black Holes, Galaxies, Nebulae, Quasars |
| Journeys | One: "A star's life" |
| Archive | A plain browsable index of everything published |
| About | Purpose, the evidence legend, sourcing method, credits |

### After v1 (do not start without the owner)

- Theoretical Frontiers pages (wormholes, gravastars, cosmic strings, extra dimensions, multiverse proposals).
- More atlas levels (Solar System, Local Group, observable universe).
- More core subjects from `CONTENT_CATALOGUE.md`.
- Search beyond a simple client-side filter. Optional sound (user-initiated, off by default).
- A separate "Civilizations, Technology & Fiction" collection (Dyson swarms, Star Trek vessels, programmable matter). Never mixed into the science archive.

### Never

Accounts, payments, analytics, a CMS or database, autoplaying audio, embedded third-party imagery (see 6.3).

## 5. Collections and inclusion rule

- **The Universe (core):** planetary worlds; stars and stellar evolution; galaxies and large-scale structure; nebulae and the interstellar medium; cosmic extremes (black holes, quasars, gamma-ray bursts, lensing); cosmology (CMB, expansion, dark matter, dark energy, gravitational waves).
- **Theoretical Frontiers (secondary):** physically motivated but unconfirmed ideas. Each page must say what the status is and what evidence would settle it.
- **Civilizations, Technology & Fiction (future, separate).**

A topic belongs in the core only if it directly helps explain the universe, its laws, its structures, or phenomena observed in it. `CONTENT_CATALOGUE.md` is an idea bank, not a to-do list.

## 6. Editorial standards

### 6.1 Evidence status

Every subject, and every claim that differs from its page's status, carries one of:

| Status | Meaning | Drawn as |
|---|---|---|
| Observed | Directly detected; say how | Solid ink |
| Established | Supported by converging evidence | Solid ink |
| Theoretical | A tested or testable model, not directly confirmed | Long dash |
| Hypothetical | Proposed, not confirmed | Short dash |
| Speculative | Little or no empirical support yet | Dotted |
| Fictional | Invented; future collection only | Not in the science archive |

The status is always written as text too. Line style and colour never carry it alone. The labels are not a ranking of worth.

### 6.2 Sourcing process (mandatory for every published page)

1. Research first. A subagent (Sonnet) fetches primary sources and returns the exact supporting sentences with URLs. Preferred: NASA, ESA, ESO, the Event Horizon Telescope collaboration, LIGO, major observatories, peer-reviewed papers, university research groups.
2. Write from the sources. Each factual statement is wrapped in a `<Claim source="id">` and each source is recorded in the page's frontmatter with title, publisher, URL and the date it was checked.
3. `npm run check` fails if a claim has no source, a source has no checked date, or an id does not resolve.
4. Never write a number, distance, date, name or "scientists think" from memory. If no source was fetched for it, it does not go on the page.
5. Where researchers disagree, say so proportionately. Where a figure is an estimate, give the range and the source's wording.
6. The owner reads each page before it is public. Pages carry a visible "last reviewed" date.

### 6.3 Imagery

- All imagery is our own: real-time scenes, stills rendered from them, and original diagrams. Each is labelled "Illustration".
- No telescope photographs, agency artwork or third-party images are embedded or hosted. Real observations are linked to at their source (owner decision, 2026-11-11). This removes licence and credit handling.
- An illustration is never described as a photograph or as data.

### 6.4 The atlas tells the truth about place

- Things that exist inside a galaxy are placed inside the galaxy level. Things that are other galaxies, or live in them, appear at the cosmic-web level.
- Unconfirmed ideas have no location. They sit at the map's margin in dashed "uncharted" ink.
- The atlas is labelled as an illustration that is not to scale. No coordinates are invented.

## 7. Information architecture

Navigation: **Explore** (atlas), **Journeys**, **Archive**, **About**. The wordmark links home. A link appears in the navigation only when its page exists.

Routes: `/`, `/explore`, `/subjects/[slug]`, `/journeys/[slug]`, `/archive`, `/about`.

### Subject page framework

Adapt the sections to the subject; do not force a section that makes the science awkward.

1. Opening scene and one-sentence hook.
2. What it is and why it matters (short, story-led).
3. A visual explanation (diagram or live scene).
4. How it forms or works.
5. Scale and context.
6. What observations tell us, with links to the real observations.
7. What is unknown or debated.
8. Where to go next (related subjects, journeys).
9. Sources, with checked dates.

### Journeys

A journey explains why one topic leads to the next; it is not a row of links. "A star's life": molecular cloud, star formation, main-sequence star, then end states that depend on the star's mass (white dwarf, neutron star or black hole). Journeys are optional paths, never a required progression.

## 8. Risks and safeguards

| Risk | Safeguard |
|---|---|
| Scope grows without end | The v1 table above. Anything else needs the owner. |
| 3D makes the site slow or unusable | Poster-first loading, device tiers, a frame-time governor, hard budgets. |
| Site drifts into a sci-fi HUD | Design bans in `DESIGN_SPEC.md`; the vessel stays tiny. |
| Map implies false precision | The placement rule in 6.4. |
| Misinformation from AI-written copy | The process in 6.2 and the build check. |
| Later sessions redo or undo decisions | `DECISIONS.md` is append-only; `CLAUDE.md` lists what must not change. |
| Every page looks the same | Per-subject palette and scene on a shared framework. |

## 9. Standing owner decisions

Name: Cosmic Archive. Tagline: "Explore the extraordinary." Flagships: Black Holes, Galaxies, Nebulae, Quasars. Identity: Living Atlas. Sound: optional, user-initiated, off by default, not in v1. Blender: allowed as an authoring tool, not required and not used so far. Deployment: Vercel, later, only when the owner says so. The full log is `DECISIONS.md`.
