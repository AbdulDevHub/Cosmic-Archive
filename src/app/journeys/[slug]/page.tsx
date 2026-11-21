import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceLine } from "@/components/atlas/Evidence";
import { JourneyTrail } from "@/components/journey/JourneyTrail";
import { allJourneys, getJourney, type JourneyFork } from "@/lib/content/journeys";
import { getSubject } from "@/lib/content/subjects";
import styles from "./page.module.css";

/*
  A journey (PROJECT_BLUEPRINT.md 7): a path that explains why one topic leads to the next. No
  scene in v1 (ARCHITECTURE.md 2): the page is the trail itself, in server HTML. The words are the
  journey's file in content/journeys; this is the frame around them.
*/

export const dynamicParams = false;

export function generateStaticParams() {
  return allJourneys().map((journey) => ({ slug: journey.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const journey = getJourney((await params).slug);
  if (!journey) return {};
  return { title: journey.title, description: journey.description };
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (day: string) => DATE.format(new Date(`${day}T00:00:00Z`));

/** The subject pages a journey passes through, once each, in order. */
function subjectsOf(stops: readonly { subject?: string }[], fork: JourneyFork): string[] {
  const ids = stops.flatMap((stop) => (stop.subject ? [stop.subject] : []));
  for (const branch of fork.branches) ids.push(...subjectsOf(branch.stops, branch.fork ?? { why: "", sources: [], branches: [] }));
  return [...new Set(ids)];
}

export default async function JourneyPage({ params }: Props) {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) notFound();
  const subjects = subjectsOf(journey.trunk, journey.fork).flatMap((id) => {
    const subject = getSubject(id);
    return subject ? [subject] : [];
  });

  return (
    <article className={styles.page}>
      <p className={styles.kind}>Journey</p>
      <h1 className={styles.title}>{journey.title}</h1>
      <p className={styles.hook}>{journey.hook}</p>
      <p className={styles.status}>
        <EvidenceLine evidence="established" />
        <span>
          <strong>Established.</strong> Every step on this line is settled science, so the line is drawn solid.
        </span>
      </p>

      <JourneyTrail journey={journey} />

      <section className={styles.after} aria-labelledby="next">
        <h2 id="next" className={styles.section}>
          Where to go next
        </h2>
        <ul className={styles.links}>
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Link href={`/subjects/${subject.id}`}>{subject.title}</Link>
              <span>{subject.hook}</span>
            </li>
          ))}
          <li>
            <Link href="/archive">The archive</Link>
            <span>Everything here, in one plain list.</span>
          </li>
        </ul>
      </section>

      <section className={styles.after} aria-labelledby="sources">
        <h2 id="sources" className={styles.section}>
          Sources
        </h2>
        <ol className={styles.sources}>
          {journey.sources.map((source) => (
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
        <p className={styles.reviewed}>Last reviewed {longDate(journey.lastReviewed)}.</p>
      </section>
    </article>
  );
}
