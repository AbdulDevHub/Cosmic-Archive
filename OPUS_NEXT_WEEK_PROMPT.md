# Cosmic Archive: prompt for the next Opus session

**Last updated:** 2026-11-21, after S1b (fuller, with sound). Keep this file current: after every commit, update "What exists" and rewrite "Your session" for the next roadmap item.

You are Claude Opus 5.5, continuing Cosmic Archive. You have no memory of earlier sessions. Everything you need is in this file and the docs it names.

## What this is

The universe to look at: a Next.js site of real-time WebGL scenes a visitor clicks through, from the cosmic web into a spiral galaxy, then into a black hole, a nebula or a quasar, each move a smooth flight. It was built as an educational atlas (sessions F0 to O7); at the read-through the owner turned it into a spectacle (D-092): almost no words, no ink, click to travel. You make it beautiful. You do not bring the words or the ink back.

## What exists

| Commit | Contents |
|---|---|
| `15e3478` to `43c7b2b` | F0 to O7: the educational atlas (history; much of it removed in S1) |
| `08a09ca` | S1: `content/places.ts` (three stops, three places, sourced one-liners); `/` with three zoom stops and hotspots, `/black-hole`, `/nebula`, `/quasar`, `/about`; ink, vessel, MDX, subject pages, journey and archive removed; the flow between scenes (`src/scene/host/flow.ts`, `src/components/screen/Veil.tsx`); shots (36), fallbacks (35, with the flow, keyboard and touch), a11y (10) |
| latest (`git log -1`) | S1b: About and Pause motion removed (motion follows the device); sound (the owner's "Magical Space" and Web Audio whooshes, `src/lib/sound.ts`); the deep sky behind every scene, its clouds baked into a cube texture (`src/scene/sky.ts`, `src/scene/shaders/sky.glsl.ts`); Closer and Further, drag and pinch in places (into the quasar 14x); a grab cursor and a one-time drag hint (D-099 to D-102) |

`prototype/look.html` still holds the approved palette and galaxy, with ink and a vessel that are no longer used. Read `src/scene/README.md` before touching a scene. Nothing has been pushed or deployed.

## Read first, in this order

1. `CLAUDE.md`
2. `docs/PHASE_CHECKLIST.md`
3. `docs/DESIGN_SPEC.md` (section 2 bans, section 7 the screen and the flow, section 10 what is open, section 11 screenshot checklist)
4. `docs/ARCHITECTURE.md` (section 3 the scene system and the flow, section 4 the atlas)
5. `docs/DECISIONS.md` from D-092 on; skim the rest

## Rules you must not change

1. **Cosmos alone.** Nothing drawn over the scenery. Syne for display with Hanken Grotesk for text, one UI accent (`--beacon`). The bans in `DESIGN_SPEC.md` section 2 are absolute.
2. **Spectacle, not text.** A name and one line per view, at most twelve words, each line sourced in `content/places.ts`.
3. **Click to travel, smooth flow.** Do not add scrolling pages, hard cuts or spinners; keep dive, veil, arrive.
4. **The architecture boundaries.** Only `src/scene/` imports three. Pages use `<SceneSlot>`, the store and the flow. One persistent canvas.
5. **The budgets** in `ARCHITECTURE.md` section 3. A richer scene still fits them on `low`.
6. **Scope.** One session from the roadmap, then stop and report.

If one of these seems wrong, do not work around it. Say so in your report and leave it for the owner.

## Your session: S2, Galaxy and cosmic web

**Before anything else:** ask the owner what they noticed when they clicked through S1 on their own laptop and phone. Their notes come first.

**Scope (atlas scene only, `src/scene/scenes/atlas/`):**

- Richer colour from core to arms; pink star-forming knots and blue young clusters along the arms; layered dust that reads as depth.
- The disc itself denser between the arms, as the owner's reference images are (`reference images/`, not in git: look at them, copy none of their ships, planets or lines).
- A light bloom of our own (half resolution, no new dependency) only if the layers alone cannot reach the look; measure its cost.
- A deeper, glowing cosmic web; the phone's web is thin on `low` (DESIGN_SPEC section 10).
- The dive through the disc: stars near the camera grow into large soft discs; make the flight through them finer.
- Re-render posters and share images (`npm run posters`, then build again).

**Checks:** `npm run check`, `npm run build`, `npm run shots` (look at every still against section 11), `npm run fallbacks`, `npm run a11y`; draw calls on `low` under 30; the atlas chunk under 40 KB. Film a dive (Playwright, a frame every 250 ms) and look at it.

**Stop point:** the owner's look at the new galaxy. Then commit, tick S2, rewrite this section for S3, report.

## Self-review before you report

1. `DESIGN_SPEC.md` section 11, all nine questions, on every screenshot.
2. Did anything outside `src/scene/` import three?
3. Does every screen work with WebGL off and with reduced motion on? Did you test it or assume it?
4. Is every line still tied to a source you or an earlier session fetched?
5. Did you stay inside one roadmap session? List anything you were tempted to add and did not.
6. Are `PHASE_CHECKLIST.md`, `DECISIONS.md` and this file updated, and is the work committed (gitmoji style, no push)?

## Report format

What you built; files changed; checks run with their actual results; what the owner should look at; known problems; the next session. Ten lines or fewer.
