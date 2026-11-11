# Cosmic Archive: Architecture

**Status:** v1, 2026-11-11. Sections marked *(planned)* describe the design before it is built; remove the mark when the code exists and matches.

## 1. Shape of the app

A statically generated Next.js site. Every page is complete server-rendered HTML. One WebGL canvas sits behind the page and shows whichever scene the current route asks for. Pages without a scene never download any 3D code.

```
content/                 MDX subjects, typed data (destinations, journeys)
prototype/               look.html and its screenshots: the approved look
public/posters/          stills rendered from our own scenes
scripts/                 check-content, shots, posters
src/
  app/                   routes and layouts (server components by default)
  components/            DOM UI, CSS Modules
  lib/content/           loads and validates content/
  scene/                 everything WebGL (the only place three is imported)
    host/                SceneHost, SceneSlot, store, registry
    quality/             device tier, frame-time governor
    scenes/atlas/        the galaxy and cosmic-web scene
    scenes/black-hole/   the Black Holes subject scene
    shaders/             shared GLSL chunks
  styles/tokens.css      colour, type, spacing, motion tokens
```

### Boundaries (do not cross)

1. Nothing outside `src/scene/` imports `three` or `@react-three/*`.
2. Pages talk to the scene system only through `<SceneSlot>` and the store's public functions.
3. Scenes never import from `src/app/` or `src/components/`. Data a scene needs (destinations) comes in as props from `content/`.
4. Content files hold no layout or styling. Components hold no facts.

## 2. Routes

| Route | Scene | Status |
|---|---|---|
| `/` | `atlas`, scroll-driven | this week |
| `/explore` | `atlas`, free control | this week |
| `/subjects/[slug]` | per subject (`black-hole` first) | this week: `black-holes` |
| `/archive` | none | Opus |
| `/journeys/[slug]` | none in v1 | Opus |
| `/about` | none | Opus |

All routes are static (`generateStaticParams` for dynamic segments). No server runtime, no API routes.

## 3. Scene system *(planned)*

### 3.1 Parts

- **`SceneHost`** (client, in the root layout). Owns one fixed, full-viewport canvas behind the page. Created once per visit, so there is one WebGL context and no context churn between routes. Loaded with `next/dynamic` and `ssr: false`, and only after a slot registers.
- **`SceneSlot`** (client, tiny, no three import). A page renders `<SceneSlot id="atlas" mode="hero" poster="/posters/atlas-hero.avif" />`. It renders the poster `<img>` (server HTML, the LCP element), registers the request with the store on mount and withdraws it on unmount.
- **Registry.** `id` to `() => import('./scenes/atlas')`. Each scene module exports its component and its budget. Adding a scene is one registry line and one folder.
- **Store.** A small `useSyncExternalStore` module: active slot, tier, paused flag, scene inputs (zoom, pointer), and outputs the DOM needs (projected beacon positions).

### 3.2 Lifecycle

1. Server HTML arrives with the poster visible. No 3D code has been requested.
2. After first paint, if the tier is not `static`, the host chunk and the scene chunk load.
3. The scene renders its first frame; the canvas fades in over the poster (300 ms).
4. On navigation, the outgoing slot withdraws. The canvas fades to `--space`, the scene unmounts, and its geometries, materials and render targets are disposed. If the next route has a slot, its scene loads and fades in; otherwise the render loop stops and the canvas is hidden.
5. On WebGL context loss the host shows the poster and tries one restore.

### 3.3 Time and stills

Scene time is a value passed in, never read from a clock inside a scene. That gives three things from one mechanism:

- `?shot=1&t=12` renders exactly one deterministic frame, for screenshots.
- `npm run posters` uses the same switch to render the stills in `public/posters/`.
- Reduced motion and "Pause motion" hold time still and render on demand only.

### 3.4 Quality tiers

| Tier | Chosen when | Pixel budget | Galaxy / web particles | Glow |
|---|---|---|---|---|
| `static` | no WebGL2, `Save-Data`, or the governor gave up | poster only | 0 | n/a |
| `still` | `prefers-reduced-motion` or motion paused | one frame, no loop | as the tier below | as below |
| `low` | touch and small screen, or 4 cores or fewer, or 4 GB or less | 1.2 MP | 40k / 15k | additive sprites only |
| `medium` | default | 2.3 MP | 90k / 35k | half-resolution bloom |
| `high` | only after measured headroom on `medium` | 4 MP | 160k / 60k | half-resolution bloom |

The pixel budget sets the canvas resolution (`dpr = sqrt(budget / cssPixels)`, capped at the device ratio), so a large monitor and a phone are held to the same cost.

### 3.5 Frame-time governor

- Keeps a rolling average of frame time.
- Over 20 ms for 2 s: step down one notch. Order: pixels, then particle count, then glow.
- Under 12 ms for 5 s on `medium`: step up to `high`, once per visit.
- Over 33 ms on `low` for 2 s: switch to `static` and stop the loop.
- The chosen tier is remembered for the session.

