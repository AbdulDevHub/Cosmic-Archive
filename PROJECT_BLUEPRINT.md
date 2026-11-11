# Cosmic Archive — Project Blueprint

**Document status:** Draft v1.1  
**Purpose:** Long-lived reference for the project owner and coding agent.  
**Current stage:** Pre-implementation planning.  
**Important:** Build in small, approved phases. Do not attempt to generate the entire website in one prompt.

---

## 1. Executive summary

**Cosmic Archive** is an immersive, educational visual atlas of the universe, its physical phenomena, and the mysteries that remain unresolved.

The experience combines:

- Colourful, approachable science storytelling.
- Cinematic cosmic environments and selective 3D interaction.
- An artistic, semi-scientific atlas for exploration.
- A searchable archive for direct access to topics.
- Curated journeys that connect related ideas.
- Clear distinctions between observed phenomena, established science, hypotheses, speculation, and fiction.

The intended emotional response is cosmic awe: visitors should feel that the universe is enormous, beautiful, and full of things worth understanding.

The universe—not a fictional interface—is the centre of attention. A tiny, elegant exploration vessel is a recurring visual motif that emphasizes scale. Star Trek is a minor influence for the appeal of a vessel or distant starbase; the overall aesthetic should not become a Star Trek bridge simulator or a generic sci-fi HUD.

## 2. Product goals

### Primary goals

1. Inspire curiosity about astronomy, cosmology, physics, and the structure of reality.
2. Make difficult ideas understandable through clear visual storytelling.
3. Let visitors explore freely without forcing a course or game progression.
4. Help visitors discover meaningful connections between topics.
5. Make the site visually memorable while remaining readable, fast, and accessible.
6. Grow the archive over time without requiring a redesign for every new subject.

### Non-goals

- It is not a formal university-level textbook.
- It is not a game requiring missions, scores, or character progression.
- It is not a full Star Trek fan site.
- It is not a photorealistic planetarium simulation of every known object.
- It is not a claim that speculative ideas are real or confirmed.
- It should not require advanced 3D hardware to access the educational content.

## 3. Audience and experience assumptions

The intended audience is curious general visitors, including people who enjoy space, science videos, visual explanations, and speculative physics but may not have advanced scientific training.

Assume visitors may:

- Arrive with a specific question and want to search directly.
- Browse because a visual caught their attention.
- Prefer a guided journey that reveals connections.
- Want a short explanation first and deeper detail later.
- Use a phone or a computer with varying graphics capabilities.

The design must serve both casual exploration and deeper learning.

## 4. Product principles

1. **Awe before density:** visual impact and curiosity come first; detailed information is progressively disclosed.
2. **Understandable, not dumbed down:** explain concepts clearly without distorting the science.
3. **Beauty with integrity:** visually stylized scenes are welcome; misleading scientific claims are not.
4. **Exploration is optional, never obstructive:** atlas, search, archive, and journeys are parallel ways into the content.
5. **Every subject has a reason to exist:** include items that help explain the cosmos, its laws, its structures, or clearly separated speculative frontiers.
6. **Reusable systems:** build page templates and visual components so new subjects do not require rebuilding the site.
7. **Polished increments:** each completed phase should be coherent and usable on its own.
8. **Performance is a feature:** 3D and effects must degrade gracefully.

## 5. Content scope and taxonomy

The catalogue should not be a flat list. Topics can belong to more than one category and can be connected through journeys.

### A. Core collection — The Universe

This is the main identity of the project and should receive the majority of early content and design effort.

Initial subject families:

- **Planetary worlds:** planets, moons, dwarf planets, asteroids, comets, rings, exoplanets, and planetary systems.
- **Stars and stellar evolution:** stars, stellar nurseries, red giants, supergiants, white dwarfs, supernovae, neutron stars, pulsars, and magnetars.
- **Galaxies and large-scale structures:** the Milky Way, galaxy types, galaxy groups and clusters, superclusters, cosmic filaments, the cosmic web, voids, and supervoids.
- **Nebulae and interstellar environments:** emission, reflection, dark, planetary nebulae, molecular clouds, and supernova remnants.
- **Cosmic extremes:** black holes, supermassive black holes, quasars, active galactic nuclei, gamma-ray bursts, tidal disruption events, and gravitational lensing.
- **Cosmology and fundamental phenomena:** the observable universe, cosmic microwave background, expansion, dark matter, dark energy, gravitational waves, neutrinos, and antimatter.

