# Cosmic Archive

A living atlas of the universe: real-time cosmic scenes with a map-maker's ink layer, and sourced science pages. Next.js 16, React 19, TypeScript, CSS Modules, three + React Three Fiber.

Verify: npm run check

Verify-full: npm run build && npm run shots

## Read first

1. `docs/PHASE_CHECKLIST.md` (where the work stands)
2. `docs/DESIGN_SPEC.md` (the look, the bans, the screenshot checklist)
3. `docs/ARCHITECTURE.md` (boundaries, scene system, budgets, content model)
4. `docs/PROJECT_BLUEPRINT.md` (scope and editorial rules), when touching content or scope
5. `docs/DECISIONS.md`, before changing anything that looks deliberate

The look is defined by `prototype/look.html` and `prototype/shots/`.

## Rules that do not change without the owner

- **Identity:** cosmos plus ink. The vessel stays tiny. No glass panels, HUD elements, gradient text, pill navigation or neon UI. One UI accent, `--beacon`.
- **Evidence is drawn and written:** solid observed/established, long dash theoretical, short dash hypothetical, dotted speculative. Never colour or line alone.
- **Boundaries:** only `src/scene/` imports three. Pages use `<SceneSlot>`. Content holds facts, components hold layout.
- **Every page works without the scene.** Poster first; all meaning in server-rendered HTML; destinations are real links.
- **Budgets** in `docs/ARCHITECTURE.md` section 3 are limits, not targets to revisit.
- **Science:** no fact, number or name from memory. Fetch the source, tie the claim to it, record the checked date. `npm run check` enforces it.
- **Imagery:** our own illustrations only. Never embed or host telescope photos or third-party art; link to them.
- **Scope:** the v1 table in the blueprint. One roadmap session at a time, then stop.

## Working rules

- A visual change is not done until `npm run shots` screenshots (1440x900, 390x844, reduced motion) pass the checklist in `docs/DESIGN_SPEC.md` section 11.
- Check current Next.js and React Three Fiber docs (context7) before relying on an API from memory.
- No new dependency without a line in `docs/DECISIONS.md` saying why.
- Update `docs/PHASE_CHECKLIST.md` as items are verified; append to `docs/DECISIONS.md` when a decision changes.
- Never push, deploy, or send anything to an external service unless the owner asks. No secrets in the repo.
- Report only checks that were actually run, with their results.
