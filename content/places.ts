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


/** The atlas's views: the galaxy (close in or whole, one name since D-115), the cosmic web and the supervoid around it (D-119). */
export type StopIndex = 0 | 1 | 2 | 3;

export interface Stop {
  zoom: StopIndex;
  name: string;
  line: string;
  sources: readonly string[];
}

export type PlaceId = "black-hole" | "nebula" | "quasar" | "neutron-star" | "star" | "strange-star" | "dyson-sphere" | "wormhole" | "gravastar" | "quasi-star" | "earth" | "moon";
export type AtlasAnchor = "core" | "arm" | "quasar" | "home" | "pulsar" | "sun" | "strange" | "dyson" | "wormhole" | "gravastar" | "quasi" | "earth" | "moon";

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
}

export const SOURCES: readonly Source[] = [
  {
    id: "nasa-large-scale-structures",
    title: "Large Scale Structures",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/galaxies/large-scale-structures/",
    checked: "2026-11-21",
  },
  {
    id: "chandra-quark-matter",
    title: "Cosmic X-rays Reveal Evidence For New Form Of Matter",
    publisher: "Chandra X-ray Center (Smithsonian Astrophysical Observatory for NASA)",
    url: "https://chandra.harvard.edu/press/02_releases/press_041002.html",
    checked: "2026-11-21",
  },
  {
    id: "earthsky-dyson-sphere",
    title: "A Dyson sphere harvests the energy of stars",
    publisher: "EarthSky",
    url: "https://earthsky.org/space/what-is-a-dyson-sphere/",
    checked: "2026-11-21",
  },
  {
    id: "nasa-imagine-neutron-stars",
    title: "Neutron Stars",
    publisher: "NASA Goddard Space Flight Center, Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html",
    checked: "2026-11-21",
  },
  {
    id: "nasa-sun-facts",
    title: "Sun: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/sun/facts/",
    checked: "2026-11-21",
  },
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
  {
    id: "arxiv-einstein-rosen-bridge",
    title: "Einstein-Rosen \"Bridge\" Revisited and Lightlike Thin-Shell Wormholes",
    publisher: "Guendelman, Nissimov, Pacheva and Stoilov (Ben-Gurion University and the Bulgarian Academy of Sciences), arXiv",
    url: "https://arxiv.org/abs/1611.04336",
    checked: "2026-11-22",
  },
  {
    id: "arxiv-gravastar",
    title: "Gravitational Vacuum Condensate Stars",
    publisher: "Pawel O. Mazur (University of South Carolina) and Emil Mottola (Los Alamos National Laboratory), arXiv",
    url: "https://arxiv.org/abs/gr-qc/0109035",
    checked: "2026-11-22",
  },
  {
    id: "arxiv-quasi-stars",
    title: "Quasi-stars as a Means of Rapid Black Hole Growth in the Early Universe",
    publisher: "Eric R. Coughlin (Syracuse University) and Mitchell C. Begelman (University of Colorado Boulder), arXiv",
    url: "https://arxiv.org/abs/2405.00084",
    checked: "2026-11-22",
  },
  {
    id: "nasa-earth-facts",
    title: "Facts About Earth",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/earth/facts/",
    checked: "2026-11-22",
  },
  {
    id: "nasa-moon-facts",
    title: "Moon Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/moon/facts/",
    checked: "2026-11-22",
  },
];

export const STOPS: readonly Stop[] = [
  {
    zoom: 1,
    name: "A Spiral Galaxy",
    line: "An island of stars, gas and dust, held together by gravity.",
    sources: ["nasa-galaxies"],
  },
  {
    zoom: 2,
    name: "The Cosmic Web",
    line: "Every point of light here is a galaxy.",
    sources: ["nasa-cosmic-web"],
  },
  {
    // D-119: a zoom out of the web, no longer a place of its own
    zoom: 3,
    name: "A Supervoid",
    // the source: "voids of space in between, as if the galaxies were resting on empty bubbles"; "clusters and walls"
    line: "Empty bubbles of space between the cosmic web's walls of galaxies.",
    sources: ["nasa-large-scale-structures"],
  },
];

