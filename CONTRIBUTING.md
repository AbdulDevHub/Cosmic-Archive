# Contributing to Cosmic Atlas

Thanks for wanting to help. New places, better scenes, faster shaders, bug fixes and accessibility fixes are all welcome.

## Getting Started

1. Fork the repo and clone your fork. You need Node 20.9 or newer.
2. `npm install`, then `npm run dev` and open http://localhost:3000.
3. Make a branch: `git checkout -b my-change`.

## Before You Open a Pull Request

- `npm run check` passes (types, lint and the sourcing check).
- For anything visual: `npm run build`, then `npm run shots`, and look at the screenshots in `screenshots/` at 1440x900, 390x844 and reduced motion. Add a before and after to the pull request.
- Keep the pull request to one change, and say what it does and how you checked it.

## The House Rules

These keep the site what it is. The long versions are in `AGENTS.md` and `context/`.

- **The cosmos alone.** Scenes show space and nothing over it: no rings, ticks, lines or HUD panels. Each view gets a name and one line of at most twelve words.
- **Every line is true.** No fact, number or name from memory. Add the source to `src/content/places.ts` with the date you checked it; `npm run check` fails without it.
- **Our own art only.** Scenes are drawn in code (WebGL shaders). Never add telescope photos or someone else's art or audio.
- **Works without 3D.** Every page must still make sense as plain HTML with its still image.
- **Boundaries.** Only `src/scene/` imports three. Pages use `<SceneSlot>`. Content holds facts; components hold layout.
- **Budgets.** The performance limits in `context/ARCHITECTURE.md` section 3.9 are hard limits.
- **New dependencies** need a reason; say why in the pull request.

## Adding a New Place

Look at `context/IDEAS.md` for places that are wanted. A place needs a scene in `src/scene/scenes/`, an entry with sources in `src/content/places.ts`, and stills from `npm run posters`. Open an issue first for anything big, so we can agree on it before you build.

## Reporting Bugs and Ideas

Use the issue templates. For a bug, give the page, the browser and device, and what you saw.

## Code of Conduct

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree your contribution is released under the [MIT License](LICENSE).
