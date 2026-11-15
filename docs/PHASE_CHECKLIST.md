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
- [ ] **Open, for the owner:** first-load JS for `/` is 135 KB gzip against the 130 KB budget. Our own code is under 1 KB; Next 16.4 + React 19.3 alone is about 128 KB and `next/link` adds about 6 KB. See D-030.

## F3a Scene system + the hero galaxy

- [ ] `SceneHost`, `SceneSlot`, registry, store.
- [ ] Tiers and frame-time governor.
- [ ] Poster-first loading; `still` and `static` fallbacks; Pause motion control.
- [ ] Atlas Level 1 (galaxy) at the hero view, linework, vessel and trail.
- [ ] Fallback tests pass (reduced motion, no WebGL, throttled CPU, no three on a no-scene route).
- [ ] Hero screenshots pass the design checklist against `prototype/shots/`.

## F3b Atlas chart, zoom out and Explore

- [ ] Atlas Level 2 (cosmic web) and the zoom between levels.
- [ ] Beacons are real links; list view.
- [ ] `/` wired to scroll through all three stages; `/explore` with free control.
- [ ] Chart and zoom-out screenshots pass the design checklist.

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
