# Cosmic Archive: A Living Atlas of the Universe

An immersive, educational atlas of the cosmos. Real-time scenes of galaxies, black holes and the cosmic web, drawn over with a map-maker's fine ink, and science pages where every claim is tied to a checked source.

**Status:** v1 is built and waiting for the owner's review; not deployed yet. Four subject pages (Black Holes, Galaxies, Nebulae, Quasars), the atlas with its zoom out to the cosmic web, the journey "A star's life", the archive and About. The plan is in `docs/`; the approved look is `prototype/look.html`.

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
| `npm run fallbacks` | Runs the scene fallback tests on the built app: reduced motion, no WebGL, slow device, no 3D code on a page without a scene, every subject page, and the atlas by keyboard only and by touch only |
| `npm run a11y` | Scans every route with axe-core, wide and on a phone; fails on serious or critical findings |

`npm run shots` uses Playwright's Chromium; run `npx playwright install chromium` once if it is missing.

## Deploying

Set `NEXT_PUBLIC_SITE_URL` to the site's address (for example in Vercel's project settings). Canonical links, Open Graph tags, the sitemap and robots.txt are built from it; without it they point at a placeholder on `cosmic-archive.example`.

All imagery is original illustration. Nothing here is a telescope photograph.
