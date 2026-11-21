# Cosmic Archive

The universe to look at: real-time cosmic scenes a visitor clicks through, from the cosmic web into a galaxy and the places inside it (D-092). Next.js 16, React 19, TypeScript, CSS Modules, three + React Three Fiber.

Verify: npm run check

Verify-full: npm run build && npm run shots

## Read first

1. `docs/PHASE_CHECKLIST.md` (where the work stands)
2. `docs/DESIGN_SPEC.md` (the look, the bans, the screenshot checklist)
3. `docs/ARCHITECTURE.md` (boundaries, scene system, budgets, content model)
4. `docs/PROJECT_BLUEPRINT.md` (scope and editorial rules), when touching content or scope
5. `docs/DECISIONS.md`, before changing anything that looks deliberate

The palette, type and galaxy come from `prototype/look.html`; its ink and vessel are gone (D-094).

## Rules that do not change without the owner

- **Identity:** cosmos alone in the scenes: nothing drawn over them (no rings, ticks or lines). The start page and header follow the owner's `Home.png` (D-107): gradient headline, glass bar and dock, glowing pill button, a ship. Elsewhere no glass panels, HUD elements or neon UI; hotspots use `--beacon`.
- **Spectacle, not text:** a name and one line of at most twelve words per view. Click to travel; nothing scrolls; every move between scenes is a flight (dive, veil, arrive).
- **Boundaries:** only `src/scene/` imports three. Pages use `<SceneSlot>`. Content holds facts, components hold layout.
- **Every screen works without the scene.** Poster first; name, line and places in server-rendered HTML; places are real links.
- **Budgets** in `docs/ARCHITECTURE.md` section 3 are limits, not targets to revisit.
- **Science:** every line is true. No fact, number or name from memory: fetch the source, name it in `content/places.ts`, record the checked date. `npm run check` enforces it.
- **Imagery:** our own illustrations only. Never embed or host telescope photos or third-party art. The owner's `reference images/` are inspiration, kept out of git.
- **Sound:** the owner's own music and whooshes made in the browser; nothing before the first gesture; the Sound button always works (D-100).
- **Scope:** the v1 table in the blueprint; the beauty sessions (S2 to S4) before new places. One roadmap session at a time, then stop.

## Working rules

- A visual change is not done until `npm run shots` screenshots (1440x900, 390x844, reduced motion) pass the checklist in `docs/DESIGN_SPEC.md` section 11.
- **Laptop first (D-110):** the owner views on a laptop. Make the 1440x900 desktop as striking as possible; the phone only needs to work (no errors, nothing broken), and phone polish waits for a final pass that must not cost the laptop anything.
- Check current Next.js and React Three Fiber docs (context7) before relying on an API from memory.
- No new dependency without a line in `docs/DECISIONS.md` saying why.
- Update `docs/PHASE_CHECKLIST.md` as items are verified; append to `docs/DECISIONS.md` when a decision changes.
- Never push, deploy, or send anything to an external service unless the owner asks. No secrets in the repo.
- Report only checks that were actually run, with their results.
