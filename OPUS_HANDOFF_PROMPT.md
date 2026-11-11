# First Claude Code Prompt — Cosmic Archive (Claude Opus)

You are my lead product architect, visual-design-minded frontend engineer, and implementation partner for **Cosmic Archive**. I am using Claude Code with Opus. I have already installed Node.js, npm, Git, and Claude Code on Windows. Do not spend time repeating installation steps.

I have placed the project handoff documents in this workspace. Before editing anything, read:

- `README_START_HERE.md`
- `CLAUDE.md`
- `PROJECT_BLUEPRINT.md`
- `HOMEPAGE_DESIGN_SPEC.md`
- `TECHNICAL_DIRECTION.md`
- `PHASED_ROADMAP.md`
- `CONTENT_CATALOGUE_AND_TERM_DUMP.md`
- `CLAUDE_CODE_WORKFLOW.md`

## Product understanding

Cosmic Archive is an immersive, educational visual atlas of the universe. It should make visitors feel that the cosmos is enormous, beautiful, and full of things worth discovering. The universe—not a fictional interface—is the star.

The visual direction combines colourful, approachable, original science-storytelling principles with cinematic 3D depth. Do not copy Kurzgesagt's distinctive artwork or layouts. The tiny, elegant explorer vessel is a small scale cue in a vast cosmic scene. Star Trek is only a minor inspiration for the appeal of a vessel or distant starbase; do not make the website look like a Star Trek bridge or generic sci-fi HUD.

The experience is a hybrid of visual exploration and education. Lead with beauty and inspiration, keep the initial text minimal, and progressively reveal deeper explanations. Provide both free browsing and natural learning journeys. The first four flagship destinations are Black Holes, Galaxies, Nebulae, and Quasars. Established science and hypothetical ideas may both appear, but must be clearly distinguished. Star Trek / fictional technology is a separate future collection. Blender is optional for later asset creation, not a required runtime dependency.

## Your job

### Part A — Audit and plan

1. Inspect the current working directory, repository, Git state, files, and installed toolchain. Preserve any existing user work. Do not assume the directory is empty.
2. Read the supplied documents and identify any inconsistencies, missing decisions, or implementation risks.
3. Evaluate the proposed technical direction. The preferred starting point is Next.js App Router + React + TypeScript + npm + ESLint + CSS Modules / global CSS variables, but you may recommend a better fit if you explain the trade-offs and current compatibility. Do not change the stack merely for novelty.
4. Create a concise, practical architecture and delivery plan covering the first two phases and the later roadmap at a high level. Include routes, component boundaries, asset organization, content strategy, accessibility, performance, and verification.
5. Create or update `docs/DECISIONS.md` and `docs/PHASE_CHECKLIST.md` so decisions and progress persist beyond this chat.

Use read-only Plan Mode for this audit/plan if available. The plan should be concise enough to review and specific enough to implement. Do not waste time repeating the entire brief back to me.

### Part B — Implement the first two milestones

I authorize you to proceed with the initial implementation after you have formed the plan. Work in two separate, bounded milestones and verify the first before beginning the second.

**Milestone 1 — Phase 0: Project foundation**

- Scaffold or adapt the project using the chosen stack.
- Establish a clean, maintainable folder structure.
- Set up the app shell, global design tokens, styling approach, scripts, linting, and TypeScript configuration as appropriate.
- Put `CLAUDE.md` and the handoff documents in sensible locations; do not duplicate or overwrite them unnecessarily.
- Add a clear `README.md` with local run instructions.
- Create/update the phase checklist and decision log.
- Run the development/build/lint/type checks that are actually configured and fix issues introduced by your work.
- Do not install dependencies for later phases.

**Milestone 2 — Phase 1: Static homepage skeleton**

Only begin after Phase 0 verifies successfully.

Build the responsive homepage according to `HOMEPAGE_DESIGN_SPEC.md`. It should already feel intentional and visually polished using static or lightweight local artwork, composition, typography, and colour. The hero should show an immense cosmic environment with a tiny explorer vessel. Include the agreed homepage sections: navigation, hero, atlas preview, four flagship destinations, curated journeys, theoretical frontiers, and footer. Use working routes/links or clearly non-interactive presentation; no fake buttons.

If original/appropriately licensed artwork is not yet available, choose a coherent and maintainable interim asset strategy. Do not hotlink arbitrary images or copy protected artwork. Make the fallback visually deliberate rather than leaving a broken image or generic empty rectangle.

## Strict boundaries for this first handoff

Do **not** implement Phase 2 or later yet. Specifically, do not build:

- Elaborate animated cosmic backgrounds or a long forced cinematic intro.
- A fully interactive cosmic atlas or scientifically scaled universe map.
- Full educational subject pages or a large content catalogue.
- Three.js / React Three Fiber scenes, complex shaders, or WebGL interactions.
- A Blender automation pipeline or Blender runtime integration.
- Sound, narration, user accounts, a CMS, database, analytics, payments, or deployment.

Do not add Motion, Three.js, React Three Fiber, Drei, MDX, audio, CMS, or database dependencies unless you discover a compelling immediate need; explain and ask before adding a dependency outside the initial stack.

## Working rules

- I want you to use your engineering judgement. Make routine, reversible choices independently and record them. Ask me only for a genuinely blocking decision, destructive action, external account/service, purchase or unexpected cost, or a significant change to the product direction.
- Keep normal Claude Code permission prompts enabled. Do not use permission-bypass mode.
- Preserve all existing work. Inspect before overwriting or deleting anything.
- Do not push to Git remotes, deploy, publish, or connect external services.
- Respect Windows / PowerShell paths and commands when relevant.
- Do not invent scientific statements, sources, coordinates, image credits, or test results.
- Ensure semantic HTML, keyboard accessibility, clear focus states, readable contrast, and responsive layouts. Respect reduced-motion preferences even though advanced motion is deferred.
- Keep the experience fast on ordinary laptops and mobile devices.

## Stop condition and completion report

After Phase 0 and Phase 1 are implemented and verified, STOP. Do not begin Phase 2 automatically.

Report:

1. The architecture plan and any changes you made to the proposed stack.
2. What was completed in each milestone.
3. Files created/modified.
4. Commands/checks run and exact results.
5. How I can run and view the website locally.
6. Any missing artwork, limitations, or unresolved decisions.
7. Git status and whether a safe local checkpoint was created.
8. The single best next task for Phase 2.

The goal is not to build the whole universe in one attempt. Build a strong, polished foundation and first homepage, then stop for my review.
