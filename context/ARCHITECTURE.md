# Cosmic Atlas: Architecture

> **What this file is:** how the site is built: the stack, folder boundaries, the scene system, budgets, the content model and how it is verified. Read it before touching `src/scene/`, adding a dependency or changing a budget. Update it when the structure changes; record why in `DECISIONS.md`. Budgets in section 3.9 are limits, not targets.

**Status:** v2, 2026-11-20; S1b 2026-11-21 (D-099 to D-102). Updated for the spectacle direction (D-092 to D-097): one screen per scene, click-to-zoom, the flow between scenes, no ink, no MDX. The scene system (section 3) and its budgets are unchanged from v1.

## 0. Stack and dependencies

Merged in from the former `TECHNICAL_DIRECTION.md` (v2, 2026-11-11; content row 2026-11-20, D-095). The stack is decided.

### 0.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router, static generation | Many addressable content pages, good metadata, one persistent layout for the canvas, Vercel later |
| UI | React 19, TypeScript strict | |
| Package manager | npm | Already installed; nothing here needs more |
| Styling | CSS Modules + CSS variables in `src/styles/tokens.css` (OKLCH) | Full art direction, no theme to fight. No Tailwind, no UI kit |
| 3D | three + @react-three/fiber, WebGL2, GLSL | See below |
| Content | One TypeScript file, `src/content/places.ts`, checked at build and by `npm run check` | A name and one sourced line per view; MDX and zod were removed with the long-form pages (D-095) |
| Lint | ESLint flat config, run as `eslint .` (`next lint` no longer exists in Next 16) | |
| Fonts | `next/font`, self-hosted | No third-party requests at runtime |
| Screenshots | Playwright (dev dependency) via `npm run shots` | The visual verify loop |

Runtime versions verified 2026-11-11: Node 22.22.3, npm 12.0.2; latest next 16.4.6, react 19.3.1, three 0.187.0, @react-three/fiber 9.8.2. Use the current stable versions at scaffold time and check the Next.js and R3F docs through context7 rather than memory.

### 0.2 Why three + React Three Fiber, and why now

The original plan deferred all 3D to "Phase 6" and built a static page first. That order is reversed: the scenes are the identity of the site and the part most likely to go wrong, so they are built first, by the strongest model available.

- **R3F over plain three:** scenes mount and unmount with routes, and R3F ties GPU resource disposal to the React lifecycle, which is exactly the load/unload problem this site has.
- **WebGL2 + GLSL over WebGPU/TSL:** runs on every current phone and laptop, headless screenshots work, and the shader code is the most widely documented form.
- **Procedural over image plates:** the atlas downloads no textures. Every scene is points, lines and shaders, so it is original, tiny to ship and scales with device tier.
- **Fallback if R3F conflicts with a future Next release:** the scene system's public surface is `SceneHost`, `SceneSlot` and the registry. Scenes could be reimplemented in plain three behind it without touching pages.

### 0.3 Dependency rules

- Nothing outside `src/scene/` imports `three` or `@react-three/*`.
- `@react-three/drei`: single-helper imports only, and only when writing the helper by hand would be more code than it saves.
- No post-processing library unless a hand-written half-resolution bloom proves insufficient.
- No state library. The scene store is a small `useSyncExternalStore` module.
- No animation library for DOM. CSS transitions and the scroll position are enough.

### 0.4 Still deferred (add only when a phase needs it)

| Technology | When |
|---|---|
| Blender, glTF assets | Only if a scene needs a model that cannot be built in code |
| Search library or service | When the archive outgrows a client-side filter |
| Audio | Post-v1, user-initiated only |
| CMS, database, accounts, analytics | Not planned |

### 0.5 Commands

- `npm run dev` local development.
- `npm run check` type check, lint and content check. Fast, no build. This is the `Verify:` command.
- `npm run build` production build.
- `npm run shots` Playwright screenshots at 1440x900, 390x844 and reduced motion into `screenshots/`.
- `npm run posters` renders each scene's still for the poster-first fallback.

## 1. Shape of the app

