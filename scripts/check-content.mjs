// The content check (context/BLUEPRINT.md section 6). Part of `npm run check`.
// Fails when a line in src/content/places.ts breaks the sourcing rule: no source, a source that is not
// listed, a source without a checked date, a source that backs nothing, or more than twelve words.
//
// It runs the same code the build runs (src/lib/content/place-check.ts), loaded as TypeScript by
// Node itself (type stripping, Node 22.18 or later).

import { PLACES, SOURCES, STOPS } from "../src/content/places.ts";
import { placeProblems } from "../src/lib/content/place-check.ts";

const problems = placeProblems(SOURCES, [...STOPS, ...PLACES]);
if (problems.length === 0) {
  console.log(`ok   src/content/places.ts  (${STOPS.length} stops, ${PLACES.length} places, ${SOURCES.length} sources)`);
  process.exit(0);
}
console.log("FAIL src/content/places.ts");
for (const problem of problems) console.log(`     ${problem}`);
process.exit(1);