The first four flagship pages are **Black Holes, Galaxies, Nebulae, and Quasars**.

### B. Secondary collection — Theoretical Frontiers

This collection covers physically motivated but unconfirmed or speculative concepts. It should have a visually compelling identity and unusually clear evidence labels.

Possible topics:

- Wormholes.
- Gravastars.
- Quark stars and other exotic compact objects.
- Cosmic strings.
- Higher spatial dimensions.
- Branes and compactified dimensions.
- Vacuum metastability and vacuum decay.
- Multiverse proposals and bubble universes.
- Pocket-universe concepts.
- Other serious theoretical proposals as the archive grows.

Do not present all these topics as equally supported. Each page must explain the status of the idea and what evidence would be needed to establish it.

### C. Future expansion — Civilizations, Technology & Fiction

Keep this separate from the core astronomical archive until the main experience is established.

Possible topics:

- Star Trek starships and starbases.
- Dyson swarms and Dyson spheres (clearly distinguish a proposed megastructure from an observed object).
- Matrioshka brains.
- Ringworlds and artificial habitats.
- Generation ships and worldships.
- Stellar engines.
- Von Neumann probes.
- Warp-drive concepts.
- Programmable matter and other advanced materials concepts.
- Fictional technologies and imagined civilizations.

Programmable matter is a materials/technology topic, not an astronomical object. It can still fit the broader exploration project as a clearly separated future collection.

### Inclusion rule

A topic belongs in the core collection if it directly helps visitors understand the universe, its physical laws, its astronomical structures, or phenomena observed within it. Related but non-astronomical ideas should go into a clearly separated future collection rather than expanding the core without limit.

## 6. Scientific status and editorial standards

Every subject should carry an evidence/status classification appropriate to the specific claims on that page.

Suggested labels:

- **Observed:** directly detected or observed, with the nature of the observation explained.
- **Established science:** strongly supported by converging evidence, even if not every detail is settled.
- **Theoretical:** a mathematically or physically motivated framework or model; explain whether it is well tested, incomplete, or unconfirmed.
- **Hypothetical:** a proposed object or phenomenon that has not been confirmed.
- **Speculative:** an idea with substantial uncertainty or limited empirical support.
- **Fictional:** invented for fiction or used as an imaginative thought experiment, not an established physical entity.

A single page may need more than one label for different claims. Avoid treating these labels as a simplistic ranking of scientific worth.

### Source policy

- Prefer primary research, peer-reviewed literature, NASA, ESA, major observatories, university research groups, and reputable scientific organizations.
- Use accessible secondary explainers to support beginner-friendly framing, not as the only source for controversial claims.
- Record source title, publisher, date, URL, and access date for changing information.
- Attribute images and visualizations. Distinguish real observations from simulations and artist's impressions.
- Keep an editorial note for uncertain or debated interpretations.
- Never invent numbers, distances, object properties, or scientific consensus.
- When researchers disagree, communicate the disagreement clearly and proportionately.

## 7. Information architecture

### Primary navigation

- **Explore:** entry point to the cosmic atlas.
- **Journeys:** curated paths connecting topics.
- **Archive:** searchable catalogue, categories, and filters.
- **About:** project purpose, scientific standards, credits, and methodology.

The wordmark returns to Home. Search should be globally accessible.

### Main destinations

- Home.
- Explore / cosmic atlas.
- Journey overview and individual journey pages.
- Archive landing page, search results, category pages, subject pages.
- About / science and sourcing approach.

### Subject page structure

Use a reusable structure, adapting sections to the subject:

1. Immersive hero and concise introduction.
2. Short story-led explanation: what it is and why it matters.
3. Interactive or animated visual explanation where useful.
4. Main components, formation, or mechanism.
5. Scale comparison or useful context.
6. What observations tell us.
7. What remains unknown or debated.
8. Related subjects and natural next steps.
9. Sources and further reading.

Do not force every subject into identical sections if the structure becomes scientifically awkward.

