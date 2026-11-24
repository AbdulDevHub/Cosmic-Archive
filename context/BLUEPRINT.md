# Cosmic Atlas: Project Blueprint

> **What this file is:** what Cosmic Atlas is, what is in scope and the editorial rules (sourcing, imagery). Read it before touching content in `src/content/places.ts` or changing scope. Update it only when the owner changes the scope, and record the change in `DECISIONS.md`.

**Status:** v4, 2026-11-22: scope, audience and inclusion rule updated for the replan (D-136). v3, 2026-11-20. Rewritten after the owner's read-through of v1: "way too wordy; I wanted a spectacle that showcases beauty, not an educational site" (D-092). Replaces v2 (2026-11-11, in git), which described a sourced, educational atlas.
**This file answers:** what the product is, what is in scope, and the editorial rules. How it looks is in `DESIGN_SPEC.md`; how it is built is in `ARCHITECTURE.md`; the order of work is in `PROGRESS_TRACKER.md`.

## 1. Vision

Cosmic Atlas is the universe to look at: a spectacle of real-time cosmic scenes that a visitor clicks through, from the cosmic web into a galaxy and down into the wonders inside it, each move a smooth flight.

The feeling to aim for is **beautiful cosmic wonder**: enormous, colourful, alive. The universe is always the whole picture.

## 2. Principles

1. **Beauty first, and nearly only.** One strong image fills the screen; the words are a name and one line.
2. **Click to travel.** Moving through the universe is clicking: a stop further out, a stop closer, a light to fall into. The wheel, a pinch and a drag are extras. Nothing scrolls.
3. **Every move is a flight.** No hard cuts between scenes: dive, veil, arrive (D-096).
4. **Honest in its few words.** Every line the site says is true and sourced; every picture is called an illustration.
5. **Never blocked by 3D.** Every screen works as its poster, its words and real links.
6. **Performance is a feature.** Budgets are numbers, in `ARCHITECTURE.md`, and are enforced.

Non-goals: a textbook, an encyclopedia, a game, a planetarium simulator, a sci-fi HUD.

## 3. Audience

Anyone who likes looking at space. They come to be amazed, not to read. The laptop comes first (D-110); phones only have to work until a final pass.

## 4. Scope

### Now and next

The built site and the ordered plan are in `PROGRESS_TRACKER.md` ("Current State" and "Next Steps", D-136). In short:

| Area | Contents |
|---|---|
| Stops | A Spiral Galaxy, The Cosmic Web, A Supervoid, The Observable Universe; the Seven Heavens planned as the outermost |
| Real places | Found where the atlas puts them: in the galaxy, in A Solar System and its worlds, or at the web |
| A Quasar Galaxy | Reached from the web and through the Wormhole; holds the megastructures (Dyson Sphere and more) and the Starbase |
| The Starbase | A hub for ideas that space scenes can't show: warp drive, programmable matter, higher dimensions and more |
| Sound | The owner's music (hidden behind Music mode once online) and effects; nothing before the first gesture (D-100, D-136) |

### Never

Accounts, payments, analytics, a CMS or database, sound before the visitor's first gesture, embedded third-party imagery (see 6.2), long-form text on a scene screen.

## 5. Inclusion rule

A place belongs if it is beautiful enough to fly into and sits in the right zone (D-136). **Real** places are found where the atlas puts them. **Hypothetical** places (a wormhole, a gravastar) can sit in real space, with lines that say "A possible…". **Fiction** and big ideas go in A Quasar Galaxy (megastructures) or the Starbase (concepts), with lines that say so. The Seven Heavens is framed for general visitors and sourced to the Quran. `IDEAS.md` is an idea bank, not a to-do list.

## 6. Editorial standards

### 6.1 Sourcing (every line the site says)

1. Each place and each stop has one line of at most twelve words. It is a claim, so it names the sources it came from in `src/content/places.ts`.
2. Each source is fetched and read before it is cited, and recorded with title, publisher, URL and the date it was checked.
3. `npm run check` and the build fail if a line has no source, a source is not listed or has no checked date, a source backs no line, or a line is longer than twelve words.
4. Never write a number, distance, date or name from memory. If no source was read for it, it does not go on the site.

### 6.2 Imagery

- All imagery is our own: real-time scenes and stills rendered from them.
- No telescope photographs, agency artwork or third-party images are embedded or hosted (owner decision, 2026-11-11). With About gone (D-099), the site links to none either.
- An illustration is never described as a photograph or as data.

### 6.3 The atlas tells the truth about place

- Things inside a galaxy (a black hole at its core, a nebula in an arm) are reached from the galaxy. Things that are other galaxies, or live in them (a quasar), are reached from the cosmic web.
- No coordinates are invented.

## 7. Information architecture

Routes: `/` (the universe), `/black-hole`, `/nebula`, `/quasar`. The header has the wordmark (home) and Sound. The universe itself is the navigation.

## 8. Risks and safeguards

| Risk | Safeguard |
|---|---|
| Scope grows without end | The v1 table above. Anything else needs the owner. |
| 3D makes the site slow or unusable | Poster-first loading, device tiers, a frame-time governor, hard budgets. |
| The flow between scenes stutters or hangs | Scene chunks preloaded when idle; the veil hides compiling; the veil lifts on its own if a scene never draws. |
| Site drifts into a sci-fi HUD | Design bans in `DESIGN_SPEC.md`; nothing drawn over the scenery. |
| Words creep back | Twelve words a line, checked by the build. |
| Misinformation | The process in 6.1 and the build check. |
| Later sessions redo or undo decisions | `DECISIONS.md` is append-only; `AGENTS.md` lists what must not change. |

## 9. Standing owner decisions

Name: Cosmic Atlas. Identity: the universe to look at, cosmos alone (D-092, D-094). Places: black hole, nebula, quasar; the galaxy is a stop of the universe, not a place of its own (D-093). Sound: on, the owner's own music (D-100). Deployment: Vercel, later, only when the owner says so. The full log is `DECISIONS.md`.