### 3.6 Render-loop rules

- The loop runs only while a slot is mounted, on screen (IntersectionObserver), the tab is visible, and motion is not paused.
- Per scene: fewer than 30 draw calls, no shadows, no real-time lights (all materials are unlit custom shaders), no texture downloads for the atlas.
- Particle attributes are built once on a tier change, never per frame. Animation happens in the vertex shader from the time uniform.

### 3.7 Bundle budgets

| What | Budget (gzip) |
|---|---|
| First-load JS on a route with no scene | 130 KB |
| Host + three + R3F chunk | 220 KB |
| One scene's own chunk | 40 KB |

Targets: 60 fps on `medium` on an integrated-GPU laptop; 30 fps floor on `low` on a mid-range phone; LCP under 2.5 s on 4G (the poster); CLS 0 (the canvas is fixed).

## 4. Atlas scene *(planned)*

- **Levels.** `levels[]`, each with its own particle system and scale. Level 1: a spiral galaxy (points with a custom shader: warm core, coloured arms, dust lanes, differential rotation in the vertex shader). Level 2: the cosmic web (points along noise filaments; Level 1 collapses into one of them).
- **One zoom scalar.** `zoom` in [0, 2]: 0 hero angle, 1 chart angle on Level 1, 2 Level 2. It drives the camera rig and the cross-fade between levels. On `/` it comes from scroll position through the store; on `/explore` from wheel, pinch, drag and keys. Adding a level means adding an entry and extending the range.
- **Linework.** Rings, ticks and dashed lines drawn as screen-space quads so they stay one device pixel wide. Dash pattern is a uniform taken from the evidence status.
- **Vessel and trail.** A tiny mesh built in code and a ribbon whose alpha fades along its length. On the hero the trail's far end joins the outer ring.
- **Beacons are links.** `content/destinations.ts` lists `{ id, level, position | marginSlot, evidence, href, label }`. The scene projects each position every frame and writes it to the store; a DOM layer positions real `<a>` elements with transforms. Off-level beacons are hidden and removed from the tab order. The canvas is `aria-hidden`. A list view renders the same data as plain links.

## 5. Shaders

- GLSL lives in template strings in `.glsl.ts` files, so no bundler loader is needed.
- Shared chunks in `src/scene/shaders/`: hash and noise, palette, soft point sprite, screen-space line.
- Each scene keeps its own shaders in its folder and composes the shared chunks by string interpolation.
- The black-hole scene is a single full-screen quad: ray bending around a sphere, a stylised accretion disc with a brighter approaching side, a background of the shared star field.

## 6. Content model *(planned)*

`content/subjects/<slug>.mdx`. Frontmatter, validated with zod at build and by `npm run check`:

```yaml
id: black-holes
title: Black Holes
hook: Where gravity reshapes space and time.
category: cosmic-extremes
status: observed            # page-level evidence status
scene: black-hole           # registry id, optional
palette: [gold, ember, violet]
related: [quasars, galaxies]
journeys: [a-stars-life]
lastReviewed: 2026-11-13
sources:
  - id: eht-2019-m87
    title: "..."
    publisher: "..."
    url: "https://..."
    checked: 2026-11-13
observations:               # linked, never embedded
  - label: "..."
    url: "https://..."
```

Body components: `<Claim source="id">`, `<Evidence status="hypothetical">`, `<Diagram name="...">`, `<Unknowns>`.

`scripts/check-content.mjs` fails when: a `<Claim>` names a source id that is not in the frontmatter; a source lacks `checked`; a `related` or `journeys` id does not resolve; a `scene` id is not in the registry.

Other data: `content/destinations.ts` (atlas beacons), `content/journeys/*.ts` (ordered stops with the reason each leads to the next).

## 7. Accessibility and SEO

- All meaning is in the DOM. The scene adds nothing a screen reader needs.
- "Pause motion" in the header, persisted in `localStorage`, satisfies WCAG 2.2.2. Reduced motion defaults it to paused.
- Focus order follows the DOM. Focusing a beacon may ease the camera toward it; it never moves focus.
- Each route sets its own title, description and canonical URL. OG images come from the posters. Sitemap, robots and JSON-LD are added in the release-prep session.

## 8. Verification

- `Verify: npm run check` (type check, lint, content check; under 60 s, no build).
- `Verify-full: npm run build && npm run shots`.
- Scene changes are checked by looking at `screenshots/` against `prototype/shots/` using the checklist in `DESIGN_SPEC.md` section 10.
- Fallbacks are tested, not assumed: reduced-motion emulation (no loop), WebGL disabled (poster, page complete), CPU throttling (governor steps down), and a cold load of a no-scene route (no three request).
