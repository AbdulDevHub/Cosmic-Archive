# Cosmic Archive: The Universe to Look At

A spectacle of the cosmos you click through: real-time scenes from a spiral galaxy out to the observable universe, and down into the strange places inside them, each move a smooth flight.

## Project Overview

Cosmic Archive is a website for looking at the universe rather than reading about it. You pick a spaceship on the start page, press Begin, and fly into a galaxy. From there you click a glowing point to dive into what it marks (a black hole, a nebula, a neutron star, a solar system with its own planet, moon and asteroid) or press Zoom Out to pull back through the cosmic web, the empty supervoids and finally the whole observable universe. A wormhole leads to a second, stranger galaxy with a quasar, a Dyson sphere and a Starbase, a turning wheel station whose glowing bays open onto big ideas: a warp drive, programmable matter, higher dimensions, quantum foam, quarks, vacuum decay and bubble universes. The Flights menu flies you through a star's whole life, from a black hole to a quasar, or on a hands-off tour you can skip at any time.

Every scene is drawn live in the browser with WebGL shaders, with no photos or downloaded images, so it stays original and small. Each view has only a name and one short line, and every line is checked against a real source. Each scene has its own music. If 3D can't run, every page still shows a still image and works as plain HTML.

**Status:** being polished; not deployed yet. 4 zoom levels, 33 places, two guided flights and a hands-off tour are built. What's next is in `context/PROGRESS_TRACKER.md`.

## Ideas That Shape It

- **Cosmos alone.** The scenery fills the screen, with nothing drawn over it. Each view has a name and one line.
- **Click to travel.** Pull back from the galaxy to the cosmic web, or click a light to fall into it: the camera dives in, the screen passes through the place's own colour, and the place grows into view.
- **Honest in its few words.** Every line is tied to a checked source; every picture is an illustration.
- **Look around and listen.** Drag to turn a scene, use the wheel to zoom, and hear music and a whoosh on every flight.
- **Works without 3D.** Every screen is complete HTML with a still of its scene; the live scenes adapt to the device.

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, CSS Modules, three with React Three Fiber. Built with Claude Code.

## Documents

| File | What it covers |
|---|---|
| `AGENTS.md` | Rules for AI coding agents (`CLAUDE.md` imports it) |
| `context/PROGRESS_TRACKER.md` | Where the work stands, the plan, the session log |
| `context/BLUEPRINT.md` | Vision, scope, editorial and sourcing rules |
| `context/DESIGN_SPEC.md` | Visual language, each screen, the flow, the screenshot checklist |
| `context/ARCHITECTURE.md` | Stack, structure, scene system, performance budgets |
| `context/DECISIONS.md` | Why things are the way they are |
| `context/SHIP_BRIEF.md` | The design brief for the five ships |
| `context/IDEAS.md` | Idea bank of future places |

## Running It

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
| `npm run fallbacks` | Runs the scene tests on the built app: reduced motion, no WebGL, slow device, no 3D code on the 404 page, every place, the flow between scenes with and without motion, keyboard only and touch only |
| `npm run a11y` | Scans every route with axe-core, wide and on a phone; fails on serious or critical findings |

`npm run shots` uses Playwright's Chromium; run `npx playwright install chromium` once if it is missing.

## Deploying

Set `NEXT_PUBLIC_SITE_URL` to the site's address (for example in Vercel's project settings). Canonical links, Open Graph tags, the sitemap and robots.txt are built from it; without it they point at a placeholder on `cosmic-archive.example`.

All imagery is original illustration. Nothing here is a telescope photograph.