### Navigation map philosophy

Use a hybrid map:

- For real astronomical structures, use real locations and relationships where credible data exists and where it adds value.
- For broad concepts and abstract topics, use conceptual regions, categories, or visual pathways.
- Never fabricate precise positions for hypothetical objects or abstract theories.
- Make the map beautiful and legible rather than maximally data-dense.
- Maintain direct search and archive navigation as alternatives.

## 8. Educational journeys

Journeys should help visitors see how ideas connect. They are optional paths, not a mandatory progression system.

Example: **A star's life**

Molecular cloud / stellar nursery → star formation → main-sequence star → possible evolutionary outcomes → white dwarf, neutron star, or black hole depending on the star's initial mass and evolution.

Other possible journeys:

- From a black hole to a quasar.
- From a galaxy to the cosmic web.
- From light to the observable universe.
- From ordinary matter to dark matter.
- From a stellar explosion to the elements it disperses.

Each journey should explain why one topic leads to the next, not merely display a row of links.

## 9. Design system direction

### Brand identity

- Working name: **Cosmic Archive**.
- Working tagline: **Explore the extraordinary.**
- Core motif: a tiny exploration vessel against an immense cosmic environment.
- Main emotional register: beautiful cosmic wonder.

### Art direction

- Kurzgesagt-inspired clarity, bold colour, recognizable geometry, and friendly visual explanation at a high level.
- Cinematic 3D depth, layered environments, atmospheric lighting, and restrained camera movement.
- Original compositions and artwork; do not copy protected illustrations or distinctive layouts.
- Avoid a generic sci-fi dashboard aesthetic.

### Candidate palette

| Role | Candidate | Notes |
|---|---|---|
| Deep-space base | `#090F20` | Main background |
| Secondary navy | `#14213D` | Panels and layers |
| Cosmic blue | `#283D67` | Secondary surfaces |
| Nebula violet | `#7657B6` | Select highlights |
| Stellar cyan | `#27B7CF` | Interactive accent |
| Warm gold | `#E6AC62` | Warm stellar light |
| Soft white | `#F1E9DF` | Text and highlights |

Palette values are provisional. Validate against chosen imagery and accessibility contrast.

### Subject visual identities

Use distinct colour families while preserving the overall design system:

- Black holes: deep indigo, black, warm gold, amber, violet.
- Galaxies: blues, violets, golds, and selected pinks.
- Nebulae: varied pink, magenta, blue, violet, and warm highlights.
- Quasars: electric blue, white, and energetic warm accents.

Do not make every page use the same colour treatment. Do not let colour alone carry scientific meaning.

### Motion

Use subtle, purposeful movement: slow parallax, drifting particles, gentle celestial rotation, restrained camera transitions, and clear interaction feedback. Respect reduced-motion preferences. Sound is optional, off by default, and never autoplayed.

## 10. Technical direction — preferred starting point for Claude Opus

The project should use a maintainable web stack that supports responsive content pages now and selective 3D experiences later.

### Preferred initial direction (verify current compatibility)

The recommended starting stack is now:

- **Next.js App Router + React + TypeScript** for the application and subject routes.
- **npm** as the package manager to keep local setup simple.
- Use the owner’s already-installed, currently supported Node.js LTS runtime if compatible with the selected framework; do not downgrade or hard-code an outdated version.
- **ESLint** for linting.
- **Global CSS variables + CSS Modules** for custom art direction. Do not add Tailwind or a prebuilt UI kit at the start.
- Keep the React Compiler disabled initially; revisit only if there is a clear reason.
- Prefer the `src/` directory and the `@/*` import alias.
- Keep the first app lightweight. Motion, Three.js, React Three Fiber, Drei, MDX, audio, and any CMS/database are deferred until a phase explicitly needs them.

Next.js is preferred over a Vite-only setup because Cosmic Archive is expected to grow into a browsable collection of individually addressable subject pages, while still supporting selective client-side 3D experiences. This is a starting decision, not a reason to add server-side complexity or a backend prematurely.

The owner has already installed the local prerequisites. Opus should inspect the current environment and follow `TECHNICAL_DIRECTION.md` and `CLAUDE_CODE_WORKFLOW.md`; use current stable scaffolding guidance rather than stale command flags.

