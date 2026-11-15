# src/scene

Everything WebGL lives here, and only here. Nothing outside this folder imports `three` or `@react-three/*` (`docs/ARCHITECTURE.md` section 1).

Empty until F3a. Planned layout (`docs/ARCHITECTURE.md` sections 3 to 5):

| Folder | Holds |
|---|---|
| `host/` | `SceneHost` (the one persistent canvas), `SceneSlot` (what pages render), the registry, the store |
| `quality/` | device tier detection and the frame-time governor |
| `scenes/atlas/` | the galaxy and cosmic-web scene, ported from `prototype/look.html` |
| `scenes/black-hole/` | the Black Holes subject scene (F4) |
| `shaders/` | shared GLSL chunks as `.glsl.ts` template strings |

The "Pause motion" preference already exists in `src/lib/motion.ts`; the store should read it through `getMotion` and `subscribeMotion` rather than keep its own copy.
