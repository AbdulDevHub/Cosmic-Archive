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

- [ ] `prototype/look.html` shows the hero, the chart and the zoom out.
- [ ] Headless WebGL screenshots work (1440x900, 390x844).
- [ ] Owner approved the look.
- [ ] Tokens in `DESIGN_SPEC.md` corrected to match.

## F2 Scaffold

- [ ] Next 16 app, TypeScript strict, ESLint flat config.
- [ ] Folder boundaries from `ARCHITECTURE.md` in place.
- [ ] `tokens.css`, fonts, header and footer shell.
- [ ] `check`, `shots`, `posters` scripts.
- [ ] `npm run check` and `npm run build` pass.

## F3 Scene system + atlas

- [ ] `SceneHost`, `SceneSlot`, registry, store.
- [ ] Tiers and frame-time governor.
- [ ] Poster-first loading; `still` and `static` fallbacks; Pause motion control.
- [ ] Atlas Level 1 (galaxy), linework, vessel and trail.
- [ ] Atlas Level 2 (cosmic web) and the zoom between levels.
- [ ] Beacons are real links; list view.
- [ ] `/` hero wired to scroll; `/explore` with free control.
- [ ] Fallback tests pass (reduced motion, no WebGL, throttled CPU, no three on a no-scene route).
- [ ] Screenshots pass the design checklist.

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