### Optional 3D asset-authoring workflow — Blender

The project owner is open to using or connecting Blender if it materially improves the visual result. Treat Blender as an optional creative/asset-authoring tool, not a required part of the website's runtime or the initial homepage phase.

Blender may be useful later for: bespoke celestial models, stylized spacecraft, custom nebula or environmental scenes, camera paths, lighting studies, looping animations, and rendered fallback assets. For interactive browser experiences, prepare optimized exports (typically glTF/GLB where appropriate) for the web renderer rather than expecting visitors to load native `.blend` project files.

Guidelines:

- Do not add Blender to Phase 1 just to create a polished static homepage; use suitable artwork and lightweight effects first.
- In Phase 6, evaluate Blender against the actual needs of the first flagship 3D scene. Make a small proof of concept before building a large asset pipeline.
- Keep meshes, materials, textures, animation data, and file sizes appropriate for web delivery. Provide a static or lightweight fallback.
- Keep editable source files separate from optimized runtime exports, and document asset names, export settings, licences, and attribution.
- A Blender connection or automation bridge is optional. Only configure one if the available development environment supports it reliably and it saves meaningful work; a manual Blender-to-GLB export workflow is an acceptable fallback. Do not assume that Blender is already installed or connected.

Choose the smallest stack that supports the planned product. Do not add a database, user accounts, analytics platform, CMS, or complex state-management library without a clear requirement.

### Architecture principles

- Separate page layout, content data, reusable UI, and visual scenes.
- Keep subject content in structured, reusable data or content files rather than hardcoding each page independently.
- Make destination cards and related-topic connections data-driven.
- Lazy-load expensive visual scenes.
- Provide a static fallback for unsupported WebGL or reduced-performance devices.
- Keep route and content structure stable as the catalogue grows.
- Avoid premature abstraction: extract shared components when a real repeated pattern exists.

### Content model to plan for

A subject record should eventually support fields such as:

- Stable ID and slug.
- Title and short description.
- Main category and optional secondary categories.
- Evidence/status labels.
- Hero media and media credits.
- Introductory story text.
- Optional sections and interactive visual modules.
- Related subject IDs.
- Journey membership.
- Sources and further reading.
- Last-reviewed date.

This is a planning model, not a demand to build a full CMS in Phase 0.

## 11. Phased development roadmap

Each phase must have a bounded scope, an observable result, and a clear acceptance check. Do not begin the next phase until the current phase is reviewed.

### Phase 0 — Project foundation and planning

**Goal:** Prepare a coherent implementation brief and make the minimum technical decisions.

Tasks:

- Review this blueprint and the homepage specification.
- Confirm the repository structure and development environment.
- Evaluate and choose the initial framework/build setup.
- Define initial routes and navigation.
- Define basic design tokens, typography direction, spacing, and breakpoints.
- Decide where content data will live initially.
- Define the asset and image-credit approach.
- Decide whether Blender is worth evaluating as an optional asset-authoring tool now or whether that decision should wait until the first 3D proof of concept. It is not a Phase 1 dependency.
- Create a phase checklist and a short agent handoff instruction.

Deliverables:

- Approved project structure.
- Initial design-system tokens.
- Route and navigation map.
- Asset strategy.
- Phase checklist.
- Written decisions log.

**Do not build the full homepage, atlas, or 3D scenes in Phase 0.**

### Phase 1 — Homepage skeleton

**Goal:** Build the complete homepage structure with polished static visuals and functional navigation.

Tasks:

- Implement responsive top navigation.
- Implement hero with placeholder or selected static cosmic artwork and Tiny Explorer motif.
- Implement atlas preview section.
- Implement four flagship destination cards.
- Implement curated journey preview.
- Implement theoretical frontiers preview.
- Implement footer.
- Wire navigation and calls to action to sensible placeholder routes or destinations.

Deliverable: a responsive homepage that already looks coherent and intentional without advanced 3D.

**Out of scope:** fully interactive map, advanced 3D models, complex shaders, account features, audio experience.

### Phase 2 — Cosmic atmosphere

**Goal:** Give the homepage subtle life without compromising readability or performance.

