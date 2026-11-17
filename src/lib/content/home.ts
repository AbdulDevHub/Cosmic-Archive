/**
 * The homepage's own words (content/home.ts), checked once at build time with the same rule as
 * `npm run check`: a teaser or journey stop that names a missing source fails the build.
 */

import { SOURCES } from "@content/destinations";
import { HOME_SOURCES, STARS_LIFE, TEASERS } from "@content/home";
import { citeProblems, homeEntries } from "./cited";

export { STARS_LIFE, TEASERS } from "@content/home";
export type { JourneyPreview, JourneyStop, Teaser } from "@content/home";

const problems = citeProblems([...SOURCES, ...HOME_SOURCES], homeEntries(TEASERS, STARS_LIFE));
if (problems.length > 0) throw new Error(`content/home.ts:\n  ${problems.join("\n  ")}`);
