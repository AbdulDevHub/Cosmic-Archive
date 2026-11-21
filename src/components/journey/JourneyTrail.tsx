import Link from "next/link";
import type { CSSProperties } from "react";
import type { Journey, JourneyFork, JourneyStop } from "@/lib/content/journeys";
import { getSubject } from "@/lib/content/subjects";
import styles from "./journey.module.css";

/*
  A journey drawn as the vessel's trail (DESIGN_SPEC.md 1, 7.5): one hairline down the page, a dot
  at each stop, and between two stops the reason the first leads to the second. Where the science
  forks the line divides, with the reason for the fork written at it. Solid ink throughout: every
  stop on this journey is established science (the stops' evidence says so; a stop that was not
  would be drawn in its own line style).

  Plain server HTML: an ordered list of stops, the branches as nested lists. No scene, no script.
*/

type NumberOf = (id: string) => number | undefined;

function References({ sources, numberOf }: { sources: readonly string[]; numberOf: NumberOf }) {
  return (
    <sup className={styles.refs}>
      {sources.map((id) => (
        <a key={id} href={`#source-${id}`} aria-label={`Source ${numberOf(id)}`}>
          {numberOf(id)}
        </a>
      ))}
    </sup>
  );
}

function Stop({ stop, numberOf, end }: { stop: JourneyStop; numberOf: NumberOf; end: boolean }) {
  const subject = stop.subject ? getSubject(stop.subject) : undefined;
  return (
    <li className={styles.stop} data-evidence={stop.evidence} data-end={end ? "" : undefined}>
      <i className={styles.dot} aria-hidden="true" />
      <h2 className={styles.label} id={stop.id}>
        {stop.label}
      </h2>
      <p className={styles.note}>
        {stop.note}
        {stop.why ? null : <References sources={stop.sources} numberOf={numberOf} />}
      </p>
      {subject ? (
        <Link className={styles.subject} href={`/subjects/${subject.id}`}>
          Read about {subject.title.toLowerCase()}
        </Link>
      ) : null}
      {stop.why ? (
        <p className={styles.why}>
          <span className={styles.whyWord}>Why it leads on</span>
          {stop.why}
          <References sources={stop.sources} numberOf={numberOf} />
        </p>
      ) : null}
    </li>
  );
}

function Fork({ fork, numberOf, depth }: { fork: JourneyFork; numberOf: NumberOf; depth: number }) {
  return (
    <li className={styles.fork} data-depth={depth}>
      <p className={styles.forkWhy}>
        <span className={styles.whyWord}>The line divides</span>
        {fork.why}
        <References sources={fork.sources} numberOf={numberOf} />
      </p>
      <ul className={styles.branches} style={{ "--branches": fork.branches.length } as CSSProperties}>
        {fork.branches.map((branch) => (
          <li key={branch.id} className={styles.branch}>
            <p className={styles.who}>
              {branch.who}
              <References sources={branch.sources} numberOf={numberOf} />
            </p>
            <ol className={styles.stops}>
              {branch.stops.map((stop, index) => (
                <Stop key={stop.id} stop={stop} numberOf={numberOf} end={!branch.fork && index === branch.stops.length - 1} />
              ))}
              {branch.fork ? <Fork fork={branch.fork} numberOf={numberOf} depth={depth + 1} /> : null}
            </ol>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function JourneyTrail({ journey }: { journey: Journey }) {
  const numbers = new Map(journey.sources.map((source, index) => [source.id, index + 1]));
  const numberOf: NumberOf = (id) => numbers.get(id);
  return (
    <ol className={`${styles.stops} ${styles.trail}`}>
      {journey.trunk.map((stop) => (
        <Stop key={stop.id} stop={stop} numberOf={numberOf} end={false} />
      ))}
      <Fork fork={journey.fork} numberOf={numberOf} depth={0} />
    </ol>
  );
}
