# Cosmic Archive: Design Spec

**Status:** v3, 2026-11-20; S1b changes 2026-11-21 (no About, no Pause, sound, the deep sky, zoom and drag in places: D-099 to D-102). Rewritten after the owner's read-through: the site is a spectacle to look at, not an atlas to read (D-092). Replaces v2 (2026-11-11, in git), whose ink layer, vessel and reading pages are gone.
**Reference for the look:** the scenes themselves. The palette, type and the galaxy's look still come from `prototype/look.html`, without its ink and vessel.

## 1. The idea: the universe, to look at

The cosmos fills the window and is the whole picture. A visitor moves through it by clicking: from the cosmic web into a galaxy, then into one of its places, and back out. The words are a name and one line per view.

- **Cosmos alone.** No rings, ticks, contours, leader lines, measured baselines, vessel or trail are drawn over the scenery (D-094). The universe has no lines on it, so the site draws none.
- **Clear shapes, confident colour.** Stylised real-time scenery with real depth, not photorealism. It borrows a principle from good science animation, not anyone's artwork.
- **Every move is a flight.** Changing view is never a cut: the camera glides between stops, dives into a place, and the place grows in as the screen passes through its own dark colour (D-096).

## 2. Bans

The start page and the header are the exception, by the owner's word (D-107): they follow `Home.png`, with its gradient headline, glass bar and dock, glowing pill button, spaced line above the headline, and a ship. Everywhere else, these hold:

These make the site generic or break the idea. Do not introduce them.

- Glass or blurred panels, HUD frames, hex grids, scan lines, corner brackets, fake coordinates or readouts.
- Gradient-filled text. Neon glow on UI. Pill-shaped navigation.
- Lines drawn over the scenery: orbits, rings, ticks, contours, leader lines, grids (D-094). A spaceship of any size.
- Lens-flare stock imagery. Any embedded photograph.
- Tracked uppercase "eyebrow" lines above headlines; section numbering; rows of identical cards; hero statistics.
- Paragraphs on a scene screen. One name and one line, at most twelve words (enforced by `npm run check`).
- Dim grey text. Text over a bright part of a scene without its dark halo.
- Sound before the visitor's first click, tap or key; camera spins; fast or flashing motion. The opening glide on `/` is short, and any input takes over from it.
- Thin dark lines in the scenery, even as dust: dust is drawn as soft drifts.

## 3. Colour

Tokens live in `src/styles/tokens.css` in OKLCH, copied from the approved prototype.

| Token | Value | Use |
|---|---|---|
| `--space` | `oklch(0.13 0.04 275)` | Page background. Deep indigo, never pure black |
| `--space-2` | `oklch(0.18 0.05 275)` | Raised surfaces (rare) |
| `--ink` | `oklch(0.95 0.02 85)` | Text. Warm white |
| `--ink-2` | `oklch(0.82 0.03 85)` | Secondary text. Still above 4.5:1 on `--space` |
| `--beacon` | `oklch(0.85 0.13 82)` | The one UI accent: hotspots, focus, the loader. Warm gold |
| `--gold` `--ember` `--rose` `--violet` `--azure` `--teal` | scenery | Used by scenes only, never for UI chrome |

Rules:

- One accent in the interface (`--beacon`). Everything else in the UI is ink on space.
- Colour belongs to the scenery. Each place has a three-colour palette: black hole gold, ember, violet; galaxy azure, violet, gold; nebula rose, teal, gold; quasar azure, white, ember.
- Each place also has a veil colour: its own darkness, which the screen passes through on the way in and out (`content/places.ts`).
- Text carries a soft dark halo in `--space`, so it reads over any frame.

## 4. Type

| Role | Face | Notes |
|---|---|---|
| Display | Google Sans Flex (variable), regular for headlines, 500 for names and buttons (D-108; was Syne D-026, then Outfit D-107) | The place's name, the wordmark, the start page and header. No serif anywhere |
| Text and UI | Hanken Grotesk | The one line, buttons, About |
| Hotspot names | Hanken Grotesk, uppercase, 11.5 px, letter-spacing 0.14em | Only beside a hotspot |

Scale: 1.25 ratio from a 17 px base; a place's name `clamp(2rem, 4.2vw, 3.6rem)`. Check every name at 390 px.

