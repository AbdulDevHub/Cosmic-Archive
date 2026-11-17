/**
 * Loads the atlas's content and checks it once, at build time: every destination, the margin
 * entry and each level's copy must name sources that exist and carry a checked date. A broken
 * reference fails the build instead of reaching a page.
 */

import { DESTINATIONS, LEVELS, SOURCES, UNCHARTED, type AtlasLevel, type Destination, type LevelCopy } from "@content/destinations";

export { DESTINATIONS, EVIDENCE_WORD, LEVELS, SOURCES, UNCHARTED } from "@content/destinations";
export type { AtlasAnchor, AtlasLevel, Destination, Evidence, LevelCopy, MarginEntry, Source } from "@content/destinations";

const sourceIds = new Set<string>();
for (const source of SOURCES) {
  if (sourceIds.has(source.id)) throw new Error(`content: source "${source.id}" is listed twice`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checked)) throw new Error(`content: source "${source.id}" has no checked date`);
  sourceIds.add(source.id);
}

const seen = new Set<string>();
for (const entry of [...DESTINATIONS, UNCHARTED, ...LEVELS]) {
  if (seen.has(entry.id)) throw new Error(`content: "${entry.id}" is used twice`);
  seen.add(entry.id);
  if (entry.sources.length === 0) throw new Error(`content: "${entry.id}" names no source`);
  for (const id of entry.sources) {
    if (!sourceIds.has(id)) throw new Error(`content: "${entry.id}" names a source that does not exist: "${id}"`);
  }
}

export function destinationsAt(level: AtlasLevel): Destination[] {
  return DESTINATIONS.filter((destination) => destination.level === level);
}

export function levelCopy(level: AtlasLevel): LevelCopy {
  const copy = LEVELS.find((entry) => entry.level === level);
  if (!copy) throw new Error(`content: no copy for level ${level}`);
  return copy;
}
