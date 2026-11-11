# Cosmic Archive — Claude Code project instructions

## Read first

Before planning or editing, read these files in order:

1. `README_START_HERE.md` — handoff overview and document map.
2. `PROJECT_BLUEPRINT.md` — product vision, scope, science standards, content architecture, and phases.
3. `HOMEPAGE_DESIGN_SPEC.md` — agreed homepage experience and visual hierarchy.
4. `TECHNICAL_DIRECTION.md` — preferred stack and items deliberately deferred.
5. `PHASED_ROADMAP.md` — phase boundaries and acceptance outcomes.
6. `CONTENT_CATALOGUE_AND_TERM_DUMP.md` — owner-mentioned terms first, then additional topic ideas.
7. `CLAUDE_CODE_WORKFLOW.md` — operating and credit-saving rules.
8. `docs/DECISIONS.md` and `docs/PHASE_CHECKLIST.md` — maintain these as work proceeds.

The owner's newest explicit instructions override older documents. If two documents conflict and no newer owner decision resolves it, identify the conflict and choose the conservative option or ask one focused question if it is blocking.

## Product identity

Cosmic Archive is an immersive, educational visual atlas of the universe and the ideas that help us understand it. The emotional centre is **beautiful cosmic wonder**: enormous, colourful, inspiring, and full of discovery.

- The universe is the visual focus.
- The tiny, elegant exploration vessel is a small scale cue, not the main attraction.
- Take high-level inspiration from clear, colourful, approachable science storytelling and combine it with cinematic depth. Create an original identity; do not copy Kurzgesagt's protected illustrations, characters, compositions, or layouts.
- Star Trek is a minor influence for the appeal of a vessel or distant starbase. Do not turn the site into a Star Trek interface, bridge simulator, or generic sci-fi HUD.
- Lead with concise, inspiring storytelling and visuals. Reveal deeper information progressively.
- Keep established science, hypotheses, speculation, philosophy, and fiction clearly distinguished.

## Owner's current decisions

- Experience: hybrid visual exploration + educational content.
- Visual direction: stylized colourful science storytelling blended with cinematic 3D depth.
- Navigation: hybrid artistic / semi-scientific cosmic atlas, prioritizing beauty over dense cartographic detail.
- Storytelling: inspiring and understandable, not a wall of facts.
- Information density: minimalist initially, with deeper detail progressively available.
- Subject pages: consistent educational structure, but custom art direction and environments where useful.
- Interaction: both cinematic presentation and user-controlled exploration.
- Learning: free browsing plus curated journeys and natural topic continuations.
- Sound: optional, user-initiated, off by default; no autoplay.
- Main flagship subjects: Black holes, Galaxies, Nebulae, Quasars.
- Starship motif: **Option A — a tiny explorer vessel against an immense cosmic scene**.
- Fictional Star Trek content belongs in a separate future collection, not the core science archive.
- Blender is allowed as an optional future asset-authoring tool, not a required runtime or early-phase dependency.
- Development must proceed in phases to conserve coding-agent usage.

## Current authorized scope

The owner has authorized Claude Opus to plan and implement the initial project. Complete these as separate bounded milestones:

- **Phase 0:** inspect the repository, confirm architecture, establish the foundation, core project instructions, initial routes/configuration, and verification.
- **Phase 1:** create the responsive static homepage skeleton following `HOMEPAGE_DESIGN_SPEC.md`.

After Phase 1 is complete and verified, stop and report. Do not automatically continue into Phase 2.

Do not implement in this initial handoff:

- Advanced animated cosmic atmosphere or elaborate cinematic intro.
- Fully interactive cosmic atlas/map.
- Full subject catalogue or all educational article pages.
- Interactive 3D models or complex shaders.
- Blender automation or custom Blender pipeline.
- Ambient audio, narration, CMS, database, accounts, analytics, payment, or deployment.

## Technical direction

The starting preference is Next.js App Router, React, TypeScript, npm, ESLint, CSS Modules, and global CSS variables. Verify current compatibility and adapt if there is a compelling reason. See `TECHNICAL_DIRECTION.md`.

- Keep dependencies minimal.
- Do not add Tailwind or a prebuilt UI kit unless the owner explicitly changes direction or a strong reason is documented.
- Do not install Motion, Three.js, React Three Fiber, Drei, MDX, a CMS, a database, or audio libraries until needed by a later approved phase.
- Keep content, UI components, layout, and future 3D scenes separable.
- Use responsive, optimized images and graceful fallbacks.

## Required workflow

1. Inspect the existing repository and working tree before editing. Preserve existing user work.
2. Read the source-of-truth documents before making architectural choices.
3. Use Plan Mode for the initial audit and architecture plan. Then proceed with the owner's authorized Phase 0 and Phase 1 implementation; do not pause for approval on routine reversible choices.
4. Explain material architecture changes and record decisions. Ask only for truly blocking questions, destructive changes, external services/accounts, purchases, unexpected costs, or changes to product direction.
5. Work phase by phase. Do not combine future features into the current milestone.
6. Do not use permission-bypass mode. Keep normal permission prompts enabled.
7. Run checks that actually exist and report exact results. Never claim an unrun test passed.
8. Update `docs/PHASE_CHECKLIST.md` and `docs/DECISIONS.md` as appropriate.
9. Review `git status` and diffs. Do not overwrite or delete existing work. Do not push or deploy.
10. At the end of Phase 1, stop. Report completed work, changed files, decisions, verification results, known issues, Git status, and the next recommended milestone.

## Quality requirements

- Responsive desktop, tablet, and mobile layouts.
- Semantic HTML, keyboard navigation, visible focus states, and readable contrast.
- Respect `prefers-reduced-motion`; essential content must not depend on animation.
- Sound, if ever added, must be user initiated and off by default.
- Good performance on ordinary laptops and mobile devices; do not load heavy 3D libraries on simple routes.
- Clearly label observations, simulations, artist's impressions, hypotheses, speculative ideas, and fiction.
- Never invent scientific facts, coordinates, citations, or claims of scientific precision.

## Secrets and external actions

Never put API keys, passwords, tokens, or credentials in source files or Git. Do not deploy, publish, purchase services, connect accounts, or send data to external services without the owner's explicit authorization.
