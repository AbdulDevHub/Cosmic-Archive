/**
 * The sourcing rule for content kept as TypeScript data (content/destinations.ts, content/home.ts):
 * every source has a checked date and is listed once, and every entry names at least one source
 * that exists. Used by the build (src/lib/content/home.ts throws) and by `npm run check`
 * (scripts/check-content.mjs), so the two never disagree. No imports and only erasable type
 * syntax, so Node can load it as it is.
 */

interface ListedSource {
  id: string;
  checked: string;
}

interface CitingEntry {
  id: string;
  sources: readonly string[];
}

export function citeProblems(sources: readonly ListedSource[], entries: readonly CitingEntry[]): string[] {
  const problems: string[] = [];
  const known = new Set<string>();
  for (const source of sources) {
    if (known.has(source.id)) problems.push(`source "${source.id}" is listed twice`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checked)) problems.push(`source "${source.id}" has no checked date`);
    known.add(source.id);
  }
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) problems.push(`"${entry.id}" is used twice`);
    seen.add(entry.id);
    if (entry.sources.length === 0) problems.push(`"${entry.id}" names no source`);
    for (const id of entry.sources) {
      if (!known.has(id)) problems.push(`"${entry.id}" names a source that does not exist: "${id}"`);
    }
  }
  return problems;
}

interface JourneyLike {
  id: string;
  forkSources: readonly string[];
  trunk: readonly CitingEntry[];
  ends: readonly CitingEntry[];
}

/** The homepage's citing entries (content/home.ts), named so a problem says where it is. */
export function homeEntries(teasers: readonly CitingEntry[], journey: JourneyLike): CitingEntry[] {
  return [
    ...teasers.map((teaser) => ({ id: `teaser:${teaser.id}`, sources: teaser.sources })),
    { id: `journey:${journey.id}:fork`, sources: journey.forkSources },
    ...[...journey.trunk, ...journey.ends].map((stop) => ({ id: `journey:${journey.id}:${stop.id}`, sources: stop.sources })),
  ];
}
