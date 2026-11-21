import Link from "next/link";
import { getJourney, previewOf, type PreviewStop } from "@/lib/content/journeys";
import { getSubject } from "@/lib/content/subjects";
import styles from "./home.module.css";

/*
  A journey (DESIGN_SPEC.md 7.5): "A star's life" drawn as one branching line, the vessel's trail.
  A cloud, a star, then the fork to a white dwarf, a neutron star or a black hole, with the reason
  for the fork written at the fork. The line is solid ink: every stop is established science.

  Made from the journey itself (content/journeys); the whole journey, with why each step leads to
  the next, is its own page.
*/

function Stop({ stop }: { stop: PreviewStop }) {
  const subject = stop.subject ? getSubject(stop.subject) : undefined;
  return (
    <>
      <i className={styles.stopDot} aria-hidden="true" />
      {stop.branch ? <span className={styles.branch}>{stop.branch}</span> : null}
      <span className={styles.stopName}>{stop.label}</span>
      <span className={styles.stopNote}>{stop.note}</span>
      {subject ? (
        <Link className={styles.stopLink} href={`/subjects/${subject.id}`}>
          Read about {subject.title.toLowerCase()}
        </Link>
      ) : null}
    </>
  );
}

export function JourneyPreview() {
  const full = getJourney("a-stars-life");
  if (!full) return null;
  const journey = previewOf(full);
  return (
    <section className={styles.section} aria-labelledby="journey-title">
      <h2 id="journey-title">{journey.title}</h2>
      <p className={styles.lede}>One line from a cloud of gas to three very different ends.</p>
      <ol className={styles.journey}>
        {journey.trunk.map((stop) => (
          <li key={stop.id} className={styles.stop}>
            <Stop stop={stop} />
          </li>
        ))}
        <li className={styles.fork}>
          <p className={styles.forkWhy}>{journey.fork}</p>
          <ul className={styles.ends}>
            {journey.ends.map((stop) => (
              <li key={stop.id} className={styles.stop}>
                <Stop stop={stop} />
              </li>
            ))}
          </ul>
        </li>
      </ol>
      <p className={styles.journeyMore}>
        <Link href={`/journeys/${journey.id}`}>Follow the whole journey</Link>, and why each step leads to the next.
      </p>
    </section>
  );
}
