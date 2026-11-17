// The content check (ARCHITECTURE.md 6, PROJECT_BLUEPRINT.md 6.2). Part of `npm run check`.
// Fails when a subject file breaks the sourcing rules: a <Claim> without a source or naming one
// that is not in the frontmatter, a source without a checked date, a `related`, `journeys` or
// `scene` id that does not resolve, a source nothing cites.
//
// It runs the same code the build runs (src/lib/content/subject-check.ts), loaded as TypeScript
// by Node itself (type stripping, Node 22.18 or later).

import { DESTINATIONS } from "../content/destinations.ts";
import { checkSubject } from "../src/lib/content/subject-check.ts";
import { readContext, readSubject, subjectSlugs, SUBJECTS_DIR } from "../src/lib/content/subject-context.ts";

const context = readContext(DESTINATIONS.map((destination) => destination.id));
const slugs = subjectSlugs();
let failed = 0;

for (const slug of slugs) {
  const { frontmatter, problems } = checkSubject(readSubject(slug), slug, context);
  const file = `${SUBJECTS_DIR.replaceAll("\\", "/")}/${slug}.mdx`;
  if (problems.length === 0 && frontmatter) {
    console.log(`ok   ${file}  (${frontmatter.sources.length} sources)`);
    continue;
  }
  failed += 1;
  console.log(`FAIL ${file}`);
  for (const problem of problems) console.log(`     ${problem}`);
}

if (slugs.length === 0) console.log(`no subject files in ${SUBJECTS_DIR}`);
process.exit(failed ? 1 : 0);