export const PLACES: readonly Place[] = [
  {
    id: "black-hole",
    name: "Black Hole",
    line: "Where gravity reshapes space and time.",
    sources: ["nasa-anatomy", "nasa-too-close"],
    anchor: "core",
    stop: 1,
    veil: "#140b0a",
  },
  {
    id: "nebula",
    name: "Nebula",
    line: "Clouds where stars are born, and where stars leave their mark.",
    sources: ["nasa-spaceplace-nebula"],
    anchor: "arm",
    stop: 1,
    veil: "#1c0b1a",
  },
  {
    id: "quasar",
    name: "Quasar",
    line: "Some of the brightest beacons in the distant universe.",
    sources: ["nasa-webb-quasars", "nasa-hubble-quasars"],
    anchor: "quasar",
    stop: 2,
    veil: "#0a0e1e",
  },
  {
    id: "neutron-star",
    name: "Neutron Star",
    // the source: "One sugar cube of neutron star material would weigh about 1 trillion kilograms (or 1 billion tons) on Earth"
    line: "So dense a sugar cube of it weighs about a billion tons.",
    sources: ["nasa-imagine-neutron-stars"],
    anchor: "pulsar",
    stop: 1,
    veil: "#060a1c",
  },
  {
    id: "star",
    name: "Yellow Star",
    // the source: "hydrogen is fused to form helium – power the Sun's heat and light"
    line: "Like our Sun: fusing hydrogen into helium to make its light.",
    sources: ["nasa-sun-facts"],
    anchor: "sun",
    stop: 1,
    veil: "#160b04",
  },
  {
    id: "strange-star",
    name: "Strange Star",
    // the source: "the possibility these stars are composed of pure quarks"; "even denser than nuclear matter"
    line: "Possibly a star of pure quarks, denser than nuclear matter.",
    sources: ["chandra-quark-matter"],
    anchor: "strange",
    stop: 1,
    veil: "#08061a",
  },
  {
    id: "dyson-sphere",
    name: "Dyson Sphere",
    // the source: "In 1960 ... Freeman J. Dyson"; "a megastructure that could theoretically harvest all the energy of a star"
    line: "Imagined in 1960: a swarm harvesting all of a star's energy.",
    sources: ["earthsky-dyson-sphere"],
    anchor: "dyson",
    stop: 1,
    veil: "#120a04",
  },
  {
    id: "wormhole",
    name: "Wormhole",
    // the source: "the original 1935 paper"; "the classical Einstein-Rosen bridge"; "the simplest example of a ... traversable lightlike thin-shell wormhole" (hypothetical: it needs "exotic" matter)
    line: "A hypothetical bridge through spacetime, first described in 1935.",
    sources: ["arxiv-einstein-rosen-bridge"],
    anchor: "wormhole",
    stop: 1,
    veil: "#0a0a16",
  },
  {
    id: "gravastar",
    name: "Gravastar",
    // the source (Mazur and Mottola): "a cold, compact object with an interior de Sitter condensate phase", "separated by a phase boundary with a small but finite thickness of fluid", with "no singularities, no event horizons"; a proposal, so the line says "possible"
    line: "A possible black hole alternative: a vacuum bubble inside a thin shell.",
    sources: ["arxiv-gravastar"],
    anchor: "gravastar",
    stop: 1,
    veil: "#080614",
  },
  {
    id: "quasi-star",
    name: "Quasi-Star",
    // the source: "the intermediate quasi-star phase that accompanies some direct collapse models, during which a natal BH accretes mass from and energetically sustains (through accretion) an overlying gaseous envelope"; early: SMBH seeds by "redshifts z ≳ 10"; only some models, so the line says "possible"
    line: "A possible early giant: a black hole feeding inside a gas envelope.",
    sources: ["arxiv-quasi-stars"],
    anchor: "quasi",
    stop: 1,
    veil: "#160604",
  },
  {
    id: "earth",
    name: "Earth",
    // the source: "Earth is special because it is an ocean planet"; "Earth's global ocean, which covers about 71% of the planet's surface"
    line: "An ocean planet: its global ocean covers about 71% of its surface.",
    sources: ["nasa-earth-facts"],
    anchor: "earth",
    stop: 1,
    veil: "#020814",
  },
  {
    id: "moon",
    name: "Moon",
    // the source: "The dark features, called maria (Latin for seas), are impact basins that were filled with lava between 4.2 and 1.2 billion years ago."
    line: "Its dark seas are impact basins once flooded with lava.",
    sources: ["nasa-moon-facts"],
    anchor: "moon",
    stop: 1,
    veil: "#0a0a0e",
  },
];


