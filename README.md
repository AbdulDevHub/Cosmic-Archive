# Cosmic Archive: A Living Atlas of the Universe

An immersive, educational atlas of the cosmos. Real-time scenes of galaxies, black holes and the cosmic web, drawn over with a map-maker's fine ink, and science pages where every claim is tied to a checked source.

**Status:** in early development. The plan is in `docs/`; the look is being prototyped in `prototype/look.html`.

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

The app scaffold is not in place yet. Once it is:

```
npm install
npm run dev
```

All imagery is original illustration. Nothing here is a telescope photograph.
