# Cosmic Archive: Technical Direction

**Status:** v2, 2026-11-11; content row updated 2026-11-20 (D-095). The stack is decided; this is no longer a list of preferences. Structure and budgets are in `ARCHITECTURE.md`.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router, static generation | Many addressable content pages, good metadata, one persistent layout for the canvas, Vercel later |
| UI | React 19, TypeScript strict | |
| Package manager | npm | Already installed; nothing here needs more |
| Styling | CSS Modules + CSS variables in `src/styles/tokens.css` (OKLCH) | Full art direction, no theme to fight. No Tailwind, no UI kit |
| 3D | three + @react-three/fiber, WebGL2, GLSL | See below |
| Content | One TypeScript file, `content/places.ts`, checked at build and by `npm run check` | A name and one sourced line per view; MDX and zod were removed with the long-form pages (D-095) |
| Lint | ESLint flat config, run as `eslint .` (`next lint` no longer exists in Next 16) | |
| Fonts | `next/font`, self-hosted | No third-party requests at runtime |
| Screenshots | Playwright (dev dependency) via `npm run shots` | The visual verify loop |

Runtime versions verified 2026-11-11: Node 22.22.3, npm 12.0.2; latest next 16.4.6, react 19.3.1, three 0.187.0, @react-three/fiber 9.8.2. Use the current stable versions at scaffold time and check the Next.js and R3F docs through context7 rather than memory.

## Why three + React Three Fiber, and why now

The original plan deferred all 3D to "Phase 6" and built a static page first. That order is reversed: the scenes are the identity of the site and the part most likely to go wrong, so they are built first, by the strongest model available.

- **R3F over plain three:** scenes mount and unmount with routes, and R3F ties GPU resource disposal to the React lifecycle, which is exactly the load/unload problem this site has.
- **WebGL2 + GLSL over WebGPU/TSL:** runs on every current phone and laptop, headless screenshots work, and the shader code is the most widely documented form.
- **Procedural over image plates:** the atlas downloads no textures. Every scene is points, lines and shaders, so it is original, tiny to ship and scales with device tier.
- **Fallback if R3F conflicts with a future Next release:** the scene system's public surface is `SceneHost`, `SceneSlot` and the registry. Scenes could be reimplemented in plain three behind it without touching pages.

## Dependency rules

- Nothing outside `src/scene/` imports `three` or `@react-three/*`.
- `@react-three/drei`: single-helper imports only, and only when writing the helper by hand would be more code than it saves.
- No post-processing library unless a hand-written half-resolution bloom proves insufficient.
- No state library. The scene store is a small `useSyncExternalStore` module.
- No animation library for DOM. CSS transitions and the scroll position are enough.

## Still deferred (add only when a phase needs it)

| Technology | When |
|---|---|
| Blender, glTF assets | Only if a scene needs a model that cannot be built in code |
| Search library or service | When the archive outgrows a client-side filter |
| Audio | Post-v1, user-initiated only |
| CMS, database, accounts, analytics | Not planned |

## Commands

- `npm run dev` local development.
- `npm run check` type check, lint and content check. Fast, no build. This is the `Verify:` command.
- `npm run build` production build.
- `npm run shots` Playwright screenshots at 1440x900, 390x844 and reduced motion into `screenshots/`.
- `npm run posters` renders each scene's still for the poster-first fallback.
