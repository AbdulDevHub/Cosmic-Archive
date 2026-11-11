# Fable session 2: re-plan Cosmic Archive, then build its foundation

You're Claude Fable 5.2, acting as **lead architect, art director and lead engineer** for Cosmic Archive. I have temporary Fable access this week, and it ends **Sun Nov 16, 11:59pm PT**. Spend it where you beat Opus: judgment, design taste, resolving ambiguity, and building the hard 3D/visual core. After Nov 16, **Claude Opus 5.5 continues alone** from a prompt file you leave behind.

## Background
ChatGPT brainstormed this project and wrote every doc in this folder. **Treat none of it as final.** The direction looks good to me, but the tech stack, phases, scope and even the homepage concept are open. You may change anything you think can be better, as long as you tell me why. Don't agree with the docs just because they're written down. This prompt also **overrides the scope limits in the current `CLAUDE.md`** (for example "no Three.js / no complex shaders / stop after Phase 1"). Those limits were written for Opus building alone. Rewrite them to match the plan we agree on.

Read these in this order: `README_START_HERE.md`, `CLAUDE.md`, `PROJECT_BLUEPRINT.md` (800 lines, so skim the content parts), `HOMEPAGE_DESIGN_SPEC.md`, `TECHNICAL_DIRECTION.md`, `PHASED_ROADMAP.md`, `CONTENT_CATALOGUE_AND_TERM_DUMP.md`, `CLAUDE_CODE_WORKFLOW.md`, `Docs/DECISIONS.md`, `Docs/PHASE_CHECKLIST.md`, `OPUS_HANDOFF_PROMPT.md`. **Look at every image in `Reference Images/`**, because they set the visual bar. Also skim `~/.claude/fable-week/AUDIT.md` for setup rules that apply.

Constraints from my global setup:
- Windows 11 on the Pro plan, so usage is limited.
- pnpm or npm is fine. Use `uv` for any Python.
- Deploy on Vercel later.
- The folder isn't a git repo yet. Run `git init` and commit with the `gitmoji-commit` skill at each checkpoint.
- Subagents: see the delegation section below.

## How to work
1. **Blind-spot pass.** List what's missing, contradictory or risky in the docs, and what I probably haven't thought about. For example:
   - performance budgets for 3D on laptops and phones
   - the art pipeline, and asset sourcing and licensing for space imagery
   - science accuracy and sourcing
   - SEO for a 3D site
   - accessibility of a canvas-heavy UI
   - scope creep
2. **Interview me** (grill-me style): **at most 8 questions**, one at a time, each with your recommended answer. Ask first the ones that would change the architecture or the visual direction. Skip anything the docs already settle. Also ask which parts I most want built this week.
3. Stay in plan mode until I approve. The plan should **lead with the decisions most likely to change**. It should also say which sections you'll build yourself this week and which you'll leave for Opus.
4. After I approve, produce the deliverables below **in order**. The next-week prompt (deliverable 4) gets a first draft right after the plan docs. Update it after every build checkpoint, so it's always current if the session ends early.

## Deliverables
1. **Plan docs.**
   - Tighten and correct `PROJECT_BLUEPRINT.md`, `TECHNICAL_DIRECTION.md`, `PHASED_ROADMAP.md` and `HOMEPAGE_DESIGN_SPEC.md` in place.
   - Write `ARCHITECTURE.md`. Cover the 3D scene architecture: how scenes load and unload per route, the render-loop budget, fallbacks, and the shader and asset strategy. Also cover the content model and the route and component boundaries.
   - Record every changed decision in `Docs/DECISIONS.md` (the decision, the reason, and the alternatives rejected).
   - Update `CLAUDE.md` so it stays short, and give it a `Verify: <command>` line once the stack is decided.
2. **`prototype/look.html`**: a quick, throwaway, single-file check of the **hero + atlas look and feel** that I can review before you build. Use `/effort medium` here if you like. Open it with Playwright, compare the screenshots to `Reference Images/`, and iterate at most 3 times. Show me the screenshots and get my OK on the look before step 3. Skip this only if you'd rather prototype directly in the real codebase, and tell me why.
3. **Build the foundation yourself.** Pick the parts where your judgment matters most and where Opus is most likely to go wrong. By default that means:
   - Phase 0: the scaffold, tooling, design tokens, lint, and `Verify`.
   - The 3D scene system: the loader, the render-loop budget, the reduced-motion and low-power fallbacks.
   - The real homepage hero and atlas.
   - The content model, with one fully authored example subject page.

   Leave the repetitive work for Opus (more subject pages, filler sections, polish passes). At each checkpoint:
   - build and lint;
   - take Playwright screenshots at 1440×900 and 390×844, plus one with reduced motion;
   - look at the screenshots yourself and fix anything that looks generic;
   - commit;
   - update the next-week prompt.
4. **`OPUS_NEXT_WEEK_PROMPT.md`** (and delete the old ChatGPT `OPUS_HANDOFF_PROMPT.md`). This is the first prompt I'll give a fresh Opus 5.5 session next week. Opus won't remember this session, so it must stand alone. Include:
   - what's built, with commit hashes;
   - the docs to read first, in order;
   - rules Opus must not change (the visual language, the architecture boundaries, performance budgets);
   - **the next session only, in detail**: its scope, its acceptance criteria, the verify steps (build, lint, Playwright screenshots at desktop and phone widths, compared against `prototype/look.html` and `Reference Images/`), and a clear stop point;
   - the later phases, briefly, each sized for one Opus session;
   - a short self-review checklist Opus should run on its screenshots, standing in for your review.
5. A final reply of 10 lines or fewer covering:
   - what you built and what you changed, and why;
   - the risks I should watch;
   - what Opus does first next week.

## Save Fable usage: delegate routine coding to Opus subagents
- You're the orchestrator. Write the hard core yourself: the parts where taste or architecture judgment matters.
- Hand routine, well-specified coding to subagents with `model: "opus"`. That covers scaffolding, config, repetitive components, wiring, tests, and fixes from your review.
- Use `model: "sonnet"` for lookups and research.
- Give each subagent a tight, standalone spec covering:
  - the files to touch;
  - the interfaces it must follow;
  - the docs to read;
  - the acceptance checks;
  - "report back in 10 lines or fewer". Don't ask it to return whole files.
- Review each result before the next step: the diff, plus screenshots for UI work. If a subagent misses twice, do that part yourself.
- Run subagents one at a time when they touch the same files. Run them in parallel only when their files don't overlap.

## If usage runs low
I'll watch claude.ai and tell you "wrap up" when my Fable usage is low. When I do, finish the current step, commit, and bring `OPUS_NEXT_WEEK_PROMPT.md` up to date before anything else.
