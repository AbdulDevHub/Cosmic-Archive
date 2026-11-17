/**
 * What a subject file must be (ARCHITECTURE.md 6, PROJECT_BLUEPRINT.md 6.2), as code.
 *
 * One file, with no imports of our own and only erasable type syntax: the app loads it through
 * the bundler (src/lib/content/subjects.ts) and `scripts/check-content.mjs` loads it straight
 * into Node, so the build and `npm run check` apply exactly the same rules.
 */

import { parse as parseYaml } from "yaml";
import { z } from "zod";

const EVIDENCE = ["observed", "established", "theoretical", "hypothetical", "speculative"] as const;
const PALETTE = ["gold", "ember", "rose", "violet", "azure", "teal"] as const;

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase words joined by hyphens");
/** YAML reads a bare 2026-11-17 as a date; either way it ends up as that text. */
const day = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "a date as YYYY-MM-DD"),
);
const url = z.string().regex(/^https:\/\/\S+$/, "an https address");
const words = z.string().trim().min(1);

const source = z.strictObject({
  id: slug,
  title: words,
  publisher: words,
  url,
  /** The date the page was fetched and read. */
  checked: day,
});

/** A label drawn on the opening scene. `anchor` is a place that scene knows; the words need a source like any other. */
const callout = z.strictObject({
  anchor: slug,
  label: words,
  note: words,
  source: z.union([slug, z.array(slug).min(1)]),
});

export const frontmatterSchema = z.strictObject({
  id: slug,
  title: words,
  hook: words,
  /** The source behind the hook. */
  hookSource: z.union([slug, z.array(slug).min(1)]),
  description: words,
  category: slug,
  /** The page's evidence status; a claim that differs says so with <Evidence>. */
  status: z.enum(EVIDENCE),
  /** How the page's main thing was detected, in a few words: "observed" must say how. */
  statusNote: words,
  statusSource: z.union([slug, z.array(slug).min(1)]),
  scene: slug.optional(),
  palette: z.array(z.enum(PALETTE)).min(1).max(4),
  related: z.array(slug).default([]),
  journeys: z.array(slug).default([]),
  lastReviewed: day,
  sources: z.array(source).min(1),
  callouts: z.array(callout).default([]),
  /** Real observations: linked, never embedded (PROJECT_BLUEPRINT.md 6.3). */
  observations: z.array(z.strictObject({ label: words, publisher: words, url })).default([]),
});

export type SubjectFrontmatter = z.infer<typeof frontmatterSchema>;
export type SubjectSource = SubjectFrontmatter["sources"][number];
export type SubjectCallout = SubjectFrontmatter["callouts"][number];

/** What the checker needs to know about the rest of the project. */
export interface CheckContext {
  /** Ids a `related` entry may name: published subjects and planned destinations. */
  subjects: ReadonlySet<string>;
  journeys: ReadonlySet<string>;
  /** Ids in the scene registry. */
  scenes: ReadonlySet<string>;
  /** Names `<Diagram name>` may use. */
  diagrams: ReadonlySet<string>;
  /** Per scene id, the places it reports for callouts (its `ANCHORS`). */
  anchors: ReadonlyMap<string, ReadonlySet<string>>;
}

export interface CheckedSubject {
  frontmatter: SubjectFrontmatter | null;
  /** Empty when the file is sound. */
  problems: string[];
}

/** One id or several, separated by spaces or commas. */
export function sourceIds(value: string | readonly string[]): string[] {
  return (typeof value === "string" ? value.split(/[\s,]+/) : [...value]).filter(Boolean);
}

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Checks one subject file: the frontmatter against the schema, then everything that refers to
 * something else. `slug` is the file's name without its extension.
 */
