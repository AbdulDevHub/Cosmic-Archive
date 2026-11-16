# src/scene

Everything WebGL lives here, and only here. Nothing outside this folder imports `three` or `@react-three/*` (`docs/ARCHITECTURE.md` section 1).

| Folder | Holds |
|---|---|
| `host/` | `SceneHostLoader` (in the root layout, no three), `SceneHost` (the one persistent canvas), `SceneSlot` (what pages render), the registry, the store, the URL switches |
| `quality/` | device tier detection and the frame-time governor (no three) |
| `scenes/atlas/` | the galaxy, ported from `prototype/look.html`: `model.ts` (particle data, no three), `world.ts` (three objects), `camera.ts` (the zoom rig). The cosmic web arrives in F3b |
| `scenes/black-hole/` | the Black Holes subject scene (F4) |
| `shaders/` | shared GLSL chunks as `.glsl.ts` template strings |

## How a page gets a scene

```tsx
<SceneSlot id="atlas" mode="hero" posters={{ wide: "/posters/atlas-hero-wide.webp", narrow: "/posters/atlas-hero-narrow.webp" }} />
```

Put it inside a positioned section. The poster is in the server HTML; the canvas fades in over it once the first frame is drawn. Pages without a slot never download 3D code.

## Adding a scene

1. A folder in `scenes/` whose `index.tsx` default-exports a component taking `SceneProps` and exports a `budget`.
2. One line in `host/registry.ts`, and the id in `SceneId` (`host/store.ts`).
3. A poster entry in `scripts/posters.mjs`.

Scenes never read a clock: time and zoom come in as boxes the host writes each frame.

## URL switches

| Switch | Effect |
|---|---|
| `?shot=1` | one frame, no loop, no fade (screenshots and posters) |
| `?t=12` | scene time for that frame (with `shot`) |
| `?tier=low`, `medium`, `high` or `static` | force a quality and keep it (the governor is off) |

`<html data-scene>` is `ready` once a frame is on screen, or `static` when the page stays on the poster. `data-scene-quality` is the governor's rung (0 high to 4) or `static`.

## Scripts (all need `npm run build` first)

- `npm run posters` renders `public/posters/` from the scenes themselves. Build again afterwards.
- `npm run shots` writes `screenshots/`; hold `home-still-*.png` beside `prototype/shots/`.
- `npm run fallbacks` runs the fallback tests: reduced motion, no WebGL, slow device, no 3D code on a no-scene route.
