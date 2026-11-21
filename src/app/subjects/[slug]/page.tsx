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
import { getJourney } from "@/lib/content/journeys";
import { allSubjects, getSubject, relatedTo } from "@/lib/content/subjects";
import { jsonLd, ogImage, pageMetadata, SCENE_OG, SITE_NAME, SITE_URL } from "@/lib/site";
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
  const og = subject.scene ? SCENE_OG[subject.scene] : undefined;
  return pageMetadata({
    title: subject.title,
    description: subject.description,
    path: `/subjects/${subject.id}`,
    image: og ? ogImage(og.name, og.alt) : undefined,
    type: "article",
    modified: subject.lastReviewed,
  });
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (day: string) => DATE.format(new Date(`${day}T00:00:00Z`));

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  const { default: Body } = (await import(`@content/subjects/${slug}.mdx`)) as { default: ComponentType<{ components?: MDXComponents }> };
  const scene = (subject.scene ?? null) as SceneId | null;
  // the atlas has a poster per homepage stage; a subject page shows it in its subject framing
  const poster = scene === "atlas" ? "atlas-subject" : scene;
  const posters = poster ? { wide: `/posters/${poster}-wide.webp`, narrow: `/posters/${poster}-narrow.webp` } : null;
  const related = relatedTo(subject);
  const journeys = subject.journeys.flatMap((id) => {
    const journey = getJourney(id);
    return journey ? [journey] : [];
  });

  // for search engines: the page as a schema.org Article, its sources as citations
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: subject.title,
    description: subject.description,
    url: `${SITE_URL}/subjects/${subject.id}`,
    dateModified: subject.lastReviewed,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    citation: subject.sources.map((source) => ({ "@type": "CreativeWork", name: source.title, url: source.url, publisher: { "@type": "Organization", name: source.publisher } })),
  };

  return (
    <article className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
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
                {journeys.map((journey) => (
                  <li key={journey.id}>
                    <Link href={`/journeys/${journey.id}`}>Journey: {journey.title}</Link>
                    <span>{journey.hook}</span>
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
