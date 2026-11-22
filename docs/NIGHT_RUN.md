# Night Run: Five New Places and the Universe Level

An unattended cloud session, started by the owner on 2026-11-22 before sleeping. The owner asked for exactly this scope; it overrides the "one roadmap session, then stop" rule for this run only.

## Before Anything

1. Read `CLAUDE.md`, the "Next session" section of `docs/PHASE_CHECKLIST.md`, `docs/DESIGN_SPEC.md`, `docs/ARCHITECTURE.md` (sections 3 and 4), and `docs/DECISIONS.md` from D-092 to the end. D-117 shows how three places were added at once; D-119 and D-121 show the supervoid stop. The decision log wins over older docs.
2. Create the branch `night/places-and-universe` from `main`. **Never commit to or push `main`, never merge, never deploy.**
3. `npm ci`, then `npm run check` to confirm a clean start.

## What to Build, in This Order

Commit after each item, and push the branch after each commit, so a run that stops early still leaves its work.

1. **Wormhole** (hypothetical): an Einstein-Rosen bridge, a bright ring of lensed light around a throat that shows another sky through it.
2. **Gravastar** (hypothetical): a dark-energy-filled bubble behind a thin, shining shell of matter, where a black hole's horizon would be. The line must be hedged ("A possible…").
3. **Quasi-Star** (hypothetical, early universe): a vast, swollen, red-orange star with a black hole feeding at its heart, light breaking through its churning surface.
4. **Earth**: the blue planet with clouds, oceans, night-side city lights and a thin bright atmosphere. The start page's planet (`src/scene/scenes/atlas/start.ts`) is a starting point, close up and much finer.
5. **Moon**: grey, cratered, with maria, lit hard from one side.
6. **The Universe level**: a fifth atlas stop (zoom 4) beyond the supervoid, following the D-119 pattern. Zoom Out on the supervoid glides out to the observable universe: the foam of walls and voids shrinking into a vast sphere, a faint glow at its edge. Zoom Out is no longer dimmed at the supervoid, but is dimmed at the universe. One hotspot, "The Supervoid", glides back. It gets a name ("The Universe" or "The Observable Universe") and one sourced line.

## How Each Place Is Made

Follow the existing places exactly (look at `strange-star` and `dyson-sphere`, D-117):

- **Scene:** its own one-shader scene in `src/scene/scenes/<id>/`, through `useOrbScene` where it fits, within the budgets in `docs/ARCHITECTURE.md` section 3. Only `src/scene/` imports three.
- **Wiring:** add it to `registry.ts`, `SceneId` in `store.ts` and `PlaceId` in `content/places.ts`, give it an atlas anchor in `world.ts` `ANCHORS` and `AtlasAnchor`, and add it to `PLACE_OG` in `src/lib/site.ts` and `TRACKS` in `src/lib/sound.ts`. Music loops are not in the repo; a missing loop falls back by design.
- **Test lists:** add it to the route lists in `scripts/shots.mjs`, `scripts/posters.mjs`, `scripts/a11y.mjs` and `scripts/fallbacks.mjs`, and update the `spots` counts in `shots.mjs` where a stop gains hotspots.
- **Where the hotspots stand:**
  - Wormhole, Gravastar and Quasi-Star: in the galaxy, away from the six already there.
  - Earth and Moon: in the galaxy's outer disc near the Yellow Star (anchor `sun`), close together but not overlapping.
  - Check the galaxy still reads cleanly at 1440x900 with eleven hotspots. If it is crowded, put Earth and Moon on one spot ("Earth and Moon") and say so in the decision.
- **Words:** a name in Title Case and one line of at most twelve words per view. **Every line is true and sourced:** fetch the source (NASA, ESA, Caltech or a university page; not Wikipedia), quote it in a comment above the line, list it in `SOURCES` with today's date as `checked`. `npm run check` enforces this. If no source can be fetched, skip that place and say so.
- **Look:** our own illustration, in the site's palette (`docs/DESIGN_SPEC.md`). Never use telescope photos or third-party art. Nothing is drawn over the scene (no rings, ticks, lines or HUD). The owner judges the 1440x900 laptop view; phones only need to work (D-110).

## Checking

- `npm run check` after every change; `npm run build`, then `npm run shots`, before every commit. Run the heavy scripts one at a time.
- **Headless WebGL here is software-rendered, about a second a frame.** Without a pinned tier the quality governor drops a live page to the static poster. Judge looks only from `?shot=1&t=12&tier=high` stills and pages with `?tier=` pinned. `npm run shots` already does this.
- Look at every new still (desktop and phone) before committing. Fix anything that looks broken, muddy or drawn over.
- Re-render the posters with `npm run posters` for each new place and for the atlas stills that change.
- Known failures that are not yours: the two `touch` checks in `npm run fallbacks`, and the a11y contrast finding for the drag hint on `/nebula` on a phone.

## Leaving It for the Morning

- Append one decision per place (and one for the Universe level) to `docs/DECISIONS.md`, from D-125 on, in the table's existing style.
- At the very top of `docs/PHASE_CHECKLIST.md`, add a short **"Night run report (2026-11-23)"**. It says:
  - what was built and what was skipped, and why;
  - the commands run, with their results;
  - what the owner should look at first.
- Push the branch and open a pull request into `main` if the environment allows it, titled "Night Run: Five New Places and the Universe Level". Do not merge it.
- Commit messages: gitmoji plus a conventional type, sentence case (for example `✨ feat: Add the Wormhole`).
