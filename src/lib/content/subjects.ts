/**
 * Loads the subject pages' frontmatter and checks every file once, at build time, with the same
 * rules as `npm run check` (subject-check.ts). A broken reference fails the build instead of
 * reaching a page. Server only: it reads content/ from disk.
 */

import { DESTINATIONS } from "@content/destinations";
import { checkSubject, type SubjectFrontmatter } from "./subject-check";
import { readContext, readSubject, subjectSlugs } from "./subject-context";

export type { SubjectCallout, SubjectFrontmatter, SubjectSource } from "./subject-check";
export { sourceIds } from "./subject-check";

const context = readContext(DESTINATIONS.map((destination) => destination.id));

const SUBJECTS = new Map<string, SubjectFrontmatter>();
for (const slug of subjectSlugs()) {
  const { frontmatter, problems } = checkSubject(readSubject(slug), slug, context);
  if (problems.length > 0 || !frontmatter) throw new Error(`content/subjects/${slug}.mdx:\n  ${problems.join("\n  ")}`);
  SUBJECTS.set(slug, frontmatter);
}

export function allSubjects(): SubjectFrontmatter[] {
  return [...SUBJECTS.values()];
}

export function getSubject(slug: string): SubjectFrontmatter | undefined {
  return SUBJECTS.get(slug);
}

/** A related subject: a link once its page is written, a name until then. */
export interface RelatedSubject {
  id: string;
  title: string;
  hook: string | null;
  href: string | null;
}

export function relatedTo(subject: SubjectFrontmatter): RelatedSubject[] {
  return subject.related.map((id) => {
    const written = SUBJECTS.get(id);
    if (written) return { id, title: written.title, hook: written.hook, href: `/subjects/${id}` };
    const planned = DESTINATIONS.find((destination) => destination.id === id);
    return { id, title: planned?.label ?? id, hook: null, href: null };
  });
}