A statically generated Next.js site. Every screen is complete server-rendered HTML: the poster, a name, one line and real links. One WebGL canvas sits behind the page and shows whichever scene the current route asks for. Pages without a scene never download any 3D code.

```
src/content/places.ts    the stops, the places, their lines and sources (facts only)
public/posters/          stills rendered from our own scenes; public/og/ share images
scripts/                 check-content, shots, posters, fallbacks, a11y
src/
  app/                   routes and layouts (server components by default)
  components/screen/     the screen: AtlasView, PlaceView, the Veil, DragHint, useGestures, CSS Modules
  lib/sound.ts           the music and the whooshes (Web Audio, no dependency)
  lib/flight.ts          the flights and the tour (D-151): which stop, Next, the tour's timer; moves through flow.ts
  lib/content/           loads and checks src/content/places.ts
  scene/                 everything WebGL (the only place three is imported)
    host/                SceneHost, SceneSlot, store, flow, registry
    quality/             device tier, frame-time governor
    scenes/atlas/        the galaxy and the cosmic web
    scenes/black-hole/   the black hole (and the shader the quasar shares)
    scenes/nebula/       the nebula
    scenes/quasar/       the quasar
    shaders/             shared GLSL chunks
  styles/tokens.css      colour, type, spacing, motion tokens
```

### Boundaries (do not cross)

1. Nothing outside `src/scene/` imports `three` or `@react-three/*`.
2. Pages talk to the scene system only through `<SceneSlot>`, the store's public functions and the flow (`flow.ts`); none of these import three.
3. Scenes never import from `src/app/` or `src/components/`.
4. Content files hold no layout or styling. Components hold no facts.

## 2. Routes

| Route | Scene | Mode |
|---|---|---|
| `/` | `atlas`: stops 0 close in, 1 the galaxy, 2 the cosmic web, 3 the supervoid (D-119), 4 the observable universe (D-130), 5 the Multiverse, 6 the Omniverse (D-184) | `atlas` (free control, zoom stops, hotspots) |
| `/black-hole` | `black-hole` | `place` |
| `/nebula` | `nebula` | `place` |
| `/quasar` | `quasar` (the black-hole shader seen from far off) | `place` |
| `/solar-system` | `solar-system`: holds `/star` and `/blue-world`, which holds `/moon`, which holds `/asteroid` (D-132, D-133) | `place` |
| `/quasar-galaxy` | `quasar-galaxy`: found at the web and through `/wormhole`; holds `/quasar`, `/dyson-sphere`, `/starbase` and the nine megastructures (D-133, D-152, D-164) | `place` |
| `/starbase` | `starbase`: a ray-marched wheel station whose nine bays lead to the Starbase's ideas (`/warp-drive`, `/programmable-matter`, `/higher-dimensions`, `/pocket-dimensions` (its bulb leads into `/pocket-universe`, D-192), `/bubble-universes`, `/vacuum-decay`, `/quantum-foam`, `/cosmic-strings`, and `/human-cell`, the start of the chain down to `/dna`, `/carbon-atom`, `/carbon-nucleus`, `/quarks` and `/string-theory`, D-190) | `place` |

All routes are static (`generateStaticParams` for `[place]`, `dynamicParams = false`). No server runtime, no API routes. The routes of v1 (`/explore`, `/subjects/*`, `/journeys/*`, `/archive`) and then `/about` were removed before anything was deployed, so they have no redirects (D-093, D-095, D-099). The 404 page is the one page without a scene.

## 3. Scene system

### 3.1 Parts

