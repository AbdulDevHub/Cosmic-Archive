# Cosmic Archive — Homepage Design Specification

**Document status:** Draft v1.1  
**Purpose:** Define the homepage's visual identity, information hierarchy, interactions, and acceptance criteria before implementation.  
**Implementation status:** Planning only. This document does not authorize building the complete 3D experience in one pass.

---

## 1. Product vision

Cosmic Archive is an immersive, educational atlas of the universe and the ideas that help us understand it. It should make visitors feel that the cosmos is enormous, beautiful, and full of things worth discovering.

The homepage's job is to inspire curiosity and make the next step obvious. It is not a conventional school website, a dense astronomy dashboard, or a science-fiction game interface.

### Core feeling

> A tiny explorer moves through an immense, beautiful universe. The visitor is invited to discover what is out there.

### Design principles

1. **The universe is the star.** Space, celestial objects, and cosmic scale dominate the visual composition. The exploration vessel is a small supporting motif, never the main attraction.
2. **Awe before information density.** Lead with one memorable image and a short, engaging explanation. Reveal deeper information progressively.
3. **Inspire, then explain.** Use approachable, story-led language and visual metaphors. Avoid textbook-like walls of facts.
4. **Beauty with scientific integrity.** Art may be stylized and cinematic, but explanations and scientific claims must remain accurate and appropriately qualified.
5. **Exploration without friction.** Visitors can use the atlas, search, browse categories, or follow a curated journey. No one should be forced through a cinematic sequence or a spaceship interface.
6. **Progressive ambition.** The first homepage should already look polished. Advanced 3D features should enhance it in later phases, not rescue a weak first version.

## 2. Visual direction

### Primary inspiration

Take high-level inspiration from Kurzgesagt's approachable science communication: clear silhouettes, confident shapes, bold but harmonious colour, strong composition, and visual explanations that make complicated ideas easier to grasp. Combine this with cinematic 3D depth, atmospheric lighting, and a convincing sense of scale.

This is an original visual identity. Do not copy Kurzgesagt's specific illustrations, characters, layouts, assets, or distinctive compositions.

### Secondary inspiration

Star Trek is a minor influence only. Its contribution is the appealing idea of a small exploration vessel or distant starbase set against extraordinary space scenery. Avoid making the overall site look like a bridge simulator, game HUD, or holographic control room.

### Hero motif: The Tiny Explorer

Use a small, elegant exploration vessel as a scale cue within an enormous cosmic scene.

- The ship should occupy a small portion of the composition.
- It should read clearly as a vessel at desktop and remain visible—but not intrusive—on mobile.
- Keep its silhouette elegant and relatively simple, with restrained lights.
- Place it in the environment rather than presenting it as a product render.
- Its movement, if animated, should be subtle and slow.
- Do not add cockpit screens, prominent interface graphics, weapons, or excessive science-fiction detailing.

### Overall atmosphere

- Beautiful, expansive, curious, quietly wondrous.
- Colourful without becoming noisy or childish.
- Cinematic without becoming photorealistic everywhere.
- Slightly mysterious, but not horror-themed.
- Use darkness to create contrast and depth, not to make every page ominous.

### Candidate colour family

These are starting points, not final locked brand tokens. Refine them against actual artwork and contrast testing.

| Role | Candidate | Use |
|---|---|---|
| Deep-space base | `#090F20` | Main dark background |
| Secondary navy | `#14213D` | Panels and layered backgrounds |
| Cosmic blue | `#283D67` | Secondary surfaces and depth |
| Nebula violet | `#7657B6` | Accent for selected highlights |
| Stellar cyan | `#27B7CF` | Interactive accent and cool highlights |
| Warm stellar gold | `#E6AC62` | Important highlights and warm light |
| Soft white | `#F1E9DF` | Main light text and stars |

Do not use every accent everywhere. Let the imagery determine the dominant colour of each section. Text and controls must maintain readable contrast.

### Typography

- Choose a highly legible sans-serif family for body text and navigation.
- A more expressive display face may be used for short hero headlines and destination titles.
- Avoid overly futuristic typefaces that reduce readability.
- Use a clear scale: compact navigation, readable body copy, large but restrained headlines.
- Keep paragraphs short. Prefer one strong sentence over a paragraph in the hero.

### Imagery and assets

- Prioritize original, commissioned, generated, or appropriately licensed imagery.
- Avoid mixing unrelated visual styles within one section.
- Do not present artistic approximations as actual telescope photographs.
- When scientific imagery is used, identify it as an observation, data visualization, or artist's impression as appropriate.
- Maintain consistent lighting, scale, and art direction across featured destination cards.
- Blender is an optional tool for later bespoke 3D modelling, scene composition, and animation. It is not required for the initial homepage; use it only when a specific asset or scene benefits from a dedicated 3D-authoring workflow.
- If Blender assets are used for interactive browser scenes, export optimized web formats (such as glTF/GLB where appropriate) and keep the editable `.blend` source separate from runtime assets.

## 3. Homepage information architecture

### Persistent top navigation

**Recommended links:**

