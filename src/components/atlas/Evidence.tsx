import { EVIDENCE_WORD, type Evidence } from "@/lib/content/atlas";
import styles from "./atlas.module.css";

/*
  Evidence is drawn (DESIGN_SPEC.md 1 and 5): solid ink for observed or established, long dashes
  theoretical, short dashes hypothetical, dots speculative. Never the line alone: every use here
  sits beside the word, or carries it for screen readers.
*/

/** Dashes for the legend's 40 px line samples (the prototype's). */
const LINE_DASH: Record<Evidence, string | undefined> = {
  observed: undefined,
  established: undefined,
  theoretical: "11 5",
  hypothetical: "4 4",
  speculative: "0.1 5",
};

/** The same styles on a beacon's ring, 8 px in radius: four long dashes, eight short ones, fourteen dots. */
const RING_DASH: Record<Evidence, string | undefined> = {
  observed: undefined,
  established: undefined,
  theoretical: "8.8 3.77",
  hypothetical: "3.4 2.88",
  speculative: "0.1 3.49",
};

/** A beacon's mark: a small ring with a dot, drawn in its destination's evidence style. */
export function EvidenceRing({ evidence, className }: { evidence: Evidence; className?: string }) {
  const dotted = evidence === "speculative";
  return (
    <svg className={`${styles.ring} ${className ?? ""}`} viewBox="-8.5 -8.5 17 17" aria-hidden="true">
      <circle className={styles.hit} r="22" />
      <circle className={styles.ringLine} r="8" strokeDasharray={RING_DASH[evidence]} strokeLinecap={dotted ? "round" : undefined} strokeWidth={dotted ? 1.6 : 1} />
      <circle className={styles.ringDot} r="1.75" />
    </svg>
  );
}

/** A short sample of an evidence line style. */
export function EvidenceLine({ evidence }: { evidence: Evidence }) {
  const dotted = evidence === "speculative";
  return (
    <svg className={styles.sample} aria-hidden="true">
      <line x1="0" y1="3" x2="40" y2="3" strokeDasharray={LINE_DASH[evidence]} strokeLinecap={dotted ? "round" : undefined} strokeWidth={dotted ? 2 : 1.25} />
    </svg>
  );
}

const LEGEND: readonly Evidence[] = ["observed", "theoretical", "hypothetical", "speculative"];

/** The key to the line styles, drawn as line samples with their words. */
export function EvidenceLegend() {
  return (
    <ul className={styles.legend} aria-label="How certainty is drawn">
      {LEGEND.map((evidence) => (
        <li key={evidence}>
          <EvidenceLine evidence={evidence} />
          {EVIDENCE_WORD[evidence]}
        </li>
      ))}
    </ul>
  );
}