- **`SceneHost`** (client, in the root layout). Owns one fixed, full-viewport canvas behind the page. Created once per visit, so there is one WebGL context and no context churn between routes. Loaded with `next/dynamic` and `ssr: false`, and only after a slot registers. Once a scene has drawn, it fetches the other scenes' chunks while the browser is idle, so the next one is already there when the visitor clicks (D-096).
- **`SceneSlot`** (client, tiny, no three import). A page renders `<SceneSlot id="atlas" mode="atlas" posters={{ wide, narrow }} opening={...} />`. It renders the poster `<img>` (server HTML, the LCP element), registers the request with the store on mount and withdraws it on unmount. `opening` is the view the page would like to open on (the atlas's opening glide); the flow, when a move is under way, wins over it.
- **Registry.** `id` to `() => import('./scenes/atlas')`. Each scene module exports its component and its budget.
- **Store** (`store.ts`). A small `useSyncExternalStore` module: active slot, quality, ready and context-lost state, the visitor's input (`zoom`, `yaw`, `pitch`, `focus`, `dive`, `arrive`), timed glides, and the frame the DOM reads (projected hotspot positions).
- **Flow** (`flow.ts`, D-096). The move between two scenes' pages: `diveInto` (atlas to place) and `pullOut` (place to atlas). Its phase (`idle`, `leaving`, `veiled`, `lifting`) and the veil's colour drive the `Veil` component in the root layout.

### 3.2 Lifecycle

1. Server HTML arrives with the poster visible. No 3D code has been requested.
2. Once the page has hydrated and a slot has registered, if the tier is not `static`, the host chunk and the scene chunk load.
3. The scene renders its first frame; the canvas fades in over the poster (300 ms).
4. On navigation, the outgoing slot withdraws. The canvas fades to `--space`, the scene unmounts, and its geometries, materials and render targets are disposed. If the next route has a slot, its scene loads and fades in; otherwise the render loop stops and the canvas is hidden.
5. On WebGL context loss the host shows the poster and tries one restore.

### 3.3 The flow between scenes (D-096)

Diving into a place from the atlas:

1. `focus` is set to the hotspot's anchor and `dive` glides 0 to 1 over 1.4 s. The atlas camera (`placeCamera`) turns its look toward the anchor and closes the distance on it on a log scale.
2. At 0.9 s the veil falls: a full-screen DOM layer fades (500 ms) to the place's own dark colour (`veil` in `src/content/places.ts`).
3. At 1.4 s the flow sets the next scene's opening (`arrive: 0`) and calls `router.push`. The new page's slot registers; its scene mounts under the veil.
4. When the new scene's first frame is drawn (`markReady` for a token newer than the one left), `arrive` glides 0 to 1 over 1.7 s (the shader scenes scale their composition from about a third to full) and the veil lifts.
5. If the veil has been down 400 ms, the loader shows. A page that draws no scene (no WebGL, the 404) lifts the veil after 350 ms; it gives up after 6 s whatever happens.

**Flights (D-151):** `flyOn` moves from one place on to another that is not inside it: the place shrinks away as for Zoom Out (`arrive` to 0), the veil falls in the next place's colour, and the next arrives. A place inside the current one is reached with `diveInto`. `src/lib/flight.ts` chooses between them, keeps the stop, and ends the flight when the page goes anywhere it did not ask for.

Pulling out is the same in reverse: `arrive` glides to 0 (0.9 s), the veil falls in the atlas's `--space`, and the atlas opens at the place's stop with `focus` on its anchor and `dive` at 1, then glides `dive` to 0.

The flow is busy from the first click (phase `diving`): a second click, the wheel or the keys wait, and the veil takes clicks. If the page changes before the push (Back, a header link), the move is called off (`cancelFlow`): nothing is pushed, the opening is cleared, and the camera glides back. The next scene's opening stays set until the veil lifts, because React's development mode mounts a slot twice.

With reduced motion or Pause (`calm()`), there is no glide: the veil cross-fades in 220 ms, the next scene opens at rest, and the veil lifts once it is drawn.

### 3.4 Glides

A click's move is a timed glide (`animateSceneInput(patch, ms)`): the host's `Clock` takes the value drawn at the glide's first frame and eases to the target, in and out (cubic). The wheel, a pinch, a drag and the keys set the input directly (`setSceneInput`), which cancels any glide of the same numbers, and the host closes a fifth of the gap every 40 ms. While the loop is stopped (reduced motion, Pause, a still) there is no easing: each view is one frame, and `zoom` snaps to a whole stop.

### 3.5 Time and stills

Scene time is a value passed in, never read from a clock inside a scene. That gives three things from one mechanism:

- `?shot=1&t=12` renders exactly one deterministic frame, for screenshots; `&zoom=` holds the atlas at a stop.
- `npm run posters` uses the same switch to render the stills in `public/posters/` and `public/og/`.
- Reduced motion holds time still and renders on demand only.

### 3.6 Quality tiers

| Tier | Chosen when | Pixel budget | Galaxy / web particles | Glow |
|---|---|---|---|---|
| `static` | no WebGL2, `Save-Data`, or the governor gave up | poster only | 0 | n/a |
| `still` | `prefers-reduced-motion` or motion paused | one frame, no loop | as the tier below | as below |
| `low` | touch and small screen, or 4 cores or fewer, or 4 GB or less | 1.2 MP | 40k / 15k | about 2,500 soft sprites |
| `medium` | default | 2.3 MP | 90k / 35k | about 4,000 soft sprites |
| `high` | only after measured headroom on `medium` | 4 MP | 160k / 60k | about 6,000 soft sprites |

The governor walks a ladder of five rungs built from these tiers (D-038): `high`; `medium`; `medium` particles at the `low` pixel budget; `low`; `low` with half the glow sprites; then `static`. On wide screens the lower tiers are brightened so the galaxy stays as full as at `high` (D-041). The pixel budget sets the canvas resolution (`dpr = sqrt(budget / cssPixels)`, capped at the device ratio).

### 3.7 Frame-time governor

- Keeps a rolling average of frame time.
- Over 20 ms for 2 s: step down one notch. Order: pixels, then particle count, then glow.
- Under 12 ms for 5 s on `medium`: step up to `high`, once per visit.
- Over 33 ms on the last rung for 2 s: switch to `static` and stop the loop.
- One gap over 250 ms is ignored (a tab switch or a rebuild); a run of them counts as slow (D-038).
- The chosen tier is remembered for the session.

### 3.8 Render-loop rules

- The loop runs only while a slot is mounted, on screen, the tab is visible, and motion is not paused.
- Per scene: fewer than 30 draw calls, no shadows, no real-time lights (all materials are unlit custom shaders), no texture downloads.
- Particle attributes are built once on a tier change, never per frame. Animation happens in the vertex shader from the time uniform.

### 3.9 Bundle budgets

| What | Budget (gzip) |
|---|---|
| First-load JS on a route with no scene | 140 KB (raised from 130 KB by the owner, D-033) |
| Host + three + R3F chunk | 220 KB |
| One scene's own chunk | 40 KB |

Scene routes carry their page code above the no-scene figure (D-047). Targets: 60 fps on `medium` on an integrated-GPU laptop; 30 fps floor on `low` on a mid-range phone; LCP under 2.5 s on 4G (the poster); CLS 0 (the canvas is fixed).

## 4. Atlas scene

- **Ported from the prototype.** The seeded generator, the palette, every `build*` function in `model.ts`, the base strengths, the log-distance camera interpolation and lens shift, and the fade ranges are the F1 prototype's (removed in D-135; in git history). The camera keys are centred now that no copy sits beside the galaxy.
- **Layers, in draw order:** background wash and stars; body glow, arm haze, halo, companion; the disc points; dust (sprites that darken what is behind them); core glow; then the web's points and glow, and two of its lights a little brighter: our galaxy and the quasar. Everything is additive except dust. Nothing is drawn over the cosmos (D-094).
- **One zoom scalar.** `zoom` in [0, 6]: 0 close in, 1 the whole galaxy, 2 the cosmic web, 3 the supervoid (D-119), 4 the observable universe (D-130), 5 the Multiverse, 6 the Omniverse (D-184; `multiverse.ts`). It drives the camera rig and the cross-fade between the galaxy and the web.
- **The dive.** `placeCamera(..., focus, dive)`: the look turns toward the focused anchor (the first half of the dive) while the distance to it closes from wherever the camera is to inside its glow, on a log scale; the lens shift fades out so the place ends centred.
- **Hotspots are links.** The scene projects its anchors (`core`, `arm`, `quasar`, `home`) every frame into the store's frame; `AtlasView` stands a real `<a>` (or a button, for the galaxy seen from the web) on each with a transform. A hotspot shows at its stop, hides when its point leaves the screen or while a move is under way, and leaves the tab order when hidden. The canvas is `aria-hidden`.

## 5. Shaders

- GLSL lives in template strings in `.glsl.ts` files, so no bundler loader is needed.
- Shared chunks in `src/scene/shaders/`: soft point and sprite shaders for the atlas, and the deep sky.
- `sky.glsl.ts` is the deep sky (D-101), a function of a direction: clouds of gas (3D value noise, warped), soft dust, three layers of stars with a few spiked bright ones, and an optional warm galactic heart. Its clouds are baked once per scene into a 512-pixel cube texture (`src/scene/sky.ts`); only the stars are drawn live. The black hole and the quasar sample it with each ray's final direction, so it is lensed; the atlas draws it on a full-screen triangle first (one more draw call), from the camera's inverse projection; the nebula lays it flat, shifted less than the cloud by a drag.
- The black hole is a single full-screen triangle: rays bent around the hole, a stylised accretion disc with a brighter approaching side, a background star field. The quasar is the same shader with `QUASAR` defined, seen from far off, with jets, glare and a host galaxy. The nebula is one full-screen shader of warped noise, a cavity, columns of dust and a young cluster.
- The shader scenes are composed in CSS pixels around the window's centre. `setView(view)` scales that composition by the arrival and the visitor's zoom (`placeScale`: `zoom` 1 is the framing, 0 all the way closer), and applies a drag: the black hole and the quasar turn their camera (`yaw` to azimuth, `pitch` to elevation); the nebula pans (D-102).

## 6. Content model

`src/content/places.ts` is all the site's words (D-095):

- `STOPS`: the atlas's stops (the galaxy, the cosmic web, the supervoid since D-119, the observable universe since D-130), each `{ zoom, name, line, sources }`.
- `PLACES`: each `{ id, name, line, sources, anchor, stop, veil, inside? }`. `id` is the route and the scene id. A place with `inside` (D-132) is found in that place's scene, not the atlas: its `anchor` is a body the parent's scene names (`bodies` in `scenes/shared/orb.tsx`), its hotspot stands there, a click dives into it, and its Zoom Out goes back to the parent, framed. A place with `through` and `throughAnchor` (D-133) is also reached from that place's body; arrived that way (the session remembers, `cosmic-archive:via:<id>`), its Zoom Out goes back through it.
- `SOURCES`: `{ id, title, publisher, url, checked }`. Not shown on the site since About went (D-099); still checked by the build.

`src/lib/content/place-check.ts` holds the rule; the build (`src/lib/content/places.ts`) and `npm run check` (`scripts/check-content.mjs`) both run it. It fails when a line is longer than twelve words, names no source or one that is not listed, a source has no checked date or is listed twice, or a source backs no line.

## 7. Accessibility and SEO

- All meaning is in the DOM. The scene adds nothing a screen reader needs.
- There is no Pause control (D-099, the owner's call for a personal site): motion follows the device's reduced-motion setting, live. Sound waits for a gesture and has its own toggle.
- Every control works from the keyboard: Tab reaches the hotspots and the buttons, + and − zoom, the arrows turn and tilt, Escape goes further out (and leaves a place).
- Each route sets its own title, description, canonical URL and share image. Sitemap, robots and JSON-LD `WebSite`.

## 8. Verification

- `Verify: npm run check` (type check, lint, content check; under 60 s, no build).
- `Verify-full: npm run build && npm run shots`.
- Scene changes are checked by looking at `screenshots/` with the checklist in `DESIGN_SPEC.md` section 11.
- `npm run fallbacks` (after a build): reduced motion (no loop), WebGL disabled (poster, screen complete, plain links), CPU throttling (governor steps down), the 404 (no three), navigation, each place, the flow with and without motion (the veil falls and lifts, Back mid-dive), keyboard only, touch only, zooming into a place, the drag hint, the Sound button.
- `npm run a11y`: axe-core on every route, wide and phone.
