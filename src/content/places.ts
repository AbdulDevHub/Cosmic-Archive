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

export type PlaceId = "black-hole" | "nebula" | "quasar" | "neutron-star" | "star" | "strange-star" | "dyson-sphere" | "wormhole" | "gravastar" | "supernova-remnant" | "magnetar" | "black-hole-merger" | "comet" | "ringed-giant" | "dark-matter" | "molecular-cloud" | "red-giant" | "planetary-nebula" | "white-dwarf" | "quasi-star" | "solar-system" | "blue-world" | "moon" | "asteroid" | "quasar-galaxy" | "starbase" | "warp-drive" | "programmable-matter";
export type AtlasAnchor = "core" | "arm" | "quasar" | "home" | "pulsar" | "sun" | "strange" | "wormhole" | "gravastar" | "remnant" | "merger" | "quasi" | "dark" | "cloud" | "redgiant" | "planetary";
/** Bodies a place's own scene names, where the places inside it stand (D-132). */
export type InnerAnchor = "star" | "planet" | "moon" | "asteroid" | "core" | "dyson" | "throat" | "heart" | "comet" | "giant" | "dwarf" | "starbase" | "warp" | "matter" | "dims" | "pocket" | "omniverse" | "bubbles" | "vacuum" | "foam" | "strings" | "quarks" | "stringtheory";

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
  {
    id: "nasa-imagine-snr",
    title: "Supernova Remnants",
    publisher: "NASA Goddard Space Flight Center, Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/science/objects/supernova_remnants.html",
    checked: "2026-11-22",
  },
  {
    id: "nasa-ixpe-magnetar-outburst",
    title: "NASA's IXPE Obtains First X-ray Polarization Measurement of Magnetar Outburst",
    publisher: "NASA Marshall Space Flight Center",
    url: "https://www.nasa.gov/missions/ixpe/nasas-ixpe-obtains-first-x-ray-polarization-measurement-of-magnetar-outburst/",
    checked: "2026-11-22",
  },
  {
    id: "nas-spacetime-simulations",
    title: "Spacetime Simulations and the Discovery of Gravitational Waves",
    publisher: "NASA Advanced Supercomputing Division, NASA Ames Research Center",
    url: "https://www.nas.nasa.gov/pubs/stories/2019/feature_gravitational_waves_Centrella.html",
    checked: "2026-11-22",
  },
  {
    id: "nasa-comet-facts",
    title: "Comet Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/solar-system/comets/facts/",
    checked: "2026-11-22",
  },
  {
    id: "nasa-saturn-facts",
    title: "Saturn: Facts",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/saturn/facts/",
    checked: "2026-11-22",
  },
  {
    id: "nasa-dark-matter",
    title: "Dark Matter",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/dark-matter/",
    checked: "2026-11-23",
  },
  {
    id: "nasa-star-basics",
    title: "Star Basics",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/stars/",
    checked: "2026-11-23",
  },
  {
    id: "nasa-imagine-star-life-cycles",
    title: "The Life Cycles of Stars",
    publisher: "NASA Goddard Space Flight Center, Imagine the Universe!",
    url: "https://imagine.gsfc.nasa.gov/educators/lifecycles/LC_main3.html",
    checked: "2026-11-23",
  },
  {
    id: "nss-stanford-torus",
    title: "Stanford Torus Space Settlement",
    publisher: "National Space Society",
    url: "https://nss.org/stanford-torus-space-settlement/",
    checked: "2026-11-23",
  },
  {
    id: "arxiv-alcubierre-warp-drive",
    title: "The warp drive: hyper-fast travel within general relativity",
    publisher: "arXiv (Miguel Alcubierre; Classical and Quantum Gravity, 1994)",
    url: "https://arxiv.org/abs/gr-qc/0009013",
    checked: "2026-11-23",
  },
  {
    id: "cmu-claytronics",
    title: "Claytronics",
    publisher: "Carnegie Mellon University, School of Computer Science",
    url: "https://www.cs.cmu.edu/~claytronics/",
    checked: "2026-11-23",
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
    // D-142: no video yet (owner to pick)
    id: "supernova-remnant",
    name: "A Supernova Remnant",
    // the source: "A supernova remnant (SNR) is the remains of a supernova explosion."; they "distribute heavy elements throughout the galaxy"
    line: "The remains of a star's blast, scattering heavy elements through the galaxy.",
    sources: ["nasa-imagine-snr"],
    anchor: "remnant",
    stop: 1,
    veil: "#140608",
  },
  {
    // D-143: the star's remains at the remnant's heart; no video yet (owner to pick)
    id: "magnetar",
    name: "A Magnetar",
    // the source: magnetars "host the strongest magnetic fields of any known object in the universe"; in outburst
    // "emitting the luminosity equivalent to 1000 suns"
    line: "The strongest magnet known: its outbursts flash like a thousand Suns.",
    sources: ["nasa-ixpe-magnetar-outburst"],
    anchor: "heart",
    stop: 1,
    inside: "supernova-remnant",
    veil: "#12041a",
  },
  {
    // D-144: no video yet (owner to pick)
    id: "black-hole-merger",
    name: "A Black Hole Merger",
    // the source: "Two black holes spiral together and merge in this simulation"; mergers "would cause distortions in
    // spacetime that ripple across the universe"
    line: "Two black holes spiral together and merge, rippling space and time.",
    sources: ["nas-spacetime-simulations"],
    anchor: "merger",
    stop: 1,
    veil: "#07061a",
  },
  {
    // D-145: inside the solar system, out past the belt; no video yet (owner to pick)
    id: "comet",
    name: "A Comet",
    // the source: comets "have been referred to as "dirty snowballs.""; "A comet warms up as it nears the Sun";
    // "The Sun's heat causes the comet's ices to change to gases"; "Comets actually have two tails"
    line: "A dirty snowball whose ices, warmed by the Sun, grow two tails.",
    sources: ["nasa-comet-facts"],
    anchor: "comet",
    stop: 1,
    inside: "solar-system",
    veil: "#040a14",
  },
  {
    // D-146: the solar system's ringed giant, close up; not Saturn by name (as the blue world is not Earth), so the
    // line compares it; no video yet (owner to pick)
    id: "ringed-giant",
    name: "A Ringed Giant",
    // the source (Saturn): rings "made of billions of small chunks of ice and rock"; "chunks as big as a house"
    line: "Rings like Saturn's: billions of icy chunks, some as big as houses.",
    sources: ["nasa-saturn-facts"],
    anchor: "giant",
    stop: 1,
    inside: "solar-system",
    veil: "#0e0a06",
  },
  {
    // D-147: the web's unseen matter, made to glow; a knot of the web leads here; no video yet (owner to pick)
    id: "dark-matter",
    name: "The Dark Matter Web",
    // the source: "Dark matter is the invisible glue that holds the universe together."; "ordinary matter makes up only
    // about 5% of the universe, while dark matter makes up about 27%" (27 / 5 is about five)
    line: "The universe's invisible glue: about five times more than ordinary matter.",
    sources: ["nasa-dark-matter"],
    anchor: "dark",
    stop: 2,
    veil: "#04060e",
  },
  {
    // D-148: A Star's Life, its first stage; no video yet (owner to pick)
    id: "molecular-cloud",
    name: "A Molecular Cloud",
    // the source: "Stars form in large clouds of gas and dust called molecular clouds."; "Molecular clouds are cold";
    // "gravity causes some of these clumps to collapse"; "a protostar – a baby star"
    line: "A cold cloud of gas and dust, collapsing into baby stars.",
    sources: ["nasa-star-basics"],
    anchor: "cloud",
    stop: 1,
    veil: "#0a0605",
  },
  {
    // D-149: A Star's Life, after the Yellow Star; no video yet (owner to pick)
    id: "red-giant",
    name: "A Red Giant",
    // the source: "Beginning of the End"; "The star expands to larger than it ever was during its lifetime -- a few to
    // about a hundred times bigger."; "The star has become a red giant."
    line: "A star near its end, swollen up to a hundred times bigger.",
    sources: ["nasa-imagine-star-life-cycles"],
    anchor: "redgiant",
    stop: 1,
    veil: "#140504",
  },
  {
    // D-150: A Star's Life, after the red giant; the white dwarf is at its heart; no video yet (owner to pick)
    id: "planetary-nebula",
    name: "A Planetary Nebula",
    // the source: at the end of a star's life, "all the star's outer layers blow away, creating an expanding cloud
    // of dust and gas called a planetary nebula"
    line: "A dying star's outer layers, blown away into an expanding cloud.",
    sources: ["nasa-star-basics"],
    anchor: "planetary",
    stop: 1,
    veil: "#040a10",
  },
  {
    // D-150: the planetary nebula's core, close up; the last stage of A Star's Life for a star like the Sun
    id: "white-dwarf",
    name: "A White Dwarf",
    // the source: "All that's left of the star is its core, now called a white dwarf,"; "a roughly Earth-sized
    // stellar cinder that gradually cools over billions of years"
    line: "All that's left of the star: an Earth-sized cinder, slowly cooling.",
    sources: ["nasa-star-basics"],
    anchor: "dwarf",
    stop: 1,
    inside: "planetary-nebula",
    veil: "#060810",
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
  {
    // D-152: the hub for ideas space scenes cannot show, inside the quasar galaxy (D-136)
    id: "starbase",
    name: "The Starbase",
    // the source: "a torus or donut-shaped ring"; it "rotates once per minute to provide Earth-normal gravity";
    // "the principal design considered by the 1975 NASA Summer Study". Fiction, so "imagined"
    line: "An imagined wheel station, spun for gravity, as NASA studied in 1975.",
    sources: ["nss-stanford-torus"],
    anchor: "starbase",
    stop: 2,
    inside: "quasar-galaxy",
    veil: "#070912",
  },
  {
    // D-153: the first of the Starbase's ideas
    id: "warp-drive",
    name: "Warp Drive",
    // the source: "a purely local expansion of spacetime behind the spaceship and an opposite contraction in front of it";
    // "exotic matter will be needed", so the line says "imagined"
    line: "An imagined drive: space contracts ahead of the ship and expands behind.",
    sources: ["arxiv-alcubierre-warp-drive"],
    anchor: "warp",
    stop: 2,
    inside: "starbase",
    veil: "#05061a",
  },
  {
    // D-154: an idea in the Starbase
    id: "programmable-matter",
    name: "Programmable Matter",
    // the source: "manage the shaping of ensembles of millions of catoms into dynamic, 3-Dimensional forms";
    // a research goal, not a thing that exists, so "imagined"
    line: "Imagined matter: millions of tiny units, shaping themselves into moving 3D forms.",
    sources: ["cmu-claytronics"],
    anchor: "matter",
    stop: 2,
    inside: "starbase",
    veil: "#060a0e",
  },
];