Tasks:

- Add layered depth or parallax where useful.
- Add restrained star / dust movement.
- Add subtle vessel movement if it supports the composition.
- Add transition polish.
- Add reduced-motion alternatives.
- Add user-initiated optional ambient audio only if it materially improves the experience.

Deliverable: an atmospheric homepage with a robust static fallback.

### Phase 3 — Interactive cosmic atlas

**Goal:** Create the first real exploration interface.

Tasks:

- Design the visual map and its navigation affordances.
- Support zoom / pan / selection appropriate to the chosen implementation.
- Show a small set of representative destinations first.
- Separate real astronomical locations from conceptual destinations.
- Provide direct search and category navigation.
- Test usability on touch devices and desktop.

Deliverable: a useful, beautiful atlas prototype—not a full scientifically complete map of the universe.

### Phase 4 — Subject-page framework

**Goal:** Create a reusable educational destination template and complete the black hole flagship page.

Tasks:

- Build the subject page layout.
- Establish the opening story and progressive disclosure pattern.
- Add evidence labels, sources, related topics, and scale context.
- Add one meaningful interactive or animated visual, if feasible within scope.

Deliverable: a complete, polished black hole page that establishes the content standard.

### Phase 5 — Four flagship destinations

**Goal:** Expand the subject framework to galaxies, nebulae, and quasars.

Tasks:

- Write and source each page.
- Give each a distinctive visual identity.
- Reuse components without forcing identical storytelling.
- Connect the four subjects through meaningful related-topic links.

Deliverable: four complete flagship destinations.

### Phase 6 — Selective interactive 3D experiences

Blender is an optional asset-authoring tool for bespoke models, environments, camera animation, and rendered assets. Evaluate it against the first 3D proof of concept; it is not a website runtime dependency and should not be connected or automated unless that clearly saves effort.

**Goal:** Add 3D where it materially improves understanding or wonder.

Suggested order:

1. Black hole / gravitational lensing visualization.
2. Galaxy structure / navigable view.
3. Nebula environment or star-formation sequence.
4. Quasar / accretion disk and jet visualization.

Tasks:

- Build one scene at a time.
- Set clear performance budgets and fallbacks.
- Make camera controls understandable and optional.
- Provide labels and explanatory overlays without clutter.

Deliverable: a reusable approach to high-quality interactive cosmic scenes.

### Phase 7 — Journeys and connected learning

**Goal:** Make the archive feel like a connected body of knowledge.

Tasks:

- Implement curated journey pages or flows.
- Add contextual next-step recommendations.
- Show why one topic connects to another.
- Keep free exploration available.

Deliverable: working journeys through related subjects.

### Phase 8 — Archive expansion and release polish

**Goal:** Expand coverage and improve reliability.

Tasks:

- Add additional core topics based on value and available assets.
- Add the theoretical frontiers collection with clear labels.
- Add future-collection placeholders for technology and fiction only when the core experience is stable.
- Improve search, filtering, mobile behaviour, accessibility, loading, and error states.
- Review sourcing, citations, image credits, and content accuracy.

Deliverable: a polished first major release with a scalable content foundation.

## 12. Claude Code workflow and credit-saving protocol

The project owner uses **Claude Code with Opus** and has confirmed that Node.js, npm, Git, and Claude Code are already installed on their Windows machine. Do not waste usage repeating installation instructions or asking them to verify the same prerequisites unless a concrete error occurs.

The project owner has explicitly authorized Claude Opus to inspect the project, plan the implementation, make reasonable technical decisions, and begin implementation. Use the supplied `OPUS_HANDOFF_PROMPT.md` as the execution brief.

### Required agent behaviour

