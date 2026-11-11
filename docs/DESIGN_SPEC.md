# Cosmic Archive: Design Spec

**Status:** v2, 2026-11-11. Site-wide visual language first, homepage second. Replaces the ChatGPT homepage spec v1.1.
**Reference for the look:** `prototype/look.html` and the screenshots in `prototype/shots/`. When this document and the approved prototype disagree, the prototype wins and this document gets corrected.

## 1. The idea: a Living Atlas

A star chart that came alive. Two layers, always both present:

1. **The cosmos:** luminous, colourful, stylised real-time scenery with real depth. Clear shapes and confident colour rather than photorealism.
2. **The ink:** a map-maker's fine linework drawn over it. Hairline orbits and rings, tick marks, small labels, a few words of annotation.

Three motifs carry the identity everywhere:

- **The trail.** The tiny vessel leaves a thin glowing line. That line is the ink: it draws the map on the homepage, connects the stops of a journey, and runs down the margin of a subject page as its thread.
- **Line style is evidence.** Solid ink means observed or established. Long dashes mean theoretical, short dashes hypothetical, dots speculative. Like the dashed coastline of an unsurveyed shore. Always paired with the word.
- **The vessel is tiny.** A few pixels of hull and a trail. It gives scale and direction and is never the subject. No cockpit, no weapons, no detail shots.

This is original work. It borrows a principle from good science animation (clear shapes, bold colour, friendly explanation), not anyone's artwork, characters or layouts.

## 2. Bans

These make the site generic or break the idea. Do not introduce them.

- Glass or blurred panels, HUD frames, hex grids, scan lines, corner brackets, fake coordinates or readouts.
- Gradient-filled text. Neon glow on UI. Pill-shaped navigation.
- A large or detailed spaceship. Lens-flare stock imagery. Any embedded photograph.
- Tracked uppercase "eyebrow" lines above headlines; 01/02/03 section numbering; rows of identical cards; hero statistics; side-stripe borders.
- Dim grey text. Text placed over a bright part of a scene without a calm zone.
- Scroll hijacking, forced intros, autoplay sound, camera spins, fast or flashing motion.

## 3. Colour

Tokens live in `src/styles/tokens.css` in OKLCH. Values below are the starting set; the prototype locks them.

| Token | Value | Use |
|---|---|---|
| `--space` | `oklch(0.13 0.04 275)` | Page background. Deep indigo, never pure black |
| `--space-2` | `oklch(0.18 0.05 275)` | Raised surfaces (rare) |
| `--ink` | `oklch(0.95 0.02 85)` | Text and linework. Warm white |
| `--ink-2` | `oklch(0.82 0.03 85)` | Secondary text. Still above 4.5:1 on `--space` |
| `--beacon` | `oklch(0.85 0.13 82)` | The one UI accent: links, beacons, focus. Warm gold |
| `--gold` `--ember` `--rose` `--violet` `--azure` `--teal` | scenery | Used by scenes and illustrations only, never for UI chrome |

Rules:

- One accent in the interface (`--beacon`). Everything else in the UI is ink on space.
- Colour belongs to the scenery. Each subject has a three-colour scene palette: Black Holes gold, ember, violet. Galaxies azure, violet, gold. Nebulae rose, teal, gold. Quasars azure, white, ember.
- Body text contrast at least 4.5:1, measured against the brightest frame behind it, not the average.

## 4. Type

| Role | Face | Notes |
|---|---|---|
| Display | Fraunces (variable) | Headlines and subject titles. Regular weight, large optical size. Italic for object names |
| Text and UI | Hanken Grotesk | Body, navigation, buttons |
| Map labels | Hanken Grotesk, uppercase, 11 to 12 px, letter-spacing 0.14em | Only on the chart, attached to a line or beacon. Never as a headline eyebrow |

Scale: 1.25 ratio from a 17 px base; hero headline `clamp(2.75rem, 7vw, 6.5rem)`. Body lines 45 to 75 characters. Paragraphs are short. The hero has one sentence under the headline.

## 5. Linework

- Hairlines are one device pixel wide at every zoom and screen size (drawn in the scene with constant screen-width lines, or in DOM/SVG at 1 px).
- Ink opacity carries hierarchy: 0.9 for the trail and active lines, 0.45 for rings, 0.2 for ticks and construction lines.
- Rings lie in the plane of the thing they describe, so perspective comes for free.
- A beacon is a small ring with a dot, in `--beacon`, with a label on a short leader line. Its ring uses the evidence line style of its destination.

