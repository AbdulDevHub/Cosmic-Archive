/**
 * The homepage's own words (content/home.ts), checked once at build time with the same rule as
 * `npm run check`: a teaser that names a missing source fails the build.
 */

import { SOURCES } from "@content/destinations";
import { HOME_SOURCES, TEASERS } from "@content/home";
import { citeProblems, teaserEntries } from "./cited";

export { TEASERS } from "@content/home";
export type { Teaser } from "@content/home";

const problems = citeProblems([...SOURCES, ...HOME_SOURCES], teaserEntries(TEASERS));
if (problems.length > 0) throw new Error(`content/home.ts:\n  ${problems.join("\n  ")}`);