1. Read `README_START_HERE.md`, `CLAUDE.md`, this blueprint, `HOMEPAGE_DESIGN_SPEC.md`, `TECHNICAL_DIRECTION.md`, `PHASED_ROADMAP.md`, and `CONTENT_CATALOGUE_AND_TERM_DUMP.md` before making architectural choices.
2. Inspect the actual workspace and repository before creating, moving, or overwriting files. Preserve existing user work.
3. Produce a concise implementation plan and evaluate the proposed technology direction. Do not blindly follow a stack if current compatibility or project constraints suggest a better option; explain material changes.
4. Implement in bounded stages. The initial authorized delivery is the project foundation (Phase 0) followed by the static homepage skeleton (Phase 1), provided the foundation checks pass. Stop after Phase 1 for owner review.
5. Do not implement Phase 2 or later in the first handoff: no elaborate motion system, interactive cosmic atlas, subject-page catalogue, complex 3D scenes, audio, CMS, database, accounts, or deployment.
6. Use current stable, mutually compatible dependencies. Avoid installing packages merely because they may be useful later.
7. Make reversible engineering decisions independently and record them. Ask only when a decision is genuinely blocking, destructive, costly, involves external accounts/services, or changes the product direction.
8. Use read-only Plan Mode for the initial audit and architecture plan. Since the owner has explicitly authorized the first implementation, proceed with the bounded Phase 0 and Phase 1 work after presenting the plan; do not stop only to ask for permission on routine choices.
9. Do not use permission-bypass modes. Keep normal permission checks enabled.
10. Run the relevant checks and report only results actually observed. Update the phase checklist and decisions log.

### Credit-saving rules

- Use these documents as persistent context; do not repeatedly ask the owner to re-explain the vision.
- Work on one coherent milestone at a time. Avoid broad rewrites and speculative future scaffolding.
- Prefer built-in platform features before adding dependencies.
- Do not install 3D, animation, audio, search, CMS, or backend dependencies until the phase that needs them.
- Avoid repeated exhaustive option lists. Make a well-reasoned recommendation and record the trade-off.
- At the end of Phase 1, stop. Report the result, checks, decisions, remaining issues, and the next recommended task. Do not begin Phase 2 automatically.

### Completion report format

At the end of each milestone, provide:

- What was completed.
- Files created or modified.
- Architecture / dependency decisions and why.
- Commands and checks actually run, with results.
- Known limitations or outstanding decisions.
- Git status and whether a local checkpoint was created.
- The next smallest logical task.

## 13. Quality requirements for every phase

### Visual quality

- Consistent spacing, typography, image treatment, and colour use.
- Clear hierarchy and deliberate composition.
- No arbitrary decorative controls or dead-end sections.
- No visually dominant placeholder boxes in a purportedly finished phase.

### Usability

- Navigation is understandable without onboarding.
- Core content is reachable without using the 3D map.
- Interactive affordances look interactive and work.
- Mobile layouts are designed intentionally, not merely squeezed desktop layouts.

### Accessibility

- Keyboard navigation and visible focus states.
- Sufficient contrast.
- Semantic headings and controls.
- Meaningful alternative text for informative images.
- Reduced-motion support.
- Audio controls and no autoplay.

### Performance

- Lazy-load non-critical media.
- Avoid unnecessary 3D dependencies on simple content pages.
- Optimize images and animation assets.
- Provide fallbacks for WebGL or low-power devices.
- Check loading and interaction responsiveness on mobile.

### Scientific reliability

- Claims are sourced.
- Hypotheses and speculative concepts are labelled.
- Artist's impressions are not described as photographs.
- Uncertainty and disagreements are represented honestly.

## 14. Risks and safeguards

| Risk | Safeguard |
|---|---|
| Scope grows endlessly | Keep core, theoretical, and future collections separate. Use phase gates. |
| 3D consumes time and credits | Start with static visual quality; add one 3D scene at a time. |
| Site becomes a generic sci-fi dashboard | Keep cosmic scenery dominant and the ship small. Avoid excessive HUD elements. |
| Map implies false scientific precision | Separate real astronomical coordinates from conceptual navigation. |
| Visuals overpower learning | Use progressive disclosure, short storytelling, and clear explanatory labels. |
| Slow loading | Lazy-load, optimize, and provide static fallbacks. |
| Scientific misinformation | Use credible sources, evidence labels, editorial review, and image attribution. |
| Agent repeatedly redoes work | Maintain durable project documents, phase checklists, and decisions. |
| Every page looks identical | Reuse structure, not identical art direction or storytelling. |

## 15. Decisions already established

These are agreed project constraints unless the owner explicitly changes them.

