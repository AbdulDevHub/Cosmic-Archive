/**
 * The words below the homepage's scene (DESIGN_SPEC.md 7.5): a line for each destination whose
 * page is not written yet,. Facts only, each tied
 * to a source that was fetched and read (PROJECT_BLUEPRINT.md 6.2). Layout lives in
 * src/components/home.
 *
 * A destination with a published subject page uses that page's own hook instead of a line here.
 */

import type { Source } from "./destinations";

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
