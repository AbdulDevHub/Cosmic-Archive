# Cosmic Archive — Claude Opus Handoff Pack

Welcome. This folder contains the complete project brief and first implementation handoff for **Cosmic Archive**.

## One-sentence vision

An immersive, educational visual atlas of the universe that combines colourful, approachable science storytelling with cinematic cosmic environments, a beautiful artistic navigation atlas, and natural journeys between connected subjects.

## What the owner has decided

- The universe is the visual focus; the ship is a tiny supporting motif.
- Homepage hero: a tiny explorer vessel against an immense cosmic environment (Option A).
- Visual direction: original colourful, clear science storytelling inspired by broad Kurzgesagt-style principles, blended with cinematic 3D depth; do not copy protected artwork.
- Star Trek is a minor inspiration for the vessel / distant starbase only, not the overall UI aesthetic.
- Hybrid exploration and education; artistic / semi-scientific map prioritizing beauty over information density.
- Minimal initial text with inspiring storytelling and progressively revealed depth.
- Four flagship destinations: Black Holes, Galaxies, Nebulae, Quasars.
- Free exploration plus curated journeys that naturally connect topics.
- Optional sound, user-initiated and off by default.
- Science and hypothetical topics can coexist if evidence status is clear.
- Fictional technology / Star Trek material is a separate future collection.
- Blender is optional for future authored 3D assets; not required for the initial website.
- Build in phases to conserve Claude usage and keep each increment reviewable.

## What is in this pack

| File | Purpose |
|---|---|
| `CLAUDE.md` | Persistent Claude Code instructions. Keep this in the project root. |
| `PROJECT_BLUEPRINT.md` | Full product vision, scope, science standards, content architecture, risks, phases, and decisions. |
| `HOMEPAGE_DESIGN_SPEC.md` | Detailed homepage layout, visual direction, section hierarchy, interaction and acceptance criteria. |
| `TECHNICAL_DIRECTION.md` | Preferred stack and technologies deliberately deferred; Opus may challenge choices with reasons. |
| `PHASED_ROADMAP.md` | Phase-by-phase plan and acceptance outcomes. |
| `CONTENT_CATALOGUE_AND_TERM_DUMP.md` | Owner's original terms first, followed by additional topics raised during brainstorming. |
| `CLAUDE_CODE_WORKFLOW.md` | How to work with Claude Code efficiently and preserve usage. |
| `OPUS_HANDOFF_PROMPT.md` | The first prompt to paste into Claude Code with Opus selected. |
| `docs/DECISIONS.md` | Initial decision-log template. Update as choices are made. |
| `docs/PHASE_CHECKLIST.md` | Initial phase checklist. Update as work is completed. |

## How to use this pack

1. Extract the ZIP into the intended project directory, or copy these files into the root of an existing repository. The ZIP contents are already arranged for this.
2. Open PowerShell in that project root.
3. Start Claude Code and select Opus in your available model selector.
4. Paste the full contents of `OPUS_HANDOFF_PROMPT.md` as the first task.
5. Let Opus inspect the workspace, plan the implementation, and complete Phase 0 then Phase 1. The prompt explicitly tells it to stop after the static homepage is complete.

The owner has already confirmed that Node.js, npm, Git, and Claude Code are installed. This pack intentionally does not spend tokens on repeating setup instructions.

## Document authority

- `PROJECT_BLUEPRINT.md` is the long-lived product and content source of truth.
- `HOMEPAGE_DESIGN_SPEC.md` is authoritative for the initial homepage experience.
- `CLAUDE.md` governs the agent's behaviour inside the repository.
- New owner instructions always override older documents.
- If documents conflict, Opus should call out the conflict, choose the conservative option if non-blocking, and record the decision.

## Initial implementation boundary

The first handoff authorizes only:

- Phase 0: project foundation, architecture and verification.
- Phase 1: polished static responsive homepage skeleton.

It does not authorize the interactive atlas, advanced motion, 3D models, Blender automation, educational subject pages, sound, CMS, database, accounts, or deployment. Those remain later phases.
