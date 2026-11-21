import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceLine } from "@/components/atlas/Evidence";
import {
  DESTINATIONS,
  EVIDENCE_WORD,
  type Evidence,
} from "@/lib/content/atlas";
import { TEASERS } from "@/lib/content/home";
import { allJourneys } from "@/lib/content/journeys";
import { allSubjects } from "@/lib/content/subjects";
import { pageMetadata } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Archive",
  description: "Everything in Cosmic Archive in one plain list, with how certain each subject is and when it was last reviewed.",
  path: "/archive",
});

/*
  The archive (PROJECT_BLUEPRINT.md 4): a plain index of everything published, then what is being
  written (when anything is), as words only. Server HTML, no scene. A page that is not written is not a link.
*/

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface Entry {
  id: string;
  kind: string;
  title: string;
  line: string;
  evidence?: Evidence;
  href?: string;
  reviewed?: string;
}

function Row({ entry }: { entry: Entry }) {
  const inner = (
    <>
      <span className={styles.kind}>{entry.kind}</span>
      <span className={styles.name}>{entry.title}</span>
      <span className={styles.line}>{entry.line}</span>
      <span className={styles.meta}>
        {entry.evidence ? (
          <span className={styles.status}>
            <EvidenceLine evidence={entry.evidence} />
            {EVIDENCE_WORD[entry.evidence]}
          </span>
        ) : null}
        {entry.reviewed ? (
          <span>
            Last reviewed {DATE.format(new Date(`${entry.reviewed}T00:00:00Z`))}
          </span>
        ) : null}
      </span>
    </>
  );
  return (
    <li>
      {entry.href ? (
        <Link className={styles.row} href={entry.href}>
          {inner}
        </Link>
      ) : (
        <div className={styles.row}>{inner}</div>
      )}
    </li>
  );
}

export default function Archive() {
  const subjects = allSubjects();
  const published: Entry[] = [
    ...subjects.map((subject) => ({
      id: subject.id,
      kind: "Subject",
      title: subject.title,
      line: subject.hook,
      evidence: subject.status,
      href: `/subjects/${subject.id}`,
      reviewed: subject.lastReviewed,
    })),
    ...allJourneys().map((journey) => ({
      id: journey.id,
      kind: "Journey",
      title: journey.title,
      line: journey.hook,
      href: `/journeys/${journey.id}`,
      reviewed: journey.lastReviewed,
    })),
    {
      id: "atlas",
      kind: "Atlas",
      title: "The atlas",
      line: "A spiral galaxy, then the cosmic web, under your own control.",
      href: "/explore",
    },
  ];
  const written = new Set(subjects.map((subject) => subject.id));
  const coming: Entry[] = [
    ...TEASERS.filter((teaser) => !written.has(teaser.id)).map((teaser) => {
      const destination = DESTINATIONS.find((entry) => entry.id === teaser.id);
      return {
        id: teaser.id,
        kind: "Subject",
        title: destination?.label ?? teaser.id,
        line: teaser.line,
        evidence: destination?.evidence,
      };
    }),
  ];

  return (
    <article className={styles.page}>
      <h1 className={styles.title}>Archive</h1>
      <p className={styles.lede}>
        Everything here, in one plain list. The line beside a subject shows how
        certain it is.
      </p>

      <section className={styles.group} aria-labelledby="published-title">
        <h2 id="published-title">Published</h2>
        <ul className={styles.rows}>
          {published.map((entry) => (
            <Row key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>

      {coming.length > 0 ? (
        <section className={styles.group} aria-labelledby="coming-title">
          <h2 id="coming-title">Being written</h2>
          <p className={styles.note}>
            These open one at a time, each after its sources are read and a
            person has reviewed it.
          </p>
          <ul className={`${styles.rows} ${styles.coming}`}>
            {coming.map((entry) => (
              <Row key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
