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


/** The atlas's views: the galaxy (close in or whole, one name since D-115), the cosmic web, the supervoid around it (D-119) and the observable universe (D-130). */
export type StopIndex = 0 | 1 | 2 | 3 | 4;

export interface Stop {
  zoom: StopIndex;
  name: string;
  line: string;
  sources: readonly string[];
  /** A video about it on YouTube (D-141): its ID, opened by the video button in a new tab. */
  video?: string;
}

export type PlaceId = "black-hole" | "nebula" | "quasar" | "neutron-star" | "star" | "strange-star" | "dyson-sphere" | "wormhole" | "gravastar" | "quasi-star" | "solar-system" | "blue-world" | "moon" | "asteroid" | "quasar-galaxy";
export type AtlasAnchor = "core" | "arm" | "quasar" | "home" | "pulsar" | "sun" | "strange" | "wormhole" | "gravastar" | "quasi";
/** Bodies a place's own scene names, where the places inside it stand (D-132). */
export type InnerAnchor = "star" | "planet" | "moon" | "asteroid" | "core" | "dyson" | "throat";

export interface Place {
  id: PlaceId;
  name: string;
  line: string;
  sources: readonly string[];
  /**
   * Where its hotspot stands: in the atlas (and at which stop it shows), or, for a place inside
   * another (`inside`, D-132), on a body of that place's scene. `stop` is then the stop its
   * outermost parent is found at.
   */
  anchor: AtlasAnchor | InnerAnchor;
  stop: StopIndex;
  /** The place whose scene this one is found in (D-132): Zoom Out goes back there. */
  inside?: PlaceId;
  /**
   * Another place whose scene also leads here (D-133: the wormhole's throat leads to the quasar
   * galaxy), on its body `throughAnchor`; arrived that way, Zoom Out goes back through it.
   */
  through?: PlaceId;
  throughAnchor?: InnerAnchor;
  /** The colour the screen passes through on the way in and out: the place's own darkness. */
  veil: string;
  /** A video about it on YouTube (D-141): its ID, opened by the video button in a new tab. */
  video?: string;
}