- Working project name: **Cosmic Archive**.
- The experience is a hybrid of visual exploration and educational content.
- Visual direction: stylized, colourful science storytelling blended with cinematic 3D depth.
- The universe is the focus; the vessel is a small supporting motif.
- Homepage vessel treatment: **Option A — a tiny explorer against an immense cosmic scene**.
- Navigation: hybrid artistic / semi-scientific atlas, with beauty prioritized over dense cartographic information.
- Storytelling: engaging and inspiring, broadly Kurzgesagt-inspired in clarity and visual communication, not copied.
- Content presentation: minimalist at first, with expandable depth.
- Subject pages: consistent educational framework with custom visual environments where useful.
- Interaction: cinematic and interactive modes.
- Sound: optional, user-initiated, off by default.
- Exploration: unrestricted browsing plus curated journeys.
- Topic connections should suggest natural continuations.
- Fictional Star Trek content is separate from the main scientific archive and is a minor influence on the overall aesthetic.
- Established science and speculative ideas may both appear, but must be distinguished clearly.
- First four flagship destinations: Black holes, Galaxies, Nebulae, and Quasars.
- Development will proceed in phases to conserve coding-agent usage credits.
- The owner is open to using or connecting Blender if it materially helps with custom 3D assets; Blender remains optional and is not a Phase 1 dependency.
- The owner has explicitly authorized Claude Opus to plan and implement the initial Phase 0 foundation and Phase 1 static homepage, then stop for review.

## 16. Decisions delegated to Claude Opus

The project owner has asked Claude Opus to use engineering judgement rather than ask for confirmation on every routine choice. Resolve the following pragmatically, document the decision, and avoid overengineering:

- Confirm the best current Next.js / React / TypeScript setup or recommend a better fit with reasons.
- Select initial fonts and refine colour tokens against the chosen artwork and contrast requirements.
- Establish the asset sourcing, licensing, and attribution approach.
- Choose initial route and content-file conventions without prematurely adding a CMS or database.
- Decide whether MDX is appropriate when subject pages are introduced; it is not required in the first implementation.
- Keep ambient audio optional and defer it unless a later phase demonstrates clear value.
- Revisit Blender only when a specific 3D asset or proof of concept would benefit from it.

Only pause for a genuinely blocking decision, destructive action, external service/account, unexpected cost, or material change to the owner's product vision.

---

## 17. Term dump — project owner's list first, then additional ideas

This is a parking-lot inventory for future exploration. It is deliberately broader than the current site's approved scope. Inclusion here does **not** mean a topic must be implemented, belongs in the first release, or is scientifically established. Use the scientific-status and inclusion rules above before turning any term into published content.

### 17.1 Terms explicitly mentioned by the project owner

These are listed first and preserve the topics the project owner brought to the conversation. Minor spelling normalization is applied (for example, “neutro stars” is recorded as **neutron stars**).

**Astronomy and cosmic subjects**

- Galaxy / galaxies
- Black holes
- Sun
- Earth
- Moon
- Asteroids
- Solar system
- Stars
- Nebulae
- Quasars
- Neutron stars
- Gravastars
- Dyson spheres
- Wormholes
- “Black hole star” (the video concept discussed below; commonly referred to as a **quasi-star**)
- Strange stars
- Supervoids
- Dark matter

**Cosmology, dimensions, and speculative reality**

- Higher dimensions
- Multiverse
- Pocket dimension / pocket dimensions
- Omniverse

**Technology and science-fiction interests**

- Programmable matter
- Starbase / starbases
- Star Trek starship / starships

**Creative reference and catch-all**