export function checkSubject(text: string, fileSlug: string, context: CheckContext): CheckedSubject {
  const problems: string[] = [];
  const fence = FENCE.exec(text);
  if (!fence) return { frontmatter: null, problems: ["no frontmatter: the file must open with a --- block"] };

  let raw: unknown;
  try {
    raw = parseYaml(fence[1]);
  } catch (error) {
    return { frontmatter: null, problems: [`frontmatter is not valid YAML: ${(error as Error).message}`] };
  }
  const parsed = frontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) problems.push(`frontmatter ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    return { frontmatter: null, problems };
  }
  const frontmatter = parsed.data;
  const body = text.slice(fence[0].length);

  if (frontmatter.id !== fileSlug) problems.push(`id "${frontmatter.id}" does not match the file name "${fileSlug}"`);

  const known = new Set<string>();
  for (const entry of frontmatter.sources) {
    if (known.has(entry.id)) problems.push(`source "${entry.id}" is listed twice`);
    known.add(entry.id);
  }
  const used = new Set<string>();
  const cite = (where: string, value: string | readonly string[]) => {
    const ids = sourceIds(value);
    if (ids.length === 0) problems.push(`${where} names no source`);
    for (const id of ids) {
      used.add(id);
      if (!known.has(id)) problems.push(`${where} names a source that is not in the frontmatter: "${id}"`);
    }
  };

  cite("the hook", frontmatter.hookSource);
  cite("the status note", frontmatter.statusSource);
  for (const entry of frontmatter.callouts) cite(`callout "${entry.label}"`, entry.source);

  // every <Claim> must say where it comes from
  for (const tag of body.matchAll(/<Claim\b([^>]*)>/g)) {
    const attribute = /\bsource=(?:"([^"]*)"|'([^']*)')/.exec(tag[1]);
    const line = body.slice(0, tag.index).split("\n").length + fence[0].split("\n").length - 1;
    if (!attribute) problems.push(`line ${line}: a <Claim> has no source`);
    else cite(`line ${line}: a <Claim>`, attribute[1] ?? attribute[2] ?? "");
  }
  if (!/<Claim\b/.test(body)) problems.push("the body makes no <Claim>: every factual statement needs one");

  for (const tag of body.matchAll(/<Evidence\b([^>]*)>/g)) {
    const status = /\bstatus=(?:"([^"]*)"|'([^']*)')/.exec(tag[1]);
    const value = status?.[1] ?? status?.[2];
    if (!value || !(EVIDENCE as readonly string[]).includes(value)) problems.push(`an <Evidence> has no valid status (${EVIDENCE.join(", ")})`);
  }
  for (const tag of body.matchAll(/<Diagram\b([^>]*)\/?>/g)) {
    const name = /\bname=(?:"([^"]*)"|'([^']*)')/.exec(tag[1]);
    const value = name?.[1] ?? name?.[2];
    if (!value || !context.diagrams.has(value)) problems.push(`a <Diagram> names a drawing that does not exist: "${value ?? ""}"`);
    // a diagram's legend is a set of statements, so it needs a source like any claim
    const from = /\bsource=(?:"([^"]*)"|'([^']*)')/.exec(tag[1]);
    if (!from) problems.push(`the <Diagram> "${value ?? ""}" has no source`);
    else cite(`the <Diagram> "${value ?? ""}"`, from[1] ?? from[2] ?? "");
  }

  for (const entry of frontmatter.sources) {
    if (!used.has(entry.id)) problems.push(`source "${entry.id}" is listed but nothing cites it`);
  }
  for (const id of frontmatter.related) {
    if (id === frontmatter.id || !context.subjects.has(id)) problems.push(`related "${id}" does not resolve to a subject`);
  }
  for (const id of frontmatter.journeys) {
    if (!context.journeys.has(id)) problems.push(`journey "${id}" does not exist`);
  }
  if (frontmatter.scene && !context.scenes.has(frontmatter.scene)) problems.push(`scene "${frontmatter.scene}" is not in the scene registry`);
  // a callout is pinned to a place its scene reports; an unknown name would never be placed
  const pinned = new Set<string>();
  for (const entry of frontmatter.callouts) {
    if (pinned.has(entry.anchor)) problems.push(`callout anchor "${entry.anchor}" is used twice`);
    pinned.add(entry.anchor);
    const known = frontmatter.scene ? context.anchors.get(frontmatter.scene) : undefined;
    if (!known?.has(entry.anchor)) problems.push(`callout anchor "${entry.anchor}" is not a place the scene "${frontmatter.scene ?? ""}" reports`);
  }

  return { frontmatter, problems };
}