## 6. Motion

- Slow and continuous: the galaxy turns, dust drifts, the vessel moves a little.
- The camera moves only in response to the visitor (scroll, drag, focus) and eases to rest.
- DOM transitions 150 to 300 ms, ease-out, opacity and transform only.
- A "Pause motion" control is always in the header. Reduced-motion visitors get a single still frame and no loop.

## 7. Homepage

The homepage is one scene and one scroll.

### 7.1 Header

Wordmark "Cosmic Archive" in the display face, left. Text links right: Explore, Journeys, Archive, About (only those that exist), then the Pause motion control. No background until the page scrolls, then a solid `--space` bar. Mobile: wordmark plus a menu button opening a full-screen list.

### 7.2 Stage 1, the hero

- The galaxy fills the upper right two thirds of the viewport, tilted, its core off-centre. A few faint rings and ticks around it.
- The vessel is low in the frame, small, its trail curving up to join the outermost ring.
- Bottom left, in the calmest part of the frame: headline **Explore the extraordinary.**, one line of support, a primary action **Begin exploring** (to `/explore`) and a text link **Browse the archive**.
- Supporting line (draft): "A living atlas of the universe, from the worlds around us to its deepest mysteries."
- Phone: the galaxy sits in the top half, the text in the bottom half, the vessel between them.

### 7.3 Stage 2, the chart

Scrolling raises the camera to a higher, more map-like angle. Rings sharpen, beacons and labels appear. Heading: **Where would you like to go?** Beacons at this level: Black Holes (the core), Nebulae (in an arm), Galaxies (the whole disc).

### 7.4 Stage 3, the zoom out

Scrolling further pulls back until the galaxy is one point in a web of thousands. One line: "Every point of light here is a galaxy." Beacons at this level: Quasars, and the galaxy we just left. At the margin, in dashed ink: **Uncharted**, the entry to Theoretical Frontiers.

The three stages are driven by scroll position. The page never takes control of scrolling. A "Skip to destinations" link jumps past the scene.

### 7.5 Below the scene (plain page sections on `--space`)

1. **Destinations.** The four flagships. Not four identical cards: each is a window of its own shape and palette onto a still of its scene, with a title and one sentence.
2. **A journey.** "A star's life" drawn as one branching line: cloud, star, then the fork to white dwarf, neutron star or black hole, with the reason for the fork in a few words.
3. **Uncharted.** The frontiers teaser, drawn entirely in dashed and dotted ink with the evidence legend beside it.
4. **Footer.** Navigation, one sentence about the project, "All imagery is illustration", link to method and sources.

Teaser copy (draft; verify each against a source before launch):

- Black holes: "Where gravity reshapes space and time."
- Galaxies: "Vast islands of stars, gas, dust and dark matter."
- Nebulae: "Clouds where stars are born, and where stars leave their mark."
- Quasars: "Some of the brightest beacons in the distant universe."

## 8. Subject pages

- Open on the subject's own scene with the title and a one-sentence hook. The scene is the top of the page, not a background for the whole article.
- The body is a readable column on `--space`. The trail runs down one margin as a hairline and marks each section.
- Diagrams are flat, bold and labelled: this is where the "clear shapes" principle is strongest.
- Every claim that is not the page's main status shows its evidence label inline. Sources sit at the end with checked dates.
- "What we have actually seen" links out to the real observations; it never embeds them.

## 9. Responsive and accessibility

- Designed at 390, 768 and 1440 wide. Phone layouts are composed, not shrunk.
- Every destination is a real link; the scene is decoration and is hidden from assistive technology. A list view of the atlas is always one control away.
- Visible focus rings in `--beacon`. Touch targets at least 44 px.
- The page is complete and readable with the scene replaced by its still.

## 10. Self-review checklist for screenshots

Run this on every screenshot before calling a visual task done.

1. Could this be any space website? If yes, the ink layer is missing or too faint.
2. Is the vessel smaller than the headline's cap height? Is there exactly one?
3. Is there any glass, glow-on-UI, gradient text, pill nav or HUD element? Remove it.
4. Does text sit in a calm zone, with contrast measured against the brightest pixel behind it?
5. One accent colour in the UI, and is it `--beacon`?
6. Does every interactive thing look interactive, and every non-interactive thing not?
7. Phone: is the composition deliberate, with nothing clipped and no horizontal scroll?
8. Reduced motion: is the still frame as good as the moving one?
9. Does it match `prototype/look.html` in palette, type and line weight?
