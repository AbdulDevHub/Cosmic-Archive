# src/scene

Everything WebGL lives here, and only here. Nothing outside this folder imports `three` or `@react-three/*` (`context/ARCHITECTURE.md` section 1).

| Folder | Holds |
|---|---|
| `host/` | `SceneHostLoader` (in the root layout, no three), `SceneHost` (the one persistent canvas), `SceneSlot` (what pages render), the registry, the store, the flow between scenes (`flow.ts`, no three), the URL switches |
| `quality/` | device tier detection and the frame-time governor (no three) |
| `scenes/atlas/` | the galaxy and the cosmic web, ported from `prototype/look.html`: `model.ts` (particle data, no three), `world.ts` (three objects, the anchors hotspots stand on), `camera.ts` (the zoom rig and the dive) |
| `scenes/black-hole/` | the black hole |
| `scenes/quasar/` | the quasar: the black-hole shader with `QUASAR` defined, seen from far off, with jets and a host galaxy |
| `scenes/nebula/` | the nebula: one shader, a star-forming cloud |
| `shaders/` | shared GLSL chunks as `.glsl.ts` template strings |

## How a page gets a scene

```tsx
<SceneSlot id="nebula" mode="place" posters={{ wide: "/posters/nebula-wide.webp", narrow: "/posters/nebula-narrow.webp" }} />
```

Put it inside a positioned box that does not make a stacking context (absolute, not fixed: D-097), or the poster paints over the canvas. The poster is in the server HTML; the canvas fades in over it once the first frame is drawn. Pages without a slot never download 3D code.

A place scene reads `view.arrive` (0 small and far off, 1 whole) each frame; the atlas reads `view.focus` and `view.dive`. The flow (`flow.ts`) drives them; see ARCHITECTURE.md 3.3.

## Adding a scene

1. A folder in `scenes/` whose `index.tsx` default-exports a component taking `SceneProps` and exports a `budget`.
2. One line in `host/registry.ts`, and the id in `SceneId` (`host/store.ts`).
3. A poster entry in `scripts/posters.mjs`.

Scenes never read a clock: time and the view come in as boxes the host writes each frame. Nothing is drawn over the scenery (D-094).

## URL switches

| Switch | Effect |
|---|---|
| `?shot=1` | one frame, no loop, no fade, no flow (screenshots and posters) |
| `?zoom=1` | with `shot`: hold the atlas at a stop (0 close in, 1 the galaxy, 2 the web) |
| `?t=12` | scene time for that frame (with `shot`) |
| `?tier=low`, `medium`, `high` or `static` | force a quality and keep it (the governor is off) |

`<html data-scene>` is `ready` once a frame is on screen, or `static` when the page stays on the poster. `data-scene-quality` is the governor's rung (0 high to 4) or `static`.

## Scripts (all need `npm run build` first)

- `npm run posters` renders `public/posters/` from the scenes themselves. Build again afterwards.
- `npm run shots` writes `screenshots/`: each stop and place, as a visitor gets it and as a still.
- `npm run fallbacks` runs the fallback and flow tests: reduced motion, no WebGL, slow device, no 3D code on the 404 page, every place, the flow with and without motion, keyboard and touch.
