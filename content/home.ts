/**
 * The words below the homepage's scene (DESIGN_SPEC.md 7.5): a line for each destination whose
 * page is not written yet, and the preview of the journey "A star's life". Facts only, each tied
 * to a source that was fetched and read (PROJECT_BLUEPRINT.md 6.2). Layout lives in
 * src/components/home.
 *
 * A destination with a published subject page uses that page's own hook instead of a line here.
 */

import type { Evidence, Source } from "./destinations";

export const HOME_SOURCES: readonly Source[] = [
  {
    id: "nasa-stars",
    title: "Stars",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/universe/stars/",
    checked: "2026-11-17",
  },
];

/** The one line under a destination's name, until its page has a hook of its own. */
export interface Teaser {
  /** A destination id (content/destinations.ts). */
  id: string;
  line: string;
  /** Ids in `HOME_SOURCES` or the atlas's `SOURCES`. */
  sources: readonly string[];
}

export const TEASERS: readonly Teaser[] = [
  {
    id: "galaxies",
    line: "Stars, planets and vast clouds of gas and dust, all bound together by gravity.",
    sources: ["nasa-galaxies"],
  },
  {
    id: "nebulae",
    line: "Clouds of gas and dust where stars are born, and where dying stars leave their mark.",
    sources: ["nasa-stars", "jpl-star-forming-nebulae"],
  },
  {
    id: "quasars",
    line: "Far-off galaxies whose cores outshine whole galaxies, powered by supermassive black holes.",
    sources: ["nasa-hubble-quasars"],
  },
];

/** One stop on the journey's line. */
export interface JourneyStop {
  id: string;
  label: string;
  /** What happens here, in a sentence. */
  note: string;
  /** For a stop after the fork: which stars take this branch. */
  branch?: string;
  /** A subject page this stop opens, once it exists. */
  subject?: string;
  evidence: Evidence;
  sources: readonly string[];
}

export interface JourneyPreview {
  id: string;
  title: string;
  /** Why the line forks, in a few words. */
  fork: string;
  forkSources: readonly string[];
  /** Before the fork, in order. */
  trunk: readonly JourneyStop[];
  /** After the fork: one branch per end. */
  ends: readonly JourneyStop[];
}

export const STARS_LIFE: JourneyPreview = {
  id: "a-stars-life",
  title: "A star's life",
  fork: "How a star ends depends strongly on its mass.",
  forkSources: ["nasa-stars"],
  trunk: [
    {
      id: "cloud",
      label: "A cloud",
      note: "Stars form in large clouds of gas and dust. Gravity makes clumps of the cloud collapse and heat up.",
      evidence: "established",
      sources: ["nasa-stars"],
    },
    {
      id: "star",
      label: "A star",
      note: "Its core fuses hydrogen into helium, the longest phase of a star's life.",
      evidence: "established",
      sources: ["nasa-stars"],
    },
  ],
  ends: [
    {
      id: "white-dwarf",
      label: "White dwarf",
      branch: "A low-mass star",
      note: "Its outer layers blow away as a planetary nebula. The core left behind is a white dwarf.",
      evidence: "established",
      sources: ["nasa-stars"],
    },
    {
      id: "neutron-star",
      label: "Neutron star",
      branch: "A high-mass star",
      note: "It explodes as a supernova, and its core survives as an incredibly dense remnant.",
      evidence: "established",
      sources: ["nasa-stars"],
    },
    {
      id: "black-hole",
      label: "Black hole",
      // nasa-black-hole-types: "If it had around 20 times the Sun's mass or more, the star's core collapses
      // into a stellar-mass black hole." The mass is the star's.
      branch: "Around 20 times the Sun's mass or more",
      note: "The collapsing core becomes a stellar-mass black hole.",
      subject: "black-holes",
      evidence: "established",
      sources: ["nasa-black-hole-types"],
    },
  ],
};
