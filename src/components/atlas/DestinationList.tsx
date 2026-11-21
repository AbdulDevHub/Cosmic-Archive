import Link from "next/link";
import { destinationsAt, EVIDENCE_WORD, UNCHARTED, type Evidence } from "@/lib/content/atlas";
import styles from "./atlas.module.css";
import { EvidenceLine } from "./Evidence";

/*
  The list view of the atlas (DESIGN_SPEC.md 9): the same destinations as the beacons, as plain
  links, with each one's evidence drawn and written. It is the target of "Skip to destinations"
  and of the atlas's "List view" link, and needs no scene and no script.
  The homepage has the illustrated Destinations section (O1); this list is the index on /explore.
  A row whose destination has no page of its own yet says so, and where its link goes instead.
*/

interface Row {
  id: string;
  label: string;
  note: string;
  evidence: Evidence;
  href: string;
}

const GROUPS: readonly { title: string; rows: readonly Row[] }[] = [
  { title: "Inside the galaxy", rows: destinationsAt(1) },
  { title: "Among the galaxies", rows: destinationsAt(2) },
  { title: "Off the map", rows: [UNCHARTED] },
];

export function DestinationList() {
  return (
    <section id="destinations" className={styles.index} aria-labelledby="destinations-title">
      <h2 id="destinations-title">The atlas as a list</h2>
      <p className={styles.indexIntro}>Every beacon on the chart, in plain words. The line beside each one shows how certain it is.</p>
      <div className={styles.groups}>
        {GROUPS.map((group) => (
          <div key={group.title} className={styles.group}>
            <h3>{group.title}</h3>
            <ul className={styles.rows}>
              {group.rows.map((row) => (
                <li key={row.id}>
                  <Link className={styles.row} href={row.href}>
                    <span className={styles.rowName}>{row.label}</span>
                    <span className={styles.rowNote}>{row.note}</span>
                    <span className={styles.rowStatus}>
                      <EvidenceLine evidence={row.evidence} />
                      {EVIDENCE_WORD[row.evidence]}
                    </span>
                    {/* a destination without its own page yet says where the link goes instead */}
                    {row.href.startsWith("/subjects/") ? null : <span className={styles.rowWhere}>Its own pages come later. For now, the About page explains it.</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
