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

/** The homepage's teasers (content/home.ts), named so a problem says where it is. */
export function teaserEntries(teasers: readonly CitingEntry[]): CitingEntry[] {
  return teasers.map((teaser) => ({ id: `teaser:${teaser.id}`, sources: teaser.sources }));
}

interface StopLike extends CitingEntry {
  why?: string;
}

interface ForkLike {
  sources: readonly string[];
  branches: readonly { id: string; sources: readonly string[]; stops: readonly StopLike[]; fork?: ForkLike }[];
}

/**
 * A journey's citing entries (content/journeys/*.ts), named by where they are, plus the rule that
 * makes a journey a journey (PROJECT_BLUEPRINT.md 7): every stop that leads somewhere says why.
 * A stop leads somewhere unless it ends a branch that does not divide again.
 */
export function journeyProblems(sources: readonly ListedSource[], journey: { id: string; trunk: readonly StopLike[]; fork: ForkLike }): string[] {
  const entries: CitingEntry[] = [];
  const problems: string[] = [];
  const walkStops = (where: string, stops: readonly StopLike[], leadsOn: boolean) => {
    stops.forEach((stop, index) => {
      entries.push({ id: `${where}:${stop.id}`, sources: stop.sources });
      const last = index === stops.length - 1;
      if ((!last || leadsOn) && !stop.why) problems.push(`"${where}:${stop.id}" does not say why it leads to the next stop`);
      if (last && !leadsOn && stop.why) problems.push(`"${where}:${stop.id}" ends a branch but says why it leads on`);
    });
  };
  const walkFork = (where: string, fork: ForkLike) => {
    entries.push({ id: `${where}:fork`, sources: fork.sources });
    if (fork.branches.length < 2) problems.push(`"${where}:fork" has fewer than two branches`);
    for (const branch of fork.branches) {
      const here = `${where}:${branch.id}`;
      entries.push({ id: `${here}:who`, sources: branch.sources });
      if (branch.stops.length === 0) problems.push(`"${here}" has no stops`);
      walkStops(here, branch.stops, !!branch.fork);
      if (branch.fork) walkFork(here, branch.fork);
    }
  };
  walkStops(`journey:${journey.id}`, journey.trunk, true);
  walkFork(`journey:${journey.id}`, journey.fork);
  return [...citeProblems(sources, entries), ...problems];
}
