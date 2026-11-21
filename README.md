# Cosmic Archive: The Universe to Look At

A spectacle of the cosmos you click through. Real-time scenes of the cosmic web, a spiral galaxy, a black hole, a nebula and a quasar, with a smooth flight from each one into the next.

**Status:** being polished; not deployed yet. The universe (`/`, three zoom stops) and three places (`/black-hole`, `/nebula`, `/quasar`) are built with the flow between them. Next: making each scene richer. The plan is in `docs/`.

## Ideas that shape it

- **Cosmos alone.** The scenery fills the screen, with nothing drawn over it. Each view has a name and one line.
- **Click to travel.** Pull back from the galaxy to the cosmic web, or click a light to fall into it: the camera dives in, the screen passes through the place's own colour, and the place grows into view.
- **Honest in its few words.** Every line is tied to a checked source; every picture is an illustration.
- **Works without 3D.** Every screen is complete HTML with a still of its scene; the live scenes adapt to the device.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, CSS Modules, three with React Three Fiber. Built with Claude Code.

## Documents

| File | What it covers |
|---|---|
| `docs/PROJECT_BLUEPRINT.md` | Vision, scope, editorial and sourcing rules |
| `docs/DESIGN_SPEC.md` | Visual language, the screen, the flow, screenshot checklist |
| `docs/ARCHITECTURE.md` | Structure, scene system, the flow between scenes, performance budgets |
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
| `npm run check` | Type check, lint and the sourcing check on every line (fast, no build) |
| `npm run build` | Production build (every route is static) |
| `npm run shots` | Starts the built app and screenshots each route at 1440x900, 390x844 and 1440x900 with reduced motion into `screenshots/` |
| `npm run posters` | Renders scene stills into `public/posters/` from the built app's own scenes; build again afterwards |
| `npm run fallbacks` | Runs the scene tests on the built app: reduced motion, no WebGL, slow device, no 3D code on About, every place, the flow between scenes with and without motion, keyboard only and touch only |
| `npm run a11y` | Scans every route with axe-core, wide and on a phone; fails on serious or critical findings |

`npm run shots` uses Playwright's Chromium; run `npx playwright install chromium` once if it is missing.

## Deploying

Set `NEXT_PUBLIC_SITE_URL` to the site's address (for example in Vercel's project settings). Canonical links, Open Graph tags, the sitemap and robots.txt are built from it; without it they point at a placeholder on `cosmic-archive.example`.

All imagery is original illustration. Nothing here is a telescope photograph.
