# Cosmic Archive: Progress Tracker

> **What this file is:** where the work stands. It covers what works now, what is in progress, what comes next (the plan) and a dated session log. A new session reads this first, after `AGENTS.md`. Update it at the end of every session, and tick an item only when it is built and verified. Older log entries fold into "Earlier history" rather than being deleted. Why things are the way they are lives in `DECISIONS.md`, and that log wins over everything else here.

## Current State (2026-11-22, D-133)

Everything is committed and pushed to the private GitHub repo (`AbdulDevHub/Cosmic-Archive`). Nothing is deployed. Judge on the 1440x900 laptop first (D-110).

- **Start page** (`/`, from the owner's `Home.png`, D-107): gradient headline, Begin, "Choose Your Vessel" with five ships (Sovereign, Predator, Celestial, Discovery, Colossus; D-120, brief in `SHIP_BRIEF.md`), and a spaceship loader (D-123). `/#atlas` skips it.
- **Header:** wordmark, glass dock (Science, Explore, Learn, Discover: "coming soon"), search ("coming soon") and Sound (D-116).
- **Atlas stops** (Zoom Out moves outward): A Spiral Galaxy → The Cosmic Web → A Supervoid (three voids growing, "Growing empty…", D-132, D-133) → The Observable Universe (turns like a globe, D-130 to D-132).
- **Places** (one shader each; wheel zooms, drag turns, Zoom Out leaves): Black Hole, Nebula, Neutron Star, Strange Star, Wormhole, Gravastar and Quasi-Star in the galaxy. **A Solar System** holds the Yellow Star and A Blue World. A Blue World holds Its Moon, and Its Moon holds An Asteroid. **A Quasar Galaxy** (reached from the web and through the Wormhole) holds the Quasar and the Dyson Sphere. Places inside places: `inside` and `through` in `src/content/places.ts`, `bodies` in `src/scene/scenes/shared/orb.tsx`.
- **Sound** (`src/lib/sound.ts`): a loop per scene in `public/music/` (gitignored, cut from `owner/music-library/`), Magical Space as the fallback, warp sounds on every move, nothing before Begin (D-100, D-114 to D-116).
- **Content:** 4 stops and 15 places in `src/content/places.ts`, each line sourced and checked by `npm run check`.

## In Progress

- The replan: every open item below is to be ordered with the owner and written into "Next Steps".

## Next Steps

Not yet ordered. The owner sets the order in the replan session. Open items, by track:

- **Polish the places:** the Moon's craters look stamped and its maria blocky; the Blue World's land is blobby with a blown-out highlight; the Wormhole reads as a ringed planet, not a tunnel.
- **New places:** a starbase and more sci-fi places in the Quasar Galaxy (names from the owner); further levels beyond the universe (a "multiverse", owner's idea).
- **Lines and voice:** rewrite the weakest lines in a vivid "what it is" voice, still sourced and true.
- **Ships:** refine all five, closer to `SHIP_BRIEF.md` and the references. Use Blender `.glb` models when code-built hulls stop being enough. Sovereign looks egg-like from above.
- **Sound:** swells that rise with power at the black hole and the quasar (optional). **Ask the owner in the replan** about the three music folders: `owner/music-library/` (15 source tracks plus `INDEX.json`), `public/music/` (the loops the site plays, gitignored, 55 MB) and `public/sounds/` (Magical Space and the 3 Star Trek effects, in git).
- **Video button (idea, not decided):** a small round button right of Zoom Out that opens a YouTube video for the scene, mostly Kurzgesagt.
- **Tests and health:** the tests are heavy and the machine runs out of memory. Run shots, a11y and fallbacks one at a time. The live `/black-hole` can take past the 30 s settle limit, so raise `sceneSettled` or trim routes. Known failures: the two fallbacks `touch` checks, and drag-hint contrast on `/star`.
- **Owner checks:** look at each new scene on the laptop (`/solar-system`, `/blue-world`, `/moon`, `/asteroid`, `/quasar-galaxy`, `/#supervoid`, `/#universe`). Decide whether arXiv papers are acceptable sources (Wormhole, Gravastar, Quasi-Star). Never measured on real hardware: frame rate (an integrated-GPU laptop and a mid-range phone), and touch and pinch on a real phone.
- **Budgets:** first-load JS on the scene routes is about 145 KB against the 140 KB limit written for routes with no scene (D-047). The owner should confirm that is fine.
- **Phone (for the final pass):** the nebula's dark dust bank fills the lower part of a phone screen.
- **Before deploy:** music licensing (the scene loops and Star Trek effects are copyrighted), the phone polish pass (D-110, only where it costs the laptop nothing), the `NEXT_PUBLIC_SITE_URL` value, and the owner's sign-off before Vercel.

## How to Check

`npm run check`; `npm run build`; then, if a scene changed, `npm run posters` and build again. After that, `npm run shots` (judge the stills against `DESIGN_SPEC.md` section 11), `npm run a11y` and `npm run fallbacks`. Run them one at a time, in the background, with no server or build running, because the machine runs short of memory.

Limits: draw calls on `low` under 30, scene chunks under 40 KB. Tests that need the atlas use `/#atlas`. Under software WebGL, click heavy scenes from inside the page (`locator.evaluate(el => el.click())`). Leave the production server running for the owner (`npx next start -H 0.0.0.0 -p 3000`).

## What the Owner Wants (Their Words)

- "A spectacle site that showcases beauty, not an educational site." A name and one line (at most twelve words, sourced) per view, with names in Title Case.
- Click to travel; wheel and pinch to zoom; one button to zoom out. No drawn lines over the scenery.
- Latest verdict (2026-11-22): "the ships definitely need to be redesigned/refined, but the celestial stuff and its effect and soundscape is coming along nicely."

## Session Log

- **2026-11-22 (cleanup):** Moved the docs to `context/`. Merged `TECHNICAL_DIRECTION.md` into `ARCHITECTURE.md` and the old checklist and roadmap into this tracker. Deleted the night-run brief. Moved the owner's private folders into `owner/` (D-134). Set up `AGENTS.md` as the single rules file.
- **2026-11-22 (evening), D-132 and D-133:** three growing supervoids; A Solar System, A Blue World, Its Moon and An Asteroid; A Quasar Galaxy through the Wormhole; "Growing empty…". Pushed.
- **2026-11-22 (night run, merged), D-125 to D-131:** Wormhole, Gravastar, Quasi-Star, Earth (later A Blue World), Moon, and the Observable Universe as stop 4. The run went 93 of 93 on shots, 25 of 26 on a11y, and 64 of 68 on fallbacks (the touch checks, plus missing music in the cloud container).
- **2026-11-21 to 2026-11-22, D-107 to D-124:** the start page from `Home.png`; the dock header; sound per scene; the five-ship fleet and its redesign; the supervoid as stop 3; the spaceship loader.

### Earlier History

The work ran in three tracks of numbered sessions in the old roadmap:

- **F (Foundation), 2026-11-11 to 2026-11-17:** F0 replan; F1 the look prototype (Syne headline, palette; removed in D-135); F2 Next 16 scaffold and scripts; F3a/b scene system, tiers, governor, fallbacks and the atlas; F4 the content check and Black Holes.
- **O (the reading site), 2026-11-17 to 2026-11-20:** subject pages (Galaxies, Nebulae, Quasars), a journey, Explore polish, and release prep (metadata, OG images, sitemap, a11y).
- **The pivot:** the owner's read-through turned the site into a spectacle (D-092), and most of the O work was removed (D-093 to D-095).
- **S (Spectacle), 2026-11-20 to 2026-11-21:** S1 strip to spectacle, then the owner's notes (sound, deep sky, drag and zoom, the start page); S2 galaxy and web; S3 black hole and quasar; S4 nebula. S5 (owner review, then deploy) is still open and is now part of the plan above.

The full per-item checklist with every test count is in git history (`docs/PHASE_CHECKLIST.md` before 2026-11-22).
