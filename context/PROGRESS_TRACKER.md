# Cosmic Atlas: Progress Tracker

> **What this file is:** where the work stands. It covers what works now, what is in progress, what comes next (the plan) and a dated session log. A new session reads this first, after `AGENTS.md`. Update it at the end of every session, and tick an item only when it is built and verified. Older log entries fold into "Earlier history" rather than being deleted. Why things are the way they are lives in `DECISIONS.md`, and that log wins over everything else here.

## Current State (2026-11-24, D-180)

Four megastructures are polished (D-176), the ships are refined (D-177), and the site is deployed on Vercel with an Islam and Space page and SEO (D-179), and renamed Cosmic Atlas (D-180): https://the-cosmic-atlas.vercel.app. Judge on the 1440x900 laptop first (D-110).

- **Start page** (`/`, from the owner's `start-page-mockup.png`, D-107): gradient headline, Begin, "Choose Your Vessel" with five ships (Sovereign, Predator, Celestial, Discovery, Colossus; D-120, brief in `SHIP_BRIEF.md`), and a spaceship loader (D-123). `/#atlas` skips it.
- **Header:** wordmark, glass dock (Places, Flights, Ship; D-139, D-151), search that flies to a place, and Sound.
- **Flights** (D-151, `src/content/flights.ts`): A Star's Life and Black Hole to Quasar (guided, Next and End Flight) and The Grand Tour (hands-off, Skip Tour), from the dock's Flights.
- **Atlas stops** (Zoom Out moves outward): A Spiral Galaxy → The Cosmic Web → A Supervoid (three voids growing, dark energy in the line, no turning there; D-132, D-137) → The Observable Universe (turns like a globe, D-130 to D-132) → The Seven Heavens (abstract layers of light, D-174).
- **Places** (one shader each; wheel zooms, drag turns, Zoom Out leaves): Black Hole, Nebula, Neutron Star, Strange Star, Wormhole, Gravastar and Quasi-Star in the galaxy. **A Solar System** holds the Yellow Star and A Blue World. A Blue World holds Its Moon, and Its Moon holds An Asteroid. **A Quasar Galaxy** (reached from the web and through the Wormhole) holds the Quasar and the Dyson Sphere. Places inside places: `inside` and `through` in `src/content/places.ts`, `bodies` in `src/scene/scenes/shared/orb.tsx`.
- **Sound** (`src/lib/sound.ts`): a loop of its own for every stop and place, private (D-183): in the `Private-Assets` repo (submodule `private-assets/cosmic-atlas/music/`), served by `/api/music/` only to a browser holding `MUSIC_KEY`; everyone else hears the noise bed. Effects in `public/audio/effects/`, Magical Space as the fallback, warp sounds on every move, nothing before Begin (D-100, D-114 to D-116).
- **Content:** 5 stops and 46 places in `src/content/places.ts`, each line sourced and checked by `npm run check`.

## In Progress

- Item 13 below: the owner's checks on the deployed site.

## Next Steps

Agreed with the owner on 2026-11-22 (D-136). Work down the list and commit after each item; keep going until the owner stops. Tick an item only when it is built and verified.

**Where things live:** real places are in real space. The megastructures are in A Quasar Galaxy. The Starbase (a place inside the Quasar Galaxy) is the hub for ideas space scenes can't show. The Seven Heavens is the outermost stop. Hypothetical and fiction lines are hedged ("A possible…", "An imagined…") and still sourced.

1. [x] **Finish the cleanup** (done 2026-11-22):
   - Move the audio to `public/audio/music/` (loops and Magical Space) and `public/audio/effects/` (warp sounds and beep).
   - Fold the unique vision-doc notes into `IDEAS.md` and `DESIGN_SPEC.md`, then delete `owner/vision-docs/`.
   - Rewrite `IDEAS.md` as built / planned / not planned.
   - Fix the BLUEPRINT scope: zones, laptop first, and the v1 table becomes this plan.
   - To-do for later: delete `owner/music-library/` once every loop is cut (done 2026-11-24, D-183: `owner/` is gone).
2. [x] **Supervoid fixes** (done 2026-11-22, D-137): remove the separate "Growing empty…" note and put "growing" plus dark energy into the line itself; make the growth slower; turn off panning in the supervoid scene.
3. [x] **Polish the places** (done 2026-11-22, D-138):
   - The Moon's craters look stamped and its maria blocky.
   - The Blue World's land is blobby, with a blown-out highlight.
   - The Wormhole reads as a ringed planet, not a tunnel.
   - Check every scene against its colour family (black holes indigo, gold and violet; quasars electric blue and white; and so on).
4. [x] **Dock and search** (done 2026-11-22, D-139):
   - Replace the placeholder dock with Places (a jump list), Flights, Ship (move the ship picker off the start page), Search and Sound.
   - Search flies you to a place.
   - **Hidden Music mode:** online, the site plays browser-made white noise and the effects stay on. Typing "Music" in search shows a sound icon that turns on the real music, remembered in localStorage.
5. [x] **Video button** (done 2026-11-22, D-141; the Nebula still needs a video, owner to pick): a round button right of Zoom Out that opens the scene's YouTube video (mostly Kurzgesagt) in a new tab. Each video ID is stored with its place.
6. [x] **Real places** (done 2026-11-23, D-142 to D-147; each new place still needs a video, owner to pick, and a music loop):
   - In the galaxy: Supernova and Its Remnant (done 2026-11-22, D-142: A Supernova Remnant; video and music loop to come), Pulsar or Magnetar (done 2026-11-22, D-143: A Magnetar, inside the remnant), Black Hole Merger (done 2026-11-22, D-144).
   - In the Solar System: a Comet (done 2026-11-22, D-145) and a Ringed Planet (done 2026-11-22, D-146: A Ringed Giant).
   - At the web: the Dark Matter reveal (the halo and filaments glow) (done 2026-11-23, D-147: The Dark Matter Web).
7. [x] **A Star's Life and flights** (done 2026-11-23, D-148 to D-151):
   - Add the stages as places: molecular cloud (done 2026-11-23, D-148), red giant (done 2026-11-23, D-149), planetary nebula and white dwarf inside it (done 2026-11-23, D-150).
   - Add guided flights: A Star's Life, and black hole to quasar (done 2026-11-23, D-151: Next and End Flight above Zoom Out).
   - Add a cinematic hands-off tour with Skip, from the dock's Flights (done 2026-11-23, D-151: The Grand Tour, 13 places).
8. [x] **The Starbase hub** (done 2026-11-23, D-152 to D-163; each still needs a video and a music loop) (in the Quasar Galaxy): Warp Drive, Programmable Matter, Higher Dimensions, Pocket Dimensions, Omniverse, Bubble Universes, Vacuum Decay, Quantum Foam, Cosmic Strings, Quarks, String Theory.
   - The Starbase itself, with a bay for each idea (done 2026-11-23, D-152); Warp Drive (done 2026-11-23, D-153); Programmable Matter (done 2026-11-23, D-154); Higher Dimensions, Quantum Foam, Quarks, Vacuum Decay and Bubble Universes (done 2026-11-23, D-155 to D-159); Pocket Dimensions, Omniverse, Cosmic Strings and String Theory (done 2026-11-23, D-160 to D-163).
9. [x] **Megastructures** (in the Quasar Galaxy; done 2026-11-23, D-164 to D-173; each still needs a video and a music loop): Dyson Swarm, Ringworld, O'Neill Cylinder, Matrioshka Brain, Generation Ship, Stellar Engine, Von Neumann Probes, Space Elevator, Star Lifter.
10. [x] **The Seven Heavens** (done 2026-11-23, D-174): one stop after the Observable Universe, seven nested layers each bigger than the last, drawn as abstract light. The line on the site has no Quran quote. Its source (the Quran, fetched) goes in `places.ts`.
11. [x] **Vivid lines pass** (done 2026-11-23, D-175: Black Hole, Nebula and Quasar; owner to judge the rest): rewrite the weakest lines to say what a thing is, still sourced and true.
12. [x] **Ship refinement** (done 2026-11-24, D-177: Predator, Colossus and Discovery reshaped, finer plating on all; owner to judge whether Blender is still needed): better code-built hulls first (Sovereign looks egg-like from above); Blender only if they still fall short.
13. [ ] **Before deploy** (deployed 2026-11-24, D-179; only the owner's checks are left):
    - Test health (done 2026-11-24, D-178: `sceneSettled` is 90 s, the pinch on a phone counts a finger on a marker, the touch check is fixed, `/star` is clean in axe; a full `npm run a11y` run passed all 96 checks on 2026-11-24, D-179, after the scan learned to wait for the drag hint to finish fading in).
    - Phone pass (D-110), including the nebula's dust bank on phones (done 2026-11-24, D-179: the nebula reads well on a phone; the start page's hidden galaxy words no longer show over the wordmark before the scene is live).
    - Set `NEXT_PUBLIC_SITE_URL` (done 2026-11-24, D-179: Vercel's production domain is the fallback; set the variable only for a custom domain).
    - The owner's checks: look at the new scenes on the laptop; arXiv as a source (Wormhole, Gravastar, Quasi-Star); frame rate and touch on real hardware; scene routes at about 145 KB against the 140 KB limit (D-047).
    - An "Islam and Space" page and a verse about those who ponder the signs at the end of the README (fetch the verse) (done 2026-11-24, D-179: `/islam-and-space`, linked from the Seven Heavens; README ends with 3:190).
    - Deploy only when the owner says so (done 2026-11-24, D-179: the owner said so; Vercel project `cosmic-archive`).

**Dropped (2026-11-22):** the hypothetical tag, share images per place, a suggestion form, galaxy collision, a cluster stop, the CMB, kilonova, Wolf-Rayet, binary stars, tidal disruption, exoplanets, auroras, first stars, photo mode.

## How to Check

`npm run check`; `npm run build`; then, if a scene changed, `npm run posters` and build again. After that, `npm run shots` (judge the stills against `DESIGN_SPEC.md` section 11), `npm run a11y` and `npm run fallbacks`. Run them one at a time, in the background, with no server or build running, because the machine runs short of memory.

Limits: draw calls on `low` under 30, scene chunks under 40 KB. Tests that need the atlas use `/#atlas`. Under software WebGL, click heavy scenes from inside the page (`locator.evaluate(el => el.click())`). Leave the production server running for the owner (`npx next start -H 0.0.0.0 -p 3000`).

## What the Owner Wants (Their Words)

- "A spectacle site that showcases beauty, not an educational site." A name and one line (at most twelve words, sourced) per view, with names in Title Case.
- Click to travel; wheel and pinch to zoom; one button to zoom out. No drawn lines over the scenery.
- Latest verdict (2026-11-22): "the ships definitely need to be redesigned/refined, but the celestial stuff and its effect and soundscape is coming along nicely."

## Session Log

- **2026-11-24 (private music), D-182, D-183:** Effects and reference images renamed by what they are; the images are in git at `context/reference-images/`. The music moved to the private `Private-Assets` repo (submodule `private-assets/`), served by `/api/music/` only to the `MUSIC_KEY` holder, who enters it once in the hidden Music switch; 33 new Epic Mountain loops give every stop and place its own. The old loops were cut from this repo's history with filter-repo; `owner/` is deleted. **Checked:** `npm run check`, `npm run build`, the route by hand (401 without the key or with a wrong one, 200 and 206 with it, 404 for the old public address and bad names), and a browser run (a visitor makes no music requests; a wrong key is refused; the right key plays Magical Space and then the Ringworld loop). **Owner to do:** force-push the rewritten main; delete the two merged branches; add `MUSIC_KEY` to `.env` and Vercel; redeploy.
- **2026-11-24 (open source), D-181:** MIT license (audio excluded), CONTRIBUTING, Code of Conduct, issue and pull request templates; a designed share card (`npm run social`, no build); 3:190 quoted in full in the README and on Islam and Space; a shorter overview. **Checked:** `npm run check`, the card by eye. **Owner to do:** upload the new social preview in GitHub settings; redeploy so Islam and Space shows the whole verse.
- **2026-11-24 (deploy and rename), D-179, D-180:** Built the Islam and Space page (`/islam-and-space`, five verses from The Clear Quran over the Seven Heavens, linked from that stop) and ended the README with 3:190. Added SEO (title, keywords, manifest, `WebPage` and `BreadcrumbList` data, sitemap priorities) and the Vercel address fallback. Fixed the phone start page showing the galaxy words over the wordmark, the verse brackets, and the a11y scan's half-faded hint flake. Renamed the site Cosmic Atlas; the repo is `AbdulDevHub/Cosmic-Atlas` with topics, a description and `.github/social-preview.png` (`npm run social`). Deployed: https://the-cosmic-atlas.vercel.app (Vercel project still named `cosmic-archive`; the owner runs `vercel deploy --prod --yes`, since auto mode blocks it). **Checked:** `npm run check`, `npm run build`, full `npm run a11y` 96 of 96, targeted shots (Islam and Space, heavens, home), the live site on laptop and phone. `npm run fallbacks` passed 81 checks, then hit a 90 s scene timeout in the per-place reduced-motion checks, so the rest did not run; rerun it first next session. **Owner to do:** upload the social preview in GitHub settings; the owner's checks in item 13; refinements the owner has in mind.
- **2026-11-24 (test health), D-178:** Fixed a real phone bug: a pinch with one finger on a marker only turned the view. Brought the stale touch check up to date and raised the settle timeout. `npm run fallbacks` passes in full. A one-route axe scan of `/star` is clean. The full `npm run a11y` run was stopped for low memory.
- **2026-11-24 (ships), D-177:** Screenshotted each ship on the start page with a temporary script. Reshaped the Predator (sickle wings, a pronged bow), the Colossus (stacked decks, chevron armour) and the Discovery (a six-sided prow). The plating is finer on all five, and the loader silhouettes match. `npm run check` and `npm run build` pass, as do the `home` and `start` shots (6 of 6). The start-page posters were remade.
- **2026-11-24 (overnight review), D-176:** Fast-forwarded `overnight/2026-11-24` into `main` (local only). `npm run check` and `npm run build` pass. Looked at every new still. Redid the four weakest (O'Neill Cylinder, Ringworld, Stellar Engine, Generation Ship); their posters, share images and targeted `npm run shots` (24 of 24) pass. Still weak, for a later pass: Higher Dimensions (reads as a hollow cube), Programmable Matter (a dotted egg) and Matrioshka Brain (shells read as arcs).
- **Overnight summary (2026-11-23 into 11-24, branch `overnight/2026-11-24`, D-151 to D-175):**
  - **Built:** item 7, the guided flights (A Star's Life, Black Hole to Quasar) and The Grand Tour with Skip, from the dock's Flights (D-151). Item 8, the Starbase (a ray-marched wheel station in A Quasar Galaxy) and all eleven of its ideas (D-152 to D-163). Item 9, the nine megastructures in A Quasar Galaxy (D-164 to D-173). Item 10, the Seven Heavens as stop 5 (D-174). Item 11, new lines for Black Hole, Nebula and Quasar (D-175). That makes 21 new places (46 in all) and 5 stops. Also: the Places panel gives the Starbase's ideas a group of their own; `npm run shots -- <word>` runs only matching routes; `PW_CHROMIUM` lets the scripts use the container's own Chromium.
  - **Checked:** `npm run check` and `npm run build` before every commit. The flights were driven end to end in Playwright, with and without reduced motion. A full `npm run shots` run passed all 149 shots it reached (every desktop and reduced-motion shot from before tonight's places, and some phone shots) before I stopped it to save time. Every new place, A Quasar Galaxy, the atlas stills and the Seven Heavens then passed targeted shots (desktop, phone, reduced). `npm run fallbacks`: 168 of 170 pass; the two touch checks fail, as before (item 13). Three fallback checks were out of date since D-132, D-133 and D-147, and now expect places inside places. `npm run a11y` was not run tonight.
  - **Needs your eyes:** every new scene on the laptop, especially Matrioshka Brain (its shells read partly as arcs), O'Neill Cylinder (its mirrors are left out; the colours are simple), Generation Ship (a ship as a place, by the plan) and the Seven Heavens (abstract light: are the layers clear enough?). Several sources are not NASA: arXiv papers, Space.com, Science News Explores, Freethink, Scientific American, Reactor, UNLV and NSS pages. The Seven Heavens' sources are Quran.com, in The Clear Quran. New places have no videos and no music loops; the flights have no voice-over or extra sound. Item 12 (ships) was not started.

- **2026-11-22 (cleanup):** Moved the docs to `context/`. Merged `TECHNICAL_DIRECTION.md` into `ARCHITECTURE.md` and the old checklist and roadmap into this tracker. Deleted the night-run brief. Moved the owner's private folders into `owner/` (D-134). Set up `AGENTS.md` as the single rules file.
- **2026-11-22 (evening), D-132 and D-133:** three growing supervoids; A Solar System, A Blue World, Its Moon and An Asteroid; A Quasar Galaxy through the Wormhole; "Growing empty…". Pushed.
- **2026-11-22 (night run, merged), D-125 to D-131:** Wormhole, Gravastar, Quasi-Star, Earth (later A Blue World), Moon, and the Observable Universe as stop 4. The run went 93 of 93 on shots, 25 of 26 on a11y, and 64 of 68 on fallbacks (the touch checks, plus missing music in the cloud container).
- **2026-11-21 to 2026-11-22, D-107 to D-124:** the start page from `start-page-mockup.png`; the dock header; sound per scene; the five-ship fleet and its redesign; the supervoid as stop 3; the spaceship loader.

### Earlier History

The work ran in three tracks of numbered sessions in the old roadmap:

- **F (Foundation), 2026-11-11 to 2026-11-17:** F0 replan; F1 the look prototype (Syne headline, palette; removed in D-135); F2 Next 16 scaffold and scripts; F3a/b scene system, tiers, governor, fallbacks and the atlas; F4 the content check and Black Holes.
- **O (the reading site), 2026-11-17 to 2026-11-20:** subject pages (Galaxies, Nebulae, Quasars), a journey, Explore polish, and release prep (metadata, OG images, sitemap, a11y).
- **The pivot:** the owner's read-through turned the site into a spectacle (D-092), and most of the O work was removed (D-093 to D-095).
- **S (Spectacle), 2026-11-20 to 2026-11-21:** S1 strip to spectacle, then the owner's notes (sound, deep sky, drag and zoom, the start page); S2 galaxy and web; S3 black hole and quasar; S4 nebula. S5 (owner review, then deploy) is still open and is now part of the plan above.

The full per-item checklist with every test count is in git history (`docs/PHASE_CHECKLIST.md` before 2026-11-22).
