# Cosmic Archive: Phase Checklist

Tick an item only when it is implemented and verified. Sessions are defined in `PHASED_ROADMAP.md`.

## F0 Re-plan

- [x] Docs read, blind spots listed, owner interviewed (5 questions).
- [x] Plan approved by the owner.
- [x] Git repository created; original docs snapshotted (`15e3478`).
- [x] Blueprint, technical direction, roadmap, design spec rewritten; architecture written.
- [x] Decisions D-011 to D-025 recorded.
- [x] `CLAUDE.md` rewritten; `README.md` added.
- [x] First draft of `OPUS_NEXT_WEEK_PROMPT.md`.

## F1 Look prototype

- [x] `prototype/look.html` shows the hero, the chart and the zoom out (`?stage=0|1|2`, `?t=` fixes time; scroll drives the zoom without the switches).
- [x] Headless WebGL screenshots work (1440x900, 390x844); six stills in `prototype/shots/`. No console errors.
- [x] Second round from the owner's notes: sans headline face (Jost, with Syne as the alternative), redrawn hero actions, bigger and fuller galaxy. Stills re-shot; `font-options.png` and `desktop-stage0-syne.png` added.
- [x] Owner approved the look and picked the headline face: Syne (2026-11-11). Stills re-shot in Syne.
- [x] Tokens and type in `DESIGN_SPEC.md` corrected to match and locked.

Fable's part ends here (D-028). Everything below is built by Opus.

## F2 Scaffold

- [x] Next 16 app (16.4.6, React 19.3), TypeScript strict, ESLint flat config.
- [x] Folder boundaries from `ARCHITECTURE.md` in place (`src/scene/` holds only a README).
- [x] `tokens.css`, fonts, header and footer shell; hero copy and both actions; `/about` stub.
- [x] `check`, `shots`, `posters` scripts.
- [x] `npm run check` and `npm run build` pass; `npm run shots` writes three screenshots with no console errors (2026-11-14).
- [x] Hero copy, header and actions line up with `prototype/shots/*-stage0.png`; reduced motion stills the dot; hover fills the ring; focus rings show; Pause persists across reloads (Playwright, 2026-11-14).
- [x] First-load JS for `/` is 135 KB gzip, inside the 140 KB budget the owner set after F2 (D-033).

## F3a Scene system + the hero galaxy

- [x] `SceneHost`, `SceneSlot`, registry, store.
- [x] Tiers and frame-time governor.
- [x] Poster-first loading; `still` and `static` fallbacks; Pause motion control.
- [x] Atlas Level 1 (galaxy) at the hero view, linework, vessel and trail.
- [x] Fallback tests pass (reduced motion, no WebGL, throttled CPU, no three on a no-scene route): `npm run fallbacks`, 14 of 14 including going to another page and back (2026-11-16).
- [x] Hero screenshots pass the design checklist against `prototype/shots/` (`screenshots/home-still-desktop.png` and `home-still-phone.png`, 2026-11-16).
- [x] Budgets measured (gzip): first load 138.3 KB for `/` and 137.8 KB for `/about` (limit 140); host + three + R3F 185 KB (220); atlas chunk 11 KB (40); 19 draw calls a frame (30).
- [ ] Not yet measured on real hardware: frame rate on an integrated-GPU laptop and on a mid-range phone. The automated runs use software WebGL, which only proves the governor reacts.

## F3b Atlas chart, zoom out and Explore

- [x] Atlas Level 2 (cosmic web) and the zoom between levels.
- [x] Beacons are real links; list view. Every beacon points at `/about` until its subject page exists (D-044).
- [x] `/` wired to scroll through all three stages; `/explore` with free control (wheel, drag, + and - keys, arrow keys, two step buttons).
- [x] Chart and zoom-out screenshots pass the design checklist against `prototype/shots/` (`screenshots/chart-still-*`, `web-still-*`, `explore-still-*`; `npm run shots` 21 of 21, 2026-11-17).
- [x] Labels checked in motion at 1440x900, 1024x700 and 390x844: steady while the disc turns (one small move in 30 s), on screen and off the copy after turning, zooming and scrolling. Still rough: between the chart and the web (zoom about 1.3) the fading labels crowd the small galaxy.
- [x] `npm run fallbacks` 14 of 14; 20 draw calls a frame (limit 30).
- [x] Budgets measured (gzip, 2026-11-17): `/about` first load 138.1 KB (limit 140); host + three + R3F 183 KB (220); atlas chunk 13.4 KB (40).
- [ ] For the owner: first-load JS on the two scene routes is now 144.7 KB (`/`) and 145.1 KB (`/explore`), up from 138.3 KB, because the beacons and their label placement are page code. The 140 KB limit is written for routes with no scene (D-047).
- [ ] Not yet tried on real hardware: touch on `/explore` (a sideways drag only; the rest is O6), frame rate (as F3a).

## F4 Content model + Black Holes

- [ ] MDX pipeline with validated frontmatter.
- [ ] `check-content` fails on a missing source.
- [ ] Subject page framework components.
- [ ] Black-hole scene within budget on `low`.
- [ ] Black Holes copy written from fetched sources.
- [ ] Owner has read the copy.

## Opus sessions

- [ ] O1 Homepage lower half, About, Archive index.
- [ ] O2 Galaxies.
- [ ] O3 Nebulae.
- [ ] O4 Quasars.
- [ ] O5 Journey: A star's life.
- [ ] O6 Explore polish.
- [ ] O7 Release prep.
- [ ] O8 Owner review, then deploy.
