# Cosmic Archive — Technical Direction

**Status:** Preferred starting direction for Claude Opus to evaluate. It is intentionally not a rigid architecture mandate.

## 1. Product constraints that should shape the stack

Cosmic Archive begins as a polished visual website and grows toward an educational archive with selective 3D experiences. It should not require a backend, account system, CMS, or 3D engine merely to display the homepage and explain a cosmic topic.

The stack must support:

- Responsive pages for a growing number of destinations.
- Reusable page templates and topic relationships.
- Good metadata and shareable subject URLs.
- Selectively loaded 3D scenes without making every page heavy.
- Static and animated fallback visuals.
- A simple authoring process for content and assets.

## 2. Preferred initial stack

| Layer | Starting preference | Notes |
|---|---|---|
| Framework | Next.js App Router | Strong fit for a growing collection of content routes plus interactive components. |
| UI | React | Component reuse for shared layout and destination patterns. |
| Language | TypeScript | Helps keep reusable content and components reliable as the project grows. |
| Package manager | npm | Already installed by the owner; avoid introducing another package manager without a reason. |
| Styling | CSS Modules + global CSS variables | Fine-grained art direction without a prebuilt theme. |
| Linting | ESLint / current Next.js-supported lint setup | Follow the current framework guidance. |
| Content | Simple structured data first; evaluate MDX during subject-page implementation | Avoid installing content tooling before it is useful. |

The owner has confirmed Node.js, npm, Git, and Claude Code are installed. Do not ask them to reinstall these. Check installed versions only if the scaffold or build exposes a compatibility issue. Use a supported Node.js LTS version compatible with the current stable framework; do not hard-code a stale version recommendation.

## 3. Options intentionally deferred

| Technology | Possible future role | When to evaluate |
|---|---|---|
| Motion for React | UI transitions and carefully controlled motion | Phase 2, if CSS transitions are insufficient. |
| Three.js | WebGL 3D rendering | Phase 6, when the first real 3D scene is scoped. |
| React Three Fiber | Declarative Three.js scenes in React | Phase 6, if React integration makes the scene easier to maintain. |
| Drei | Optional helpers for React Three Fiber | Only if a concrete scene needs them. |
| Blender | Original models, scenes, camera animation, rendered or exported assets | When the first custom 3D asset justifies the modelling workflow. |
| glTF / GLB | Web-friendly delivery of authored 3D assets | When exporting assets from Blender or another modelling tool. |
| MDX | Educational narratives with embedded React components | Phase 4, after the subject page content model is clear. |
| Search library / service | Search the growing archive | When the archive has enough content to justify it. |
| CMS / database | Editorial workflow or dynamic content | Only if a demonstrated need appears; not assumed for the first release. |

Blender is optional. It is an authoring tool, not a browser runtime dependency. If used, keep source `.blend` files organized separately from optimized exports. Evaluate polygon count, texture sizes, lighting/baking, file size, loading, and fallback needs before shipping assets.

## 4. Architecture principles

- Separate route-level pages, shared layout, content data, and interactive visualizations.
- Prefer server-rendered/static content where possible; add client-side interactivity only where needed.
- Lazy-load heavy 3D modules and below-the-fold media.
- Keep the educational text available when WebGL is unavailable.
- Keep scientific metadata separate from presentation: title, slug, summary, category, evidence status, related topics, sources, and media credits should not be trapped inside a UI component.
- Use a source/credit record for every factual page and meaningful visual asset.
- Avoid a bespoke backend until the product actually needs one.
- Prefer a small number of well-structured abstractions over speculative generic frameworks.

## 5. Initial route ideas

These are suggestions for Opus to refine, not a command to build all routes immediately:

- `/` — Home.
- `/explore` — Cosmic atlas (later phase).
- `/archive` — Searchable subject index (later phase).
- `/journeys` — Curated learning journeys (later phase).
- `/subjects/[slug]` — Individual destination pages (later phase).
- `/about` — Project, scientific status labels, and editorial approach.

Do not create empty placeholder routes for every future feature unless they have meaningful purpose and working navigation. The Phase 1 homepage should not contain dead-end buttons.

## 6. Technical decisions Opus should report

Before implementation, provide a short decision record covering:

1. Framework and why it fits this project.
2. Current compatible runtime and package manager assumptions.
3. Styling approach and how design tokens will be stored.
4. Route and component boundaries for the first two phases.
5. How static assets will be organized and optimized.
6. How content can later be expanded without rewriting the site.
7. What is being intentionally deferred to avoid unnecessary dependencies.

If changing the preferred stack, compare the replacement against these constraints and record the trade-offs. Do not switch technologies merely for novelty.
