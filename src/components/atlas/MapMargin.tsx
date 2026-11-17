import Link from "next/link";
import { UNCHARTED } from "@/lib/content/atlas";
import styles from "./atlas.module.css";
import { EvidenceLegend, EvidenceRing } from "./Evidence";

/**
 * The map's margin at the zoomed-out view (DESIGN_SPEC.md 7.4): a dashed rule, the entry for the
 * ideas that have no place on the map, and the key to the line styles.
 */
export function MapMargin({ className }: { className?: string }) {
  return (
    <div className={`${styles.margin} ${className ?? ""}`}>
      <Link className={styles.uncharted} href={UNCHARTED.href}>
        <EvidenceRing evidence={UNCHARTED.evidence} />
        <span className={styles.label}>
          {UNCHARTED.label}
          <span className={styles.note}>{UNCHARTED.note}</span>
        </span>
      </Link>
      <EvidenceLegend />
    </div>
  );
}
