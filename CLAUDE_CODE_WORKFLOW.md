# Cosmic Archive — Claude Code Workflow

## Owner's environment

The owner has confirmed that the following are already installed on their Windows machine:

- Node.js
- npm
- Git
- Claude Code

The selected coding agent is Claude Code using **Opus**. Do not repeat setup/install instructions unless the agent encounters a specific environment failure.

## Starting the session

1. Extract this handoff package into the intended project root (or copy the included documents into the existing repository root).
2. Open PowerShell in that directory.
3. Start Claude Code with the owner's Opus model selected in the CLI.
4. Paste the contents of `OPUS_HANDOFF_PROMPT.md`.

The exact way to select a model can depend on the installed Claude Code version and account configuration. The owner will select Opus in their own environment; do not invent model flags if unsure.

## Efficient working style

- Read source documents once at the start of a major task.
- Use Plan Mode for the initial repository audit and architecture plan.
- Then execute the authorized first milestones: Phase 0 and Phase 1, separately.
- Keep each milestone bounded and avoid building later phases early.
- Make small, reviewable edits; preserve existing repository contents.
- Prefer existing platform capabilities over new packages.
- Do not install Motion, Three.js, React Three Fiber, Drei, MDX, audio libraries, a CMS, or a database during Phase 0/1.
- Do not spend tokens generating broad alternative lists when the brief already establishes a direction. Make a recommendation, explain trade-offs briefly, and record it.
- Use `/clear` for a genuinely new task when prior conversation context is no longer needed; use Claude Code's supported resume/compaction features as appropriate.

## Permission and repository discipline

- Keep normal permission prompts enabled; never use a bypass-permissions mode.
- Inspect `git status` and existing files before changes.
- Do not delete, overwrite, or reorganize user files without a clear reason.
- Do not push, deploy, publish, purchase, connect external accounts, or send content to external services.
- Never commit secrets, `.env*` files, local machine settings, or build output.
- Do not create a Git commit if the working tree contains unexplained pre-existing changes. If identity is not configured, report that rather than inventing it.

## Required end-of-task report

1. Outcome and active phase.
2. Files created or modified.
3. Technical decisions made and any meaningful deviation from the brief.
4. Commands / checks actually run and their results.
5. Screens or routes that the owner should inspect.
6. Known limitations and decisions deferred.
7. Git status and checkpoint status.
8. The next recommended task—then stop.

## Credit-conscious prompt pattern

For future work, use this pattern:

> Read `CLAUDE.md` and the relevant project docs. Work only on [specific phase and task]. Inspect the existing implementation first. Preserve existing conventions and user changes. Implement the smallest complete result that meets the acceptance criteria. Do not add later-phase features or speculative dependencies. Run relevant checks, update the phase checklist and decisions log, summarize changed files and known issues, and stop without starting the next task.