- **Explore** — opens the cosmic atlas.
- **Journeys** — curated paths connecting related topics.
- **Archive** — searchable, browsable catalogue.
- **About** — explains the project's purpose and scientific classification approach.

The Cosmic Archive wordmark links home. Search should be quickly accessible, either as a visible control or a compact icon with a clear accessible label.

Requirements:

- Navigation remains legible over changing backgrounds, using a subtle backdrop or contrast treatment when needed.
- Keep the number of top-level links small.
- Avoid a Star Trek-style control panel or dense HUD treatment.
- Mobile navigation must be simple and keyboard accessible.

### Section 01 — Hero: “Explore the extraordinary.”

**Purpose:** Immediately communicate the experience and establish the visual identity.

**Composition:**

- A wide, immersive cosmic environment fills most of the initial viewport.
- A large galaxy, nebula, or other visually rich celestial scene provides the focal point.
- The Tiny Explorer vessel appears small within the environment to communicate scale.
- Stars and cosmic dust provide depth; any motion is restrained.
- Headline, supporting line, and calls to action sit in a calm, high-contrast area of the composition.

**Proposed copy:**

- Eyebrow: `AN INTERACTIVE JOURNEY THROUGH THE COSMOS`
- Headline: `Explore the extraordinary.`
- Supporting line: `From the worlds around us to the most astonishing mysteries of the universe.`
- Primary action: `Begin exploring`
- Secondary action: `Browse the archive`

The exact copy can be refined later. Keep the hero concise and emotionally engaging.

**Interactions:**

- `Begin exploring` opens the atlas or its introductory exploration state.
- `Browse the archive` opens the searchable catalogue.
- If a cinematic intro is used, provide an obvious Skip control and do not make it a barrier to navigation.
- Sound is optional and must be off by default. Never autoplay audio.

### Section 02 — Cosmic atlas preview: “Where would you like to go?”

**Purpose:** Show that the site is explorable, not just a collection of articles.

**Visual direction:** An artistic, semi-scientific map of the cosmos. It should feel like a living illustrated atlas rather than a conventional star chart or synthetic hologram.

**Map approach:**

- Use recognizable cosmic forms and a sense of spatial depth.
- Where practical, ground real astronomical relationships in credible data.
- Where a literal location is not meaningful or known, present a clearly conceptual destination or category rather than inventing coordinates.
- Avoid implying that every object, theory, or hypothetical structure exists as a mapped physical location.
- Use labels sparingly. Discovery and visual hierarchy matter more than placing every fact on the map.

**Homepage behaviour:** The homepage may show a compelling map preview or selected destinations. Full map navigation belongs to the dedicated Explore experience and a later development phase.

**Fallback navigation:** Search, categories, and the archive must remain available to visitors who prefer conventional browsing.

### Section 03 — Featured destinations: “Discover the extraordinary”

The first four flagship destinations are:

1. Black holes
2. Galaxies
3. Nebulae
4. Quasars

Each card should have:

- A distinctive, high-quality image or short atmospheric loop.
- A clear title.
- One intriguing sentence that creates curiosity.
- A clear destination affordance.

Do not put long descriptions, statistics, or several badges on the cards. Give each destination its own visual identity while keeping card layouts consistent.

**Suggested teaser copy:**

- **Black holes:** `Where gravity reshapes our view of space and time.`
- **Galaxies:** `Vast islands of stars, gas, dust, and dark matter.`
- **Nebulae:** `Vast clouds where stars are born—and where stars leave their mark.`
- **Quasars:** `Some of the brightest beacons in the distant universe.`

Treat these as draft copy; verify and refine all science-facing text before publication.

### Section 04 — Curated journeys: “One discovery leads to another.”

**Purpose:** Help visitors understand relationships between subjects and make learning memorable.

Show a small number of visual journey previews rather than a large list of lessons.

**Example journey:** `A star's life`

Nebula / molecular cloud → star formation → star → possible stellar end states → white dwarf, neutron star, or black hole depending on the star's properties.

The path should communicate that not every star follows the same outcome. The journey should connect topics naturally without forcing a linear course structure.

Other future journeys could include:

- From a galaxy to the cosmic web.
- From a black hole to a quasar.
- Following light across cosmic history.
- From ordinary matter to the mysteries of dark matter.

### Section 05 — Theoretical frontiers: “Beyond what we know.”

**Purpose:** Preview the fascinating ideas that extend beyond confirmed observations.

Potential topics include wormholes, gravastars, extra dimensions, cosmic strings, and multiverse hypotheses.

Keep this section visually intriguing but scientifically transparent. Clearly distinguish established observations, well-supported theories, speculative proposals, and fictional concepts. Do not present hypothetical ideas as discovered places or confirmed objects.

### Section 06 — Footer

Include:

- Links to Explore, Journeys, Archive, and About.
- A concise project description.
- Scientific sourcing / image-credit information where appropriate.
- A way to report an error or suggest a topic (future capability).
- No unnecessary social or promotional clutter.

## 4. Homepage wireframe and hierarchy

Recommended desktop section order:

