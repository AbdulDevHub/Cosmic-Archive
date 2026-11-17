import Link from "next/link";
import { EvidenceLegend } from "@/components/atlas/Evidence";
import { UNCHARTED } from "@/lib/content/atlas";
import styles from "./home.module.css";

/*
  Uncharted (DESIGN_SPEC.md 7.5): the frontiers teaser, drawn entirely in dashed and dotted ink,
  with the evidence legend beside it. The orbits stand for ideas with no place on the map; they
  carry no names, because no single idea's status is claimed here. Theoretical Frontiers is after
  v1, so the link goes to how certainty is drawn.
*/

export function UnchartedTeaser() {
  return (
    <section className={`${styles.section} ${styles.uncharted}`} aria-labelledby="uncharted-title">
      <svg className={styles.orbits} viewBox="-160 -110 320 220" aria-hidden="true">
        <ellipse rx="150" ry="62" strokeDasharray="14 7" transform="rotate(-14)" />
        <ellipse rx="112" ry="88" strokeDasharray="5 6" transform="rotate(22)" />
        <ellipse rx="70" ry="40" strokeDasharray="0.1 6" strokeLinecap="round" strokeWidth="2" transform="rotate(-38)" />
        <circle r="3" className={styles.orbitCore} />
      </svg>
      <div className={styles.unchartedCopy}>
        <h2 id="uncharted-title">{UNCHARTED.label}</h2>
        <p className={styles.lede}>{UNCHARTED.note}</p>
        <EvidenceLegend />
        <Link className={styles.textLink} href="/about#evidence">
          How we draw what is certain and what is not
        </Link>
      </div>
    </section>
  );
}
