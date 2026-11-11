# Cosmic Archive — Phased Roadmap

**Purpose:** Keep implementation incremental and credit-conscious. Each phase produces a reviewable outcome. The owner prefers a polished result at every step, not a rough prototype that is promised to look good later.

## Phase 0 — Foundation and implementation plan

**Goal:** Establish a stable project foundation and document key architecture decisions.

- Inspect the existing directory and preserve any existing work.
- Confirm the framework and compatible current toolchain.
- Scaffold or adapt the project.
- Establish the basic folder structure, global design tokens, linting, scripts, and navigation primitives.
- Add/update `CLAUDE.md`, `README.md`, `docs/DECISIONS.md`, and `docs/PHASE_CHECKLIST.md`.
- Verify development, lint, type checks if configured, and production build.

**Acceptance:** The project runs locally, checks pass, instructions are in place, and the foundation is understandable.

## Phase 1 — Static homepage skeleton

**Goal:** Deliver a visually coherent responsive homepage using optimized static or lightweight artwork.

Sections, in order:

1. Persistent navigation.
2. Hero: “Explore the extraordinary.” with a tiny explorer against an immense cosmic scene.
3. Preview of the artistic, semi-scientific cosmic atlas.
4. Four flagship destinations: Black Holes, Galaxies, Nebulae, Quasars.
5. Curated journey preview.
6. Theoretical frontiers preview.
7. Footer with archive / about / source-credit entry points.

Use working navigation and real links or clearly non-interactive presentation. Do not create fake controls. Keep the hero minimal, beautiful, and legible.

**Acceptance:** A first-time visitor understands the product quickly; ship remains secondary; all core links work; desktop/tablet/mobile layouts are intentional; reduced-motion and accessibility basics are respected; page remains useful without WebGL.

## Phase 2 — Cosmic atmosphere

- Add subtle parallax, star/dust movement, and restrained vessel drift if they genuinely improve the composition.
- Add polished but non-obstructive transitions.
- Respect reduced-motion settings.
- Consider optional user-initiated ambient audio only if it contributes meaningfully; off by default.

**Acceptance:** Atmospheric motion enhances rather than competes with content; static fallback remains strong.

## Phase 3 — Interactive cosmic atlas

- Create a beautiful illustrated atlas with a sense of space and depth.
- Represent real astronomical relationships where credible information supports them.
- Use conceptual category destinations where literal coordinates are not meaningful.
- Never imply that hypothetical entities have observed physical coordinates.
- Keep search, archive, and category browsing available as alternatives.

**Acceptance:** Visitors can navigate a representative subset of subjects with clear controls on desktop and touch devices.

## Phase 4 — Subject-page framework

- Create the reusable destination-page structure.
- Build the first complete page: Black Holes.
- Include an engaging introduction, visual explanation, science, scale context, what we know, open questions, sources, and related destinations.
- Establish evidence-status labels and progressive disclosure.

**Acceptance:** One polished page sets the quality bar without imposing identical art direction on every subject.

## Phase 5 — Four flagship destinations

Expand the framework to:

- Galaxies.
- Nebulae.
- Quasars.

Give each its own visual personality and explain its meaningful connections to the other subjects.

**Acceptance:** Four complete, sourced flagship experiences with coherent cross-navigation.

## Phase 6 — Selective interactive 3D

Add 3D only when it improves understanding or wonder.

Suggested sequence:

1. Black hole / gravitational lensing.
2. Galaxy structure.
3. Nebula environment or star-formation sequence.
4. Quasar accretion disk and jets.

Evaluate Three.js / React Three Fiber and optional Blender asset authoring against one representative proof of concept. Use optimized GLB/glTF where useful. Add static fallbacks and performance budgets.

**Acceptance:** A reusable pattern for high-quality 3D scenes that does not make the rest of the site slow.

## Phase 7 — Journeys and connected learning

- Build curated journeys through related topics.
- Explain why each next topic follows naturally.
- Keep free browsing available.
- Example: molecular cloud → star formation → star → possible stellar end states (which depend on the star's properties).

**Acceptance:** The archive helps visitors understand connections, not just isolated definitions.

## Phase 8 — Archive expansion and release polish

- Expand core astronomy and physics subjects.
- Add theoretical-frontier topics with precise evidence labels.
- Consider the separate future collection for civilizations, technology, and fiction.
- Improve search, accessibility, mobile behaviour, performance, citations, asset credits, and error states.

**Acceptance:** A robust first major release with a maintainable content model.

## Phase discipline

- Complete and verify one phase before continuing.
- Keep each Claude prompt scoped to one coherent milestone.
- Do not add future dependencies “just in case.”
- Record decisions rather than repeatedly reopening them.
- Review visuals before adding more effects.
- Save a local Git checkpoint after a successful milestone when safe and configured.
