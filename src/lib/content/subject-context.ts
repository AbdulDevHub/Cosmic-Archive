/**
 * Reads, from the project's own files, what a subject file may refer to. Node only (fs), no
 * imports of our own and only erasable type syntax, for the same reason as subject-check.ts:
 * the build and `scripts/check-content.mjs` both use it.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SUBJECTS_DIR = join("content", "subjects");
const JOURNEYS_DIR = join("content", "journeys");
const DIAGRAMS_DIR = join("src", "components", "subject", "diagrams");
const REGISTRY = join("src", "scene", "host", "registry.ts");

function names(dir: string, extension: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => extension.test(file))
    .map((file) => file.replace(extension, ""))
    .sort();
}

/** The slugs of the subject files, in name order. */
export function subjectSlugs(root = process.cwd()): string[] {
  return names(join(root, SUBJECTS_DIR), /\.mdx$/);
}

export function readSubject(slug: string, root = process.cwd()): string {
  return readFileSync(join(root, SUBJECTS_DIR, `${slug}.mdx`), "utf8");
}

/**
 * `planned` are subjects that have a place on the atlas but no page yet (the destinations'
 * ids): a page may name them as related, and links to them only once they exist.
 */
export function readContext(planned: readonly string[], root = process.cwd()) {
  // the registry's keys: `atlas: () => import(...)` or `"black-hole": () => import(...)`
  const registry = readFileSync(join(root, REGISTRY), "utf8");
  const scenes = [...registry.matchAll(/^\s*["']?([a-z0-9-]+)["']?\s*:\s*\(\)\s*=>\s*import\(/gm)].map((match) => match[1]);
  // the names each scene can place a callout on: the keys of `const ANCHORS = { ... }` in its world.ts
  const anchors = new Map<string, Set<string>>();
  for (const scene of scenes) {
    const world = join(root, "src", "scene", "scenes", scene, "world.ts");
    const block = existsSync(world) ? /const ANCHORS\b[^=]*=\s*\{([\s\S]*?)\n\};/.exec(readFileSync(world, "utf8")) : null;
    anchors.set(scene, new Set(block ? [...block[1].matchAll(/^\s*["']?([a-z0-9-]+)["']?\s*:/gm)].map((match) => match[1]) : []));
  }
  return {
    anchors,
    subjects: new Set([...subjectSlugs(root), ...planned]),
    journeys: new Set(names(join(root, JOURNEYS_DIR), /\.ts$/)),
    scenes: new Set(scenes),
    diagrams: new Set(names(join(root, DIAGRAMS_DIR), /\.tsx$/)),
  };
}