- Kurzgesagt (visual-storytelling inspiration)
- Star Trek (aesthetic / exploration-vessel inspiration)
- “Everything else” (the owner's intentional catch-all for future discoveries)

### 17.2 Additional terms introduced during brainstorming

These were suggested or named by the assistant as possible subjects, subtopics, examples, or future directions. They are grouped for easier searching. They are not commitments to include them in the core archive.

**Large-scale cosmic structure and galactic environments**

- Galaxy groups
- Galaxy clusters
- Galaxy superclusters / superclusters
- Local Group
- Virgo Supercluster (and the Virgo-region context mentioned in the scale-explorer example)
- Cosmic web
- Cosmic filaments
- Cosmic voids
- Galactic walls
- Dark matter halos
- Intergalactic space
- Interstellar medium
- Solar neighbourhood
- Observable universe
- Galactic core
- Galaxy collisions and galaxy mergers
- Galaxy types: spiral, elliptical, and irregular galaxies

**Planets, star formation, and stellar evolution**

- Exoplanets
- Dwarf planets
- Comets
- Planetary rings
- Molecular clouds
- Stellar nurseries
- Stellar evolution / stellar life cycle
- Red giants
- Red supergiants
- Blue supergiants
- White dwarfs
- Brown dwarfs
- Wolf–Rayet stars
- Population III stars (proposed first-generation stars)
- Binary stars
- Stellar winds
- Stellar remnants
- Planetary nebulae
- Supernovae
- Supernova remnants

**Compact objects, black-hole structures, and high-energy phenomena**

- Pulsars
- Magnetars
- Quark stars
- Quasi-stars (the likely term for the “black hole star” concept from the linked video)
- Stellar-mass black holes
- Supermassive black holes
- Active galactic nuclei (AGN) / active galactic nucleus
- Accretion disks
- Event horizons
- Singularity / singularities
- Relativistic jets
- Gamma-ray bursts
- Fast radio bursts
- Kilonovae
- Tidal disruption events
- Gravitational lensing
- Gravitational waves
- Cosmic rays
- Solar flares
- Coronal mass ejections
- Cosmic dust
- MoM-BH*-1 (a named early-universe object mentioned in the discussion; verify the latest research and interpretation before using it in site content)

**Cosmology and fundamental physics**

- Dark energy
- Antimatter
- Neutrinos
- Cosmic microwave background (CMB)
- Cosmic inflation
- Quantum foam
- Cosmic strings
- False vacuum
- Vacuum metastability
- Vacuum decay
- Spacetime curvature
- Branes
- Brane cosmology
- Compactified dimensions
- Tesseract / 4D hypercube
- Higher-dimensional projections

**Multiverse-adjacent and speculative concepts**

- Bubble universes
- Pocket universes
- Parallel universes
- Alternate timelines
- Quantum interpretations (including interpretations sometimes discussed alongside multiverse ideas)
- Black star / dark star (names floated while clarifying the linked-video concept; do not assume they mean the same thing as a quasi-star)

**Megastructures, advanced engineering, and future civilizations**

- Dyson swarms
- Matrioshka brains
- Ringworlds
- O'Neill cylinders
- Generation ships
- Worldships
- Stellar engines
- Von Neumann probes
- Warp drives / warp-drive concepts
- Space elevators
- Artificial habitats and artificial worlds
- Computational materials
- Shape-changing robots
- Modular matter

### 17.3 Handling this inventory

- Keep the owner-mentioned list intact at the top of the dump when adding future ideas.
- Add new suggestions to the assistant-introduced list rather than silently blending them into the original list. If the owner later adopts one, it can be moved into the owner-approved list with their permission.
- Keep duplicate or closely related terms searchable, but consolidate them when creating the actual site taxonomy.
- Verify terminology and current scientific status before writing explanatory content. Some terms are broad labels, some are subtypes, some are hypothetical proposals, and some are fictional or philosophical concepts.
- Use the inventory as a future idea bank, not as a first-release checklist.

## 18. Current status

**Handoff ready for Claude Opus.** The project owner confirmed that Node.js, npm, Git, and Claude Code are already installed. The intended coding environment is Claude Code with Opus.

The preferred starting stack is Next.js App Router + React + TypeScript + npm + ESLint + CSS Modules / global CSS variables. These are strong starting recommendations, not dogma: Opus should verify current compatibility and explain any material change before implementing. Motion and Three.js / React Three Fiber are deferred until their relevant phases. Blender is optional and may be evaluated for a later custom 3D asset workflow; it is not a runtime dependency.

The owner has authorized Opus to inspect the project, plan the full architecture and phases, then implement Phase 0 (foundation) and Phase 1 (static homepage skeleton) as separate bounded milestones. Stop after Phase 1 for review. The detailed instructions are in `OPUS_HANDOFF_PROMPT.md` and `CLAUDE.md`.