## 5. Hotspots

- A hotspot is a small soft light in `--beacon`: a 14 px ring with a dark edge (so it reads over the galaxy's bright core) and a breathing dot, on a 44 px target.
- Its name shows beside it on hover and focus. A touch screen has no hover, so there the name always shows.
- Hotspots are real links (or a button, for the galaxy seen from the web), laid over the canvas where the scene says the place is. They hide while a move is under way and when their point leaves the screen.

## 6. Motion

- Slow and continuous scenery: the galaxy turns, gas drifts.
- The camera moves only in response to the visitor, except the opening glide on `/` (the web to the galaxy, 3.2 s, once a visit), which any input takes over.
- A click's move is a timed glide, eased in and out: about 1.9 s between stops, 1.4 s for a dive, 1.7 s for an arrival (D-097). The wheel, a pinch, a drag and the keys ease by closing part of the gap each frame.
- DOM transitions 150 to 300 ms, ease-out, opacity and transform only. The veil fades in 500 ms.
- There is no Pause control (D-099): the device's own reduced-motion setting decides. With it there is no glide, dive or growth: each view is one still frame, and a move between scenes is a 220 ms cross-fade through the veil.

## 7. The screen

Every scene route is one screen: the scene fills the window and nothing scrolls.

### 7.0 The start page (D-107)

`/` opens on the owner's `Home.png`, as our own live scene: the galaxy large on the right; a planet's horizon across the lower left with a thin blue limb; two moons; asteroids at the edges; a ship crossing toward the galaxy with blue engine trails. On the left: "Explore • Discover • Be inspired", "The Universe Awaits" (the last two words in a violet-to-blue gradient), one line, and **Begin Your Journey**, a glowing violet-to-blue pill. Bottom left "Scroll to explore" (the dock of sections moved into the header, D-116). Begin, the wheel or a swipe is the way in: the music starts, the ship speeds away, the planet and rocks sweep past, and the camera lands on the galaxy (3.8 s). Home flies back out. On a phone: the galaxy at the top, the words and Begin at the bottom over the planet; no dock.

### 7.1 Header (replaced by D-107)

The emblem and "COSMIC ARCHIVE" in widely spaced capitals (it leads home); in the middle the menu, the flared glass dock of Science, Explore, Learn and Discover, hanging from the window's top edge (D-116); search; a round Sound button. The menu's sections and search are marked "coming soon". On a phone only the wordmark and Sound. What follows is the header before D-107.


Wordmark "Cosmic Archive" in the display face, left; it leads home to the universe. Right: **Sound**, a speaker with waves when on and a cross when off, with the word (its icon only on a phone). No background: every page is a scene, and the header's empty middle can be dragged through.

### 7.1a Sound (D-100)

The owner's own music, "Magical Space", loops quietly under every scene; each flight (a dive, a pull-out, a glide between stops) carries a soft whoosh made in the browser, and the music dips under it. Browsers allow sound only after the visitor does something, so the music fades in after the first click, tap or key. On by default; the Sound button turns it off, and the choice is remembered. Nothing plays while the tab is hidden.

### 7.1b Saying the scene can be dragged (D-102)

Every scene shows a grab cursor (a closed hand while dragging). Until the visitor first drags a scene, a quiet line sits in the bottom middle (on a phone, under the header): two swaying arrows and "Drag to look around · scroll to zoom" ("pinch to zoom" on touch). After the first drag it fades and does not come back.

### 7.2 The universe, `/`

- Three stops of one scene: **2** the cosmic web, **1** the whole galaxy, centred, **0** close in over the disc.
- Lower left: the stop's name and its line, changing softly as the stop changes.
- Lower right (a phone: lower left, under the words): **Zoom Out**, a glowing pill button with a lens icon (D-115, D-116): from the galaxy out to the cosmic web (D-117); on the web it is dimmed until a wider view exists. Places, and the galaxy from the web, are entered by clicking them; the web is reached with the wheel or a pinch. The atlas opens close in; the wheel and a pinch zoom freely.
- Hotspots: at stops 0 and 1, **Black hole** (the core) and **Nebula** (in an arm); at stop 2, **Quasar** (a far, bright galaxy) and **The galaxy** (ours, which glides back in).
- Drag turns the galaxy (and tilts it, with a mouse); the wheel and a pinch zoom.
- Keys: + and − zoom, the arrows turn and tilt, Escape goes one stop further out.
- Behind the galaxy, the deep sky: clouds of violet and azure gas, soft dust, dense stars and a few bright ones with light spikes. It thins toward the web, where the dark between galaxies is the point (D-101).

### 7.3 A place, `/black-hole`, `/nebula`, `/quasar`

- The place, centred and as large as the window allows, in a full deep sky: the black hole at a galaxy's crowded heart, its glow bent into a ring by the hole; the quasar in the sparser sky between galaxies; the nebula wide, cool violet and azure on its far side, warm rose where it faces its cluster (D-101).
- Lower left: its name and its line. Lower right: **Zoom Out** only (D-112, D-115, D-116). The place opens all the way in (the black hole 2.6 times its framing, the quasar 14 times, into its glare and disc); the wheel and a pinch zoom out to the framing and back. Zoom Out shrinks the place away and returns to the galaxy close in (or the web, for the quasar), dived into the place's light, then pulls back.
- Drag turns around the black hole and the quasar (and lifts above or below the disc); on the nebula it pans, the stars behind moving less. The wheel and a pinch zoom; pulled on past the framing, the wheel leaves. Escape leaves; + and − zoom.

### 7.4 The flow between scenes (D-096)

1. The camera dives into the hotspot's place (1.4 s); the look turns toward it and the distance closes on it.
2. Two thirds of the way in, the veil falls: the screen fades to the place's own dark colour.
3. The place's page opens under the veil. If its scene takes more than 400 ms to draw, a small gold light breathes in the middle: the loader.
4. The place's first frame is drawn small and far off; the veil lifts as it grows to full size (1.7 s).

Going out is the same, reversed. The veil never stays down: a page that draws no scene lifts it at once, and it gives up after six seconds.

## 8. About

Removed (D-099). The sources behind the site's few lines stay in `content/places.ts`, checked by the build.

## 9. Responsive and accessibility

- Designed at 390, 768 and 1440 wide. Phone compositions are their own, not shrunk.
- Every place is a real link; the scene is decoration, hidden from assistive technology. Without the scene the hotspots are a plain list of links under the words.
- The device's reduced-motion setting stills everything (there is no Pause control, D-099). The Sound button is a real toggle (`aria-pressed`).
- Visible focus rings in `--beacon`. Touch targets at least 44 px.
- Every screen is complete with the scene replaced by its poster: name, line, places, Zoom Out.

## 10. What the prototype settled, and what is still open

Settled and kept: the galaxy's colour sweep (gold heart, ember, rose, violet, azure, a teal rim); fullness from layers (body glow, arm haze, dust sprites that darken what is behind them, a halo, a companion); large glow sprites as instanced quads.

Open, for the beauty sessions (S2 to S4 in `PHASED_ROADMAP.md`):

- ~~Diving into the core passes through disc stars, which grow into large soft discs.~~ Done in S2 (D-111): near stars are capped and sharpened.
- The cosmic web is thin on a phone at the `low` particle budget (phone polish waits, D-110).
- ~~The galaxy could be denser between its arms.~~ S2 (D-111) added filaments, clouds and clumps; the outermost arm still has a darker gap inside it.
- The nebula's young cluster is a tidy pattern of dots; it wants to look more natural.

## 11. Self-review checklist for screenshots

Run this on every screenshot before calling a visual task done.

1. Is anything drawn over the scenery that the universe does not have: a ring, tick, line, grid or vessel, or dust that reads as a thin line? Remove it.
1a. Is any part of the frame empty, flat dark? The deep sky should fill it (except the web, a little).
2. Is the subject centred and large, filling the frame without being cropped awkwardly?
3. Is there any glass, glow-on-UI, gradient text, pill nav or HUD element? Remove it.
4. Are the words only the name and one line, in the lower left, readable over the brightest frame behind them?
5. One accent colour in the UI, and is it `--beacon`?
6. Does every hotspot look clickable, sit on its place, and stay clear of the words and buttons?
7. Phone: is the composition deliberate, with nothing clipped and no horizontal scroll?
8. Reduced motion: is the still frame as good as the moving one?
9. Mid-move (a filmed dive): is there ever a flash of black, a jump, or a frame with no veil and no scene?
