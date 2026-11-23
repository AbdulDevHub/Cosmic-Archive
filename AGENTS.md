# Cosmic Archive: Agent Rules

> **What this file is:** the rules for AI coding agents working on this repo. Claude Code reads it through `CLAUDE.md`, which imports it. It holds only what you can't infer from the code.
> After any meaningful change to this project, update this file, `context/PROGRESS_TRACKER.md`, and the "Project Overview" section of `README.md` to reflect the current state. Do this proactively, without being asked.

## Overview

The universe to look at: real-time cosmic scenes a visitor clicks through, from the cosmic web into a galaxy and the places inside it (D-092). It is a spectacle, not an educational site.

## Stack

Next.js 16 (App Router, static), React 19, TypeScript strict, CSS Modules with OKLCH tokens, three with React Three Fiber (WebGL2, GLSL). Playwright for screenshots and tests. npm.

## Commands

- `npm install`, then `npm run dev` (http://localhost:3000).
- Run `npm run shots`, `npm run a11y`, `npm run fallbacks` and `npm run posters` one at a time, with no server or build running: the machine runs short of memory.

Verify: npm run check

Verify-full: npm run build && npm run shots

## Read First

1. `context/PROGRESS_TRACKER.md`: where the work stands and the plan.
2. `context/DESIGN_SPEC.md`: the look, the bans and the screenshot checklist.
3. `context/ARCHITECTURE.md`: stack, boundaries, scene system, budgets and content model.
4. `context/BLUEPRINT.md`: scope and editorial rules, when touching content or scope.
5. `context/DECISIONS.md`: before changing anything that looks deliberate. Its newest row wins over every other doc.

The palette and type live in `src/styles/tokens.css`, from the approved F1 prototype (removed in D-135; in git history).

## Rules That Do Not Change Without the Owner

- **Identity:** the scenes show the cosmos alone, with nothing drawn over them (no rings, ticks or lines). The start page and header follow the owner's `Home.png` (D-107): gradient headline, glass bar and dock, glowing pill button, a ship. Elsewhere there are no glass panels, HUD elements or neon UI, and hotspots use `--beacon`.
- **Spectacle, not text:** each view gets a name and one line of at most twelve words. Click to travel; nothing scrolls; every move between scenes is a flight (dive, veil, arrive).
- **Boundaries:** only `src/scene/` imports three. Pages use `<SceneSlot>`. Content holds facts; components hold layout.
- **Every screen works without the scene:** the poster comes first; the name, line and places are server-rendered HTML; places are real links.
- **Budgets** in `context/ARCHITECTURE.md` section 3.9 are limits, not targets to revisit.
- **Science:** every line is true. No fact, number or name from memory: fetch the source, name it in `src/content/places.ts` and record the checked date. `npm run check` enforces this.
- **Imagery:** our own illustrations only. Never embed or host telescope photos or third-party art.
- **Sound:** the owner's own music, the effects the owner supplied in `public/audio/effects/` (D-114), and whooshes made in the browser. Nothing plays before the first gesture, and the Sound button always works (D-100).
- **Scope:** the plan in `context/PROGRESS_TRACKER.md` "Next Steps" (D-136). Work down it in order and commit after each item; keep going until the owner stops for the day.

## Working Rules

- A visual change is not done until `npm run shots` (1440x900, 390x844, reduced motion) passes `context/DESIGN_SPEC.md` section 11.
- **Laptop first (D-110):** make the 1440x900 desktop as striking as possible. The phone only has to work; its polish waits for a final pass that costs the laptop nothing.
- Check current Next.js and React Three Fiber docs (context7) before relying on an API from memory.
- Add no new dependency without a row in `context/DECISIONS.md` saying why.
- Update `context/PROGRESS_TRACKER.md` as items are verified, and append to `context/DECISIONS.md` when a decision changes.
- Never push, deploy or send anything to an external service unless the owner asks. No secrets in the repo.
- Report only checks that were actually run, with their results.

## Boundaries

- `owner/` (gitignored) holds the owner's private files: `reference-images/` (inspiration only, never in the site), `music-library/` (copyrighted source tracks; the loops in `public/audio/music/` are cut from it; delete it once every loop is cut). The original ChatGPT handoff was folded into `context/IDEAS.md` and deleted (D-136); it is in commit `15e3478`.

## More

`README.md` has the plain-language overview. `context/` holds the tracker and the deeper docs (`SHIP_BRIEF.md` for the ships, `IDEAS.md` for future places).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
