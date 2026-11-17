import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";
import { EvidenceLine } from "@/components/atlas/Evidence";
import { subjectComponents } from "@/components/subject/body";
import { SubjectHero } from "@/components/subject/SubjectHero";
import styles from "@/components/subject/subject.module.css";
import { EVIDENCE_WORD } from "@/lib/content/atlas";
import { allSubjects, getSubject, relatedTo } from "@/lib/content/subjects";
import type { SceneId } from "@/scene/host/store";

/*
  A subject page (PROJECT_BLUEPRINT.md 7, DESIGN_SPEC.md 8): the subject's scene with its title
  and hook, then a readable column. The words are the MDX file in content/subjects; this file is
  the frame around them. Static: one page per file.
*/

export const dynamicParams = false;

export function generateStaticParams() {
  return allSubjects().map((subject) => ({ slug: subject.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = getSubject((await params).slug);
  if (!subject) return {};
  return { title: subject.title, description: subject.description };
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (day: string) => DATE.format(new Date(`${day}T00:00:00Z`));

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  const { default: Body } = (await import(`@content/subjects/${slug}.mdx`)) as { default: ComponentType<{ components?: MDXComponents }> };
  const scene = (subject.scene ?? null) as SceneId | null;
  const posters = scene ? { wide: `/posters/${scene}-wide.webp`, narrow: `/posters/${scene}-narrow.webp` } : null;
  const related = relatedTo(subject);

  return (
    <article className={styles.page}>
      <SubjectHero scene={scene} posters={posters} callouts={subject.callouts.map(({ anchor, label, note }) => ({ anchor, label, note }))}>
        <p className={styles.status}>
          <EvidenceLine evidence={subject.status} />
          <span>
            <strong>{EVIDENCE_WORD[subject.status]}.</strong> {subject.statusNote}
          </span>
        </p>
        <h1>{subject.title}</h1>
        <p className={styles.hook}>{subject.hook}</p>
      </SubjectHero>

      <div className={styles.body}>
        <div className={styles.column}>
          <Body components={subjectComponents(subject.sources)} />

          {subject.observations.length > 0 ? (
            <section aria-labelledby="seen">
              <h2 id="seen" className={styles.section}>
                What we have actually seen
              </h2>
              <p>The picture on this page is our own illustration. These are the real observations, at their source.</p>
              <ul className={styles.links}>
                {subject.observations.map((observation) => (
                  <li key={observation.url}>
                    <a href={observation.url} rel="noopener">
                      {observation.label}
                    </a>
                    <span>{observation.publisher}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section aria-labelledby="next">
              <h2 id="next" className={styles.section}>
                Where to go next
              </h2>
              <ul className={styles.links}>
                {related.map((entry) => (
                  <li key={entry.id}>
                    {entry.href ? <Link href={entry.href}>{entry.title}</Link> : <span className={styles.unwritten}>{entry.title}</span>}
                    <span>{entry.hook ?? "This page is not written yet."}</span>
                  </li>
                ))}
                <li>
                  <Link href="/explore">The atlas</Link>
                  <span>Find this on the map.</span>
                </li>
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="sources">
            <h2 id="sources" className={styles.section}>
              Sources
            </h2>
            <ol className={styles.sources}>
              {subject.sources.map((source) => (
                <li key={source.id} id={`source-${source.id}`}>
                  <a href={source.url} rel="noopener">
                    {source.title}
                  </a>
                  <span>
                    {source.publisher}. Checked {longDate(source.checked)}.
                  </span>
                </li>
              ))}
            </ol>
            <p className={styles.reviewed}>Last reviewed {longDate(subject.lastReviewed)}.</p>
          </section>
        </div>
      </div>
    </article>
  );
}
