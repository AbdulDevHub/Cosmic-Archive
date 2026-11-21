/**
 * The sourcing rule for content/places.ts, shared by the build (places.ts) and `npm run check`
 * (scripts/check-content.mjs). Plain TypeScript, no imports, so Node can run it directly.
 */

interface Cited {
  id?: string;
  name: string;
  line: string;
  sources: readonly string[];
}

interface Listed {
  id: string;
  checked: string;
}

export const MAX_WORDS = 12;

export function placeProblems(sources: readonly Listed[], entries: readonly Cited[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const source of sources) {
    if (ids.has(source.id)) problems.push(`source "${source.id}" is listed twice`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checked)) problems.push(`source "${source.id}" has no checked date`);
    ids.add(source.id);
  }
  const cited = new Set<string>();
  for (const entry of entries) {
    const what = `"${entry.name}"`;
    const words = entry.line.trim().split(/\s+/).length;
    if (words > MAX_WORDS) problems.push(`${what}: its line is ${words} words (at most ${MAX_WORDS})`);
    if (entry.sources.length === 0) problems.push(`${what} names no source`);
    for (const id of entry.sources) {
      if (!ids.has(id)) problems.push(`${what} names a source that is not listed: "${id}"`);
      cited.add(id);
    }
  }
  for (const id of ids) if (!cited.has(id)) problems.push(`source "${id}" backs no line`);
  return problems;
}
