/**
 * The places of the universe and the few words each one carries (D-092). Facts only: no layout,
 * no styling (ARCHITECTURE.md 1).
 *
 * Every line is a claim, so every line names the sources it came from, each fetched and read on
 * its `checked` date. `npm run check` and the build both fail on a line with no source, on a
 * source that is not listed, and on a line longer than twelve words.
 *
 * Where a hotspot stands is named, not measured: `anchor` is a place the atlas scene knows
 * (`ANCHORS` in src/scene/scenes/atlas/world.ts).
 */

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** The date the page was fetched and read. */
  checked: string;
}

/** A real observation, linked and never embedded (imagery rule). */
export interface Observation {
  label: string;
  publisher: string;
  url: string;
}

/** The atlas's zoom stops: 0 close in, 1 the whole galaxy, 2 the cosmic web. */
export type StopIndex = 0 | 1 | 2;

export interface Stop {
  zoom: StopIndex;
  name: string;
  line: string;
  sources: readonly string[];
}

export type PlaceId = "black-hole" | "nebula" | "quasar";
export type AtlasAnchor = "core" | "arm" | "quasar" | "home";

export interface Place {
  id: PlaceId;
  name: string;
  line: string;
  sources: readonly string[];
  /** Where its hotspot stands in the atlas, and at which stop it shows. */
  anchor: AtlasAnchor;
  stop: StopIndex;
  /** The colour the screen passes through on the way in and out: the place's own darkness. */
  veil: string;
  observations: readonly Observation[];
}

export const SOURCES: readonly Source[] = [
  {
    id: "nasa-cosmic-web",
    title: "Slime Mold Simulations Used to Map Dark Matter Holding Universe Together",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/missions/hubble/slime-mold-simulations-used-to-map-dark-matter-holding-universe-together/",
    checked: "2026-11-16",
  },
  {
    id: "nasa-galaxies",
    title: "Galaxies",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/galaxies/",
    checked: "2026-11-17",
  },
  {
    id: "nasa-galaxy-types",
    title: "Galaxy Types",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/galaxies/types/",
    checked: "2026-11-17",
  },
  {
    id: "nasa-anatomy",
    title: "Black Hole Anatomy",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/black-holes/anatomy/",
    checked: "2026-11-20",
  },
  {
    id: "nasa-too-close",
    title: "What Happens When Something Gets 'Too Close' to a Black Hole?",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/what-happens-when-something-gets-too-close-to-a-black-hole/",
    checked: "2026-11-17",
  },
  {
    id: "nasa-spaceplace-nebula",
    title: "What Is a Nebula?",
    publisher: "NASA Space Place",
    url: "https://spaceplace.nasa.gov/nebula/en/",
    checked: "2026-11-17",
  },
  {
    id: "nasa-hubble-quasars",
    title: "Hubble Quasars",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-quasars",
    checked: "2026-11-20",
  },
  {
    id: "nasa-webb-quasars",
    title: "NASA's Webb Will Use Quasars to Unlock the Secrets of the Early Universe",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/missions/webb/nasas-webb-will-use-quasars-to-unlock-the-secrets-of-the-early-universe/",
    checked: "2026-11-20",
  },
];

export const STOPS: readonly Stop[] = [
  {
    zoom: 0,
    name: "Inside the disc",
    line: "Spiral arms, rich in gas, where the youngest stars form.",
    sources: ["nasa-galaxy-types"],
  },
  {
    zoom: 1,
    name: "A spiral galaxy",
    line: "An island of stars, gas and dust, held together by gravity.",
    sources: ["nasa-galaxies"],
  },
  {
    zoom: 2,
    name: "The cosmic web",
    line: "Every point of light here is a galaxy.",
    sources: ["nasa-cosmic-web"],
  },
];

export const PLACES: readonly Place[] = [
  {
    id: "black-hole",
    name: "Black hole",
    line: "Where gravity reshapes space and time.",
    sources: ["nasa-anatomy", "nasa-too-close"],
    anchor: "core",
    stop: 1,
    veil: "#140b0a",
    observations: [
      { label: "The first image of a black hole, in the galaxy Messier 87 (2019)", publisher: "European Southern Observatory", url: "https://www.eso.org/public/news/eso1907/" },
      { label: "The first image of the black hole at the centre of our own galaxy (2022)", publisher: "European Southern Observatory", url: "https://www.eso.org/public/news/eso2208-eht-mw/" },
    ],
  },
  {
    id: "nebula",
    name: "Nebula",
    line: "Clouds where stars are born, and where stars leave their mark.",
    sources: ["nasa-spaceplace-nebula"],
    anchor: "arm",
    stop: 1,
    veil: "#1c0b1a",
    observations: [
      { label: "Webb's infrared view of the Pillars of Creation (2022)", publisher: "NASA Science", url: "https://science.nasa.gov/missions/webb/nasas-webb-takes-star-filled-portrait-of-pillars-of-creation/" },
      { label: "Webb's Cosmic Cliffs in NGC 3324 (2022)", publisher: "NASA Science", url: "https://science.nasa.gov/missions/webb/nasas-webb-reveals-cosmic-cliffs-glittering-landscape-of-star-birth" },
      { label: "Webb's Ring Nebula (2023)", publisher: "ESA/Webb", url: "https://esawebb.org/images/weic2320a/" },
    ],
  },
  {
    id: "quasar",
    name: "Quasar",
    line: "Some of the brightest beacons in the distant universe.",
    sources: ["nasa-webb-quasars", "nasa-hubble-quasars"],
    anchor: "quasar",
    stop: 2,
    veil: "#0a0e1e",
    observations: [
      { label: "Hubble's closest-ever look at the quasar 3C 273 (2024)", publisher: "NASA Science", url: "https://science.nasa.gov/missions/hubble/nasas-hubble-takes-the-closest-ever-look-at-a-quasar/" },
      { label: "Webb's black hole that formed before its galaxy, Abell2744-QSO1 (2026)", publisher: "ESA/Webb", url: "https://esawebb.org/news/weic2609/" },
    ],
  },
];

/** Real galaxies and the cosmic web, for About. */
export const ATLAS_OBSERVATIONS: readonly Observation[] = [
  { label: "The Hubble Deep Field and Ultra Deep Field, thousands of galaxies in tiny patches of sky", publisher: "NASA Science", url: "https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubble-deep-fields/" },
  { label: "Webb's JADES deep field, more than 45,000 galaxies in one view", publisher: "NASA Science", url: "https://science.nasa.gov/asset/webb/jwst-advanced-deep-extragalactic-survey-nircam-compass-image/" },
];
