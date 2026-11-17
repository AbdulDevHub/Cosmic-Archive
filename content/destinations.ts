/**
 * The atlas's destinations: what each beacon is called, what it says, how certain it is, where it
 * leads, and which source backs its words. Facts only: no layout, no styling (ARCHITECTURE.md 1).
 *
 * Where a beacon stands is named, not measured: `anchor` is a place the atlas scene knows
 * (`ANCHORS` in src/scene/scenes/atlas/world.ts). The atlas is an illustration, not to scale,
 * so no coordinates are invented here (PROJECT_BLUEPRINT.md 6.4).
 *
 * Until its subject page exists (O2 to O4) a destination opens /about; `opens` records where it
 * will lead. Black Holes has its page (F4).
 */

/** PROJECT_BLUEPRINT.md 6.1. Drawn as a line style and always written as a word too. */
export type Evidence = "observed" | "established" | "theoretical" | "hypothetical" | "speculative";

export const EVIDENCE_WORD: Record<Evidence, string> = {
  observed: "Observed",
  established: "Established",
  theoretical: "Theoretical",
  hypothetical: "Hypothetical",
  speculative: "Speculative",
};

/** 1: inside the galaxy. 2: among the galaxies of the cosmic web. */
export type AtlasLevel = 1 | 2;

export type AtlasAnchor = "core" | "arm" | "ring" | "quasar" | "home";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** The date the page was fetched and read. */
  checked: string;
}

export interface Destination {
  id: string;
  level: AtlasLevel;
  anchor: AtlasAnchor;
  label: string;
  /** The map note under the label. */
  note: string;
  evidence: Evidence;
  href: string;
  /** The page this will open once it exists. */
  opens: string;
  /** Ids in `SOURCES` that back the label and the note. */
  sources: readonly string[];
}

/** An idea with no place on the map: it sits at the margin, in dashed ink. */
export interface MarginEntry {
  id: string;
  label: string;
  note: string;
  evidence: Evidence;
  href: string;
  opens: string;
  sources: readonly string[];
}

export const SOURCES: readonly Source[] = [
  {
    id: "nasa-black-hole-types",
    title: "Black Hole Types",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/black-holes/types/",
    checked: "2026-11-17",
  },
  {
    id: "eso-sgr-a-image",
    title: "Astronomers reveal first image of the black hole at the heart of our galaxy",
    publisher: "European Southern Observatory",
    url: "https://www.eso.org/public/news/eso2208/",
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
    checked: "2026-11-16",
  },
  {
    id: "jpl-star-forming-nebulae",
    title: "Star Formation Everywhere You Look",
    publisher: "NASA Jet Propulsion Laboratory",
    url: "https://www.jpl.nasa.gov/images/pia14105-star-formation-everywhere-you-look/",
    checked: "2026-11-16",
  },
  {
    id: "nasa-hubble-quasars",
    title: "Hubble Quasars",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-quasars",
    checked: "2026-11-17",
  },
  {
    id: "nasa-cosmic-web",
    title: "Slime Mold Simulations Used to Map Dark Matter Holding Universe Together",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/missions/hubble/slime-mold-simulations-used-to-map-dark-matter-holding-universe-together/",
    checked: "2026-11-16",
  },
  {
    id: "nasa-cosmicopia-wormholes",
    title: "Cosmicopia: Wormholes, Time Travel, and Faster-Than-Light Travel",
    publisher: "NASA Goddard Space Flight Center (archived)",
    url: "https://science.gsfc.nasa.gov/attic/cosmicopia.gsfc.nasa.gov/qa_sp_sl.html",
    checked: "2026-11-16",
  },
  {
    id: "nasa-apod-multiverse",
    title: "Multiverses: Do Other Universes Exist?",
    publisher: "NASA Astronomy Picture of the Day",
    url: "https://science.nasa.gov/image-article/apod-2006-march-1-multiverses-do-other-universes-exist",
    checked: "2026-11-16",
  },
  {
    id: "cern-extra-dimensions",
    title: "Extra dimensions, gravitons, and tiny black holes",
    publisher: "CERN",
    url: "https://home.cern/science/physics/extra-dimensions-gravitons-and-tiny-black-holes",
    checked: "2026-11-16",
  },
];

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "black-holes",
    level: 1,
    anchor: "core",
    label: "Black holes",
    note: "one waits at the core",
    evidence: "observed",
    href: "/subjects/black-holes",
    opens: "/subjects/black-holes",
    sources: ["nasa-black-hole-types", "eso-sgr-a-image"],
  },
  {
    id: "nebulae",
    level: 1,
    anchor: "arm",
    label: "Nebulae",
    note: "star nurseries in the arms",
    evidence: "observed",
    href: "/about",
    opens: "/subjects/nebulae",
    sources: ["jpl-star-forming-nebulae", "nasa-galaxy-types"],
  },
  {
    id: "galaxies",
    level: 1,
    anchor: "ring",
    label: "Galaxies",
    note: "the whole island of stars",
    evidence: "observed",
    href: "/about",
    opens: "/subjects/galaxies",
    sources: ["nasa-galaxies"],
  },
  {
    id: "quasars",
    level: 2,
    anchor: "quasar",
    label: "Quasars",
    note: "blazing hearts of far-off galaxies",
    evidence: "observed",
    href: "/about",
    opens: "/subjects/quasars",
    sources: ["nasa-hubble-quasars"],
  },
  {
    id: "home-galaxy",
    level: 2,
    anchor: "home",
    label: "Where you started",
    note: "one galaxy among countless others",
    evidence: "observed",
    href: "/about",
    opens: "/subjects/galaxies",
    sources: ["nasa-galaxies", "nasa-cosmic-web"],
  },
];

export const UNCHARTED: MarginEntry = {
  id: "uncharted",
  label: "Uncharted",
  note: "Ideas with no place on the map yet: wormholes, extra dimensions, other universes.",
  evidence: "hypothetical",
  href: "/about",
  opens: "Theoretical Frontiers (after v1)",
  sources: ["nasa-cosmicopia-wormholes", "nasa-apod-multiverse", "cern-extra-dimensions"],
};

/** The words beside each level of the atlas. */
export interface LevelCopy {
  level: AtlasLevel;
  /** The fragment a link can jump to. */
  id: string;
  heading: string;
  text: string;
  sources: readonly string[];
}

export const LEVELS: readonly LevelCopy[] = [
  {
    level: 1,
    id: "chart",
    heading: "Where would you like to go?",
    text: "This is a spiral galaxy, a city of stars like our own. Choose a beacon, or keep pulling back.",
    sources: ["nasa-galaxies"],
  },
  {
    level: 2,
    id: "web",
    heading: "Every point of light here is a galaxy.",
    text: "Pull back far enough and galaxies gather into a vast web of threads and empty voids.",
    sources: ["nasa-cosmic-web"],
  },
];
