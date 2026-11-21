# Cosmic Archive: Project Blueprint

**Status:** v3, 2026-11-20. Rewritten after the owner's read-through of v1: "way too wordy; I wanted a spectacle that showcases beauty, not an educational site" (D-092). Replaces v2 (2026-11-11, in git), which described a sourced, educational atlas.
**This file answers:** what the product is, what is in scope, and the editorial rules. How it looks is in `DESIGN_SPEC.md`; how it is built is in `ARCHITECTURE.md`; the order of work is in `PHASED_ROADMAP.md`.

## 1. Vision

Cosmic Archive is the universe to look at: a spectacle of real-time cosmic scenes that a visitor clicks through, from the cosmic web into a galaxy and down into the wonders inside it, each move a smooth flight.

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

Anyone who likes looking at space. Half are on phones. They come to be amazed, not to read.

## 4. Scope

### v1

| Area | Contents |
|---|---|
| The universe, `/` | One scene, three stops: the cosmic web, the whole galaxy, close in over the disc |
| Places | Three, each its own scene: black hole, nebula, quasar |
| Sound | The owner's own music under the scenes, a whoosh for each flight; on by default after the first gesture (D-100) |

### Next (each its own session, in `PHASED_ROADMAP.md`)

Make the four scenes richer before adding anything: S2 galaxy and cosmic web, S3 black hole and quasar, S4 nebula.

### After that (do not start without the owner)

- More places: a supernova, a planet, the Solar System, a star-forming region seen up close.
- More atlas stops (the Local Group, the observable universe).
- Optional sound (user-initiated, off by default).

### Never

Accounts, payments, analytics, a CMS or database, sound before the visitor's first gesture, embedded third-party imagery (see 6.2), long-form text on a scene screen.

## 5. Inclusion rule

A place belongs if it is real, is found where the atlas puts it (inside the galaxy, or among the galaxies of the web), and is beautiful enough to fly into. `CONTENT_CATALOGUE.md` is an idea bank, not a to-do list.

## 6. Editorial standards

### 6.1 Sourcing (every line the site says)

1. Each place and each stop has one line of at most twelve words. It is a claim, so it names the sources it came from in `content/places.ts`.
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
| Later sessions redo or undo decisions | `DECISIONS.md` is append-only; `CLAUDE.md` lists what must not change. |

## 9. Standing owner decisions

Name: Cosmic Archive. Identity: the universe to look at, cosmos alone (D-092, D-094). Places: black hole, nebula, quasar; the galaxy is a stop of the universe, not a place of its own (D-093). Sound: on, the owner's own music (D-100). Deployment: Vercel, later, only when the owner says so. The full log is `DECISIONS.md`.
