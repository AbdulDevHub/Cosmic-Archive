# Cosmic Archive: A Living Atlas of the Universe

An immersive, educational atlas of the cosmos. Real-time scenes of galaxies, black holes and the cosmic web, drawn over with a map-maker's fine ink, and science pages where every claim is tied to a checked source.

**Status:** in early development. The plan is in `docs/`; the approved look is `prototype/look.html`. The app scaffold, header and hero copy are in place; the scenes are next.

## Ideas that shape it

- **Cosmos plus ink.** Luminous stylised scenery with hairline orbits, ticks and labels over it, like a star chart that came alive.
- **The atlas is a scale ladder.** Start at a galaxy, zoom out, and it becomes one point of light in the cosmic web.
- **Evidence is drawn.** Solid lines for what has been observed, dashed and dotted for what has not.
- **Works without 3D.** Every page is complete HTML; scenes are an enhancement that adapts to the device.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, CSS Modules, three with React Three Fiber, MDX content. Built with Claude Code.

## Documents

| File | What it covers |
|---|---|
| `docs/PROJECT_BLUEPRINT.md` | Vision, scope, editorial and sourcing rules |
| `docs/DESIGN_SPEC.md` | Visual language, homepage, screenshot checklist |
| `docs/ARCHITECTURE.md` | Structure, scene system, performance budgets, content model |
| `docs/PHASED_ROADMAP.md` | Order of work, one session per item |
| `docs/DECISIONS.md` | Why things are the way they are |
| `docs/CONTENT_CATALOGUE.md` | Idea bank of future topics |

## Running it

Needs Node 20.9 or newer. `npm run dev` serves the site at http://localhost:3000.

```
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run check` | Type check and lint (fast, no build) |
| `npm run build` | Production build (every route is static) |
| `npm run shots` | Starts the built app and screenshots each route at 1440x900, 390x844 and 1440x900 with reduced motion into `screenshots/` |
| `npm run posters` | Renders scene stills into `public/posters/` from the built app's own scenes; build again afterwards |
| `npm run fallbacks` | Runs the scene fallback tests on the built app: reduced motion, no WebGL, slow device, no 3D code on a page without a scene |

`npm run shots` uses Playwright's Chromium; run `npx playwright install chromium` once if it is missing.

All imagery is original illustration. Nothing here is a telescope photograph.