1. Persistent top navigation.
2. Hero / cosmic reveal.
3. Cosmic atlas preview.
4. Four featured destinations.
5. Curated journeys.
6. Theoretical frontiers.
7. Footer.

The first viewport should prioritize the hero and its two actions. The visitor should understand what the site is within a few seconds.

The atlas preview should be visually important but should not displace the hero. The four flagship destinations should be easy to discover without scrolling through a very long homepage.

## 5. Motion and interaction principles

Motion should create a sense of depth, scale, and life—not compete with the content.

### Appropriate motion

- Slow star twinkle and subtle parallax.
- Gentle movement in nebula layers or cosmic dust.
- Slow, restrained movement of the tiny explorer vessel.
- Smooth camera or section transitions when entering an exploration view.
- Subtle hover / focus feedback on interactive cards and navigation.

### Avoid

- Constant rapid movement.
- Excessive particle counts or bright flashing.
- Unnecessary camera spins.
- Scroll hijacking.
- Long forced intros.
- Heavy animations that make text hard to read.
- Audio that starts without user action.

### Accessibility

- Respect `prefers-reduced-motion` and provide a reduced-motion experience.
- Keep essential information available without animation.
- Ensure every interactive element works with keyboard navigation.
- Use visible focus indicators and meaningful labels.
- Do not rely on colour alone to communicate a state or category.
- Provide sufficient text/background contrast.

## 6. Responsive behaviour

### Desktop

- Use the full cinematic hero composition.
- Allow ample negative space and wide imagery.
- Show featured destinations in a balanced grid.
- Keep top navigation visible and uncluttered.

### Tablet

- Recompose the hero so the title and actions remain legible.
- Reduce decorative layers if they compete with content.
- Use a two-column destination grid where space allows.

### Mobile

- Preserve the sense of cosmic scale with a carefully cropped vertical or portrait-friendly scene.
- Keep the vessel visible only if it does not compete with the headline.
- Stack hero copy and actions clearly.
- Use a single-column or compact two-column destination layout depending on width.
- Avoid loading an expensive interactive 3D scene simply to reproduce the desktop hero.
- Keep navigation, search, and the primary action easy to reach.

## 7. Performance and progressive enhancement

The homepage must remain usable on ordinary laptops and mobile devices.

- Begin with optimized static or lightweight animated imagery.
- Add heavier 3D rendering only when it provides a meaningful benefit.
- Lazy-load below-the-fold media.
- Use responsive image sizes and modern formats where supported.
- Avoid loading large 3D libraries on routes that do not need them.
- Provide a static fallback if WebGL is unavailable or performance is poor.
- Keep the first render useful before decorative effects load.
- Test on a mid-range mobile device, not only a powerful desktop.

## 8. Content and scientific integrity

The homepage is an invitation, not a place for detailed scientific exposition. Still, every claim must be reliable.

- Prefer primary scientific institutions, peer-reviewed research, and reputable observatories for factual content.
- Distinguish observations from simulations, models, artist's impressions, and speculative concepts.
- Use consistent labels for epistemic status across the site (for example: Observed, Established theory, Hypothetical, Speculative, Fictional).
- Do not imply that all items in a category have the same evidence level.
- Link from homepage teasers to deeper pages with sources and further reading.

## 9. Homepage acceptance criteria

The homepage is ready for Phase 1 sign-off when:

- A first-time visitor can explain what Cosmic Archive is after a brief glance.
- The hero establishes cosmic scale, beauty, and the Tiny Explorer motif.
- The ship remains a supporting element, not the dominant subject.
- The visual language is original, cohesive, and inspired by high-level Kurzgesagt-style clarity rather than copied artwork.
- The four flagship destinations are immediately discoverable.
- The atlas, archive, and journeys have clear entry points.
- Theoretical topics are not presented as confirmed physical locations.
- The layout works at desktop, tablet, and mobile widths.
- Navigation and core actions work with mouse, touch, and keyboard.
- Reduced-motion users receive a usable experience.
- Sound is off by default and never autoplays.
- The page remains useful if advanced motion or WebGL is unavailable.
- No unfinished placeholder controls appear interactive.

## 10. Asset pipeline note

The project owner is open to using or connecting Blender if it becomes useful. Treat it as an optional asset-authoring tool for later custom 3D work, not as a required website dependency. The Phase 1 homepage should be achievable with high-quality static artwork and lightweight motion. Revisit Blender when a representative interactive 3D subject is being prototyped; see the Blender workflow notes in `PROJECT_BLUEPRINT.md`.

For the broader list of subjects and terms raised during brainstorming—including ideas intentionally parked for later—see Section 17, **Term dump**, in `PROJECT_BLUEPRINT.md`.

## 11. Explicitly out of scope for the first homepage phase

Do not implement these as part of the initial homepage skeleton:

- A fully navigable, scientifically scaled 3D universe.
- Fully interactive 3D models for all cosmic objects.
- A complete Starship / Starbase experience.
- User accounts, profiles, saved progress, or achievements.
- A complete content management system.
- A complete catalogue of every possible cosmic concept.
- Complex procedural galaxy generation.
- Autoplay narration or ambient audio.

These may be considered in later phases after the basic experience is validated.