export const SOURCES: readonly Source[] = [
  {
    id: "nasa-large-scale-structures",
    title: "Large Scale Structures",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/galaxies/large-scale-structures/",
    checked: "2026-11-22",
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
    id: "nasa-dark-energy",
    title: "What is Dark Energy? Inside Our Accelerating, Expanding Universe",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/dark-energy/",
    checked: "2026-11-22",
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
    id: "nasa-solar-system-facts",
    title: "Solar System Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/solar-system/solar-system-facts/",
    checked: "2026-11-22",
  },
  {
    id: "nasa-asteroid-facts",
    title: "Asteroid Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/solar-system/asteroids/facts/",
    checked: "2026-11-22",
  },
  {
    id: "nasa-habitable-zone",
    title: "The Habitable Zone",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/exoplanets/habitable-zone/",
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

// Videos (D-141): Kurzgesagt, checked through YouTube oEmbed on 2026-11-22; the nebula has none yet.
export const STOPS: readonly Stop[] = [
  {
    zoom: 1,
    name: "A Spiral Galaxy",
    line: "An island of stars, gas and dust, held together by gravity.",
    sources: ["nasa-galaxies"],
    video: "Pj-h6MEgE7I",
  },
  {
    zoom: 2,
    name: "The Cosmic Web",
    line: "Every point of light here is a galaxy.",
    sources: ["nasa-cosmic-web"],
    video: "QAa2O_8wBUQ",
  },
  {
    // D-119: a zoom out of the web, no longer a place of its own
    zoom: 3,
    name: "A Supervoid",
    // the sources: "voids of space in between, as if the galaxies were resting on empty bubbles"; "clusters and walls";
    // dark energy is "making the universe expand at an accelerating rate" (D-137: "growing" lives in the line itself)
    line: "Growing empty bubbles between the web's walls, stretched by dark energy.",
    sources: ["nasa-large-scale-structures", "nasa-dark-energy"],
    video: "yDAAlojz8NU",
  },
  {
    // D-130: a zoom out of the supervoid, the last stop
    zoom: 4,
    name: "The Observable Universe",
    // the source: "These walls are likely the largest-known superstructures within the observable universe."
    line: "Its largest known structures are likely vast walls of galaxies.",
    sources: ["nasa-large-scale-structures"],
    video: "Z_1Q0XB4X0Y",
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
    video: "e-P5IFTqB98",
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
    // D-133: the quasar galaxy's heart, close up
    id: "quasar",
    name: "Quasar",
    line: "Some of the brightest beacons in the distant universe.",
    sources: ["nasa-webb-quasars", "nasa-hubble-quasars"],
    anchor: "core",
    stop: 2,
    inside: "quasar-galaxy",
    veil: "#0a0e1e",
    video: "V4Z8EdiJxgk",
  },
  {
    // D-133: the galaxy round the quasar, found at the web and through the wormhole; it holds the
    // quasar and the sci-fi places (owner)
    id: "quasar-galaxy",
    name: "A Quasar Galaxy",
    // the source (Webb): "a quasar's light outshines that of all the stars in its host galaxy combined"
    line: "Its heart outshines all the stars in its galaxy combined.",
    sources: ["nasa-webb-quasars"],
    anchor: "quasar",
    stop: 2,
    through: "wormhole",
    throughAnchor: "throat",
    veil: "#070a18",
    video: "L_JQOH1tEEA",
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
    video: "udFxKZRyQt4",
  },
  {
    id: "star",
    name: "Yellow Star",
    // the source: "hydrogen is fused to form helium – power the Sun's heat and light"
    line: "Like our Sun: fusing hydrogen into helium to make its light.",
    sources: ["nasa-sun-facts"],
    // the solar system's star (D-132)
    anchor: "star",
    stop: 1,
    inside: "solar-system",
    veil: "#160b04",
    video: "J0ldO87Pprc",
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
    video: "p_8yK2kmxoo",
  },
  {
    id: "dyson-sphere",
    name: "Dyson Sphere",
    // the source: "In 1960 ... Freeman J. Dyson"; "a megastructure that could theoretically harvest all the energy of a star"
    line: "Imagined in 1960: a swarm harvesting all of a star's energy.",
    sources: ["earthsky-dyson-sphere"],
    // D-133: moved from the spiral galaxy into the quasar galaxy, with the sci-fi places
    anchor: "dyson",
    stop: 2,
    inside: "quasar-galaxy",
    veil: "#120a04",
    video: "pP44EPBMb8A",
  },
  {
    id: "wormhole",
    name: "Wormhole",
    // the source: "the classical Einstein-Rosen \"bridge\" as proposed in the original 1935 paper"; "the simplest example of a ... traversable lightlike thin-shell wormhole" (hypothetical). Not "first": Flamm described the shape in 1916 (D-131)
    line: "A hypothetical tunnel through spacetime: the Einstein-Rosen bridge.",
    sources: ["arxiv-einstein-rosen-bridge"],
    anchor: "wormhole",
    stop: 1,
    veil: "#0a0a16",
    video: "9P6rdqiybaw",
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
    video: "BmUZ2wp1lM8",
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
    video: "aeWyp2vXxqA",
  },
  {
    // D-132: the galaxy's Yellow Star, Earth and Moon became one place with places inside it
    id: "solar-system",
    name: "A Solar System",
    // the source: "Our solar system has one star, eight planets, five dwarf planets, hundreds of moons and thousands of comets and asteroids."
    line: "One star ruling its planets, moons, comets and asteroids.",
    sources: ["nasa-solar-system-facts"],
    anchor: "sun",
    stop: 1,
    veil: "#0a0810",
    video: "gLZJlf5rHVs",
  },
  {
    // D-132: an Earthlike world, not Earth: our galaxy is not drawn as the Milky Way (owner)
    id: "blue-world",
    name: "A Blue World",
    // the source: "the distance from a star at which liquid water could exist on orbiting planets' surfaces"
    line: "A world in its star's habitable zone, where seas can stay liquid.",
    sources: ["nasa-habitable-zone"],
    anchor: "planet",
    stop: 1,
    inside: "solar-system",
    veil: "#020814",
    video: "VD6xJq8NguY",
  },
  {
    id: "moon",
    name: "Its Moon",
    // the source: "The Moon has a solid, rocky surface cratered and pitted from impacts by asteroids, meteorites, and comets."
    line: "Its rocky face is cratered and pitted by asteroids and comets.",
    sources: ["nasa-moon-facts"],
    anchor: "moon",
    stop: 1,
    inside: "blue-world",
    veil: "#0a0a0e",
    video: "lheapd7bgLA",
  },
  {
    // D-133: inside the moon's scene, tumbling past it
    id: "asteroid",
    name: "An Asteroid",
    // the source: Chicxulub, "causing the extinction of more than 70% of the living species on the planet, including the dinosaurs"
    line: "One struck Earth and ended over 70% of its species, dinosaurs included.",
    sources: ["nasa-asteroid-facts"],
    anchor: "asteroid",
    stop: 1,
    inside: "moon",
    veil: "#0a0908",
    video: "dKm7T13X7n4",
  },
];


