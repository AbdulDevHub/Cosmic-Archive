import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { EVIDENCE_WORD, type Evidence } from "@/lib/content/atlas";
import { sourceIds, type SubjectSource } from "@/lib/content/subjects";
import { EvidenceLine } from "../atlas/Evidence";
import { DIAGRAMS } from "./diagrams";
import styles from "./subject.module.css";

/*
  What a subject's MDX body may use (ARCHITECTURE.md 6): <Claim>, <Evidence>, <Diagram> and
  <Unknowns>, plus plain headings, paragraphs and lists. Layout only: the words and their
  sources are in content/subjects/*.mdx.

  The components are made per page, because a claim's reference number is its source's place in
  that page's list of sources.
*/

/** The words of a heading, for its fragment id. */
function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  return "";
}

/** Ids the page frame already uses (page.tsx), which a heading in the MDX must not take. */
const RESERVED = new Set(["seen", "next", "sources"]);

export function sectionId(children: ReactNode): string {
  const id = plainText(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return RESERVED.has(id) || id.startsWith("source-") ? `section-${id}` : id;
}

export function subjectComponents(sources: readonly SubjectSource[]): MDXComponents {
  const numberOf = new Map(sources.map((source, index) => [source.id, index + 1]));

  /** Small reference marks that lead to the sources at the foot of the page. */
  function References({ source }: { source: string }) {
    return (
      <sup className={styles.refs}>
        {sourceIds(source).map((id) => (
          <a key={id} href={`#source-${id}`} aria-label={`Source ${numberOf.get(id)}`}>
            {numberOf.get(id)}
          </a>
        ))}
      </sup>
    );
  }

  /** A statement of fact and where it comes from. */
  function Claim({ source, children }: { source: string; children: ReactNode }) {
    return (
      <span className={styles.claim}>
        {children}
        <References source={source} />
      </span>
    );
  }

  /** A passage whose certainty differs from the page's: drawn in its line style, and said in words. */
  function EvidenceNote({ status, children }: { status: Evidence; children: ReactNode }) {
    return (
      <aside className={styles.evidence} data-status={status}>
        <p className={styles.evidenceWord}>
          <EvidenceLine evidence={status} />
          {EVIDENCE_WORD[status]}
        </p>
        {children}
      </aside>
    );
  }

  /** One of our own drawings, with its legend (the MDX children) as text beside it. */
  function Diagram({ name, source, children }: { name: string; source: string; children?: ReactNode }) {
    const Drawing = DIAGRAMS[name];
    return (
      <figure className={styles.diagram}>
        {Drawing ? <Drawing /> : null}
        <figcaption>
          <div className={styles.legend}>{children}</div>
          <p className={styles.figureNote}>
            Illustration, not to scale.
            <References source={source} />
          </p>
        </figcaption>
      </figure>
    );
  }

  function Unknowns({ children }: { children: ReactNode }) {
    return <div className={styles.unknowns}>{children}</div>;
  }

  return {
    Claim,
    Evidence: EvidenceNote,
    Diagram,
    Unknowns,
    h2: ({ children, ...rest }: ComponentPropsWithoutRef<"h2">) => (
      <h2 id={sectionId(children)} className={styles.section} {...rest}>
        {children}
      </h2>
    ),
  };
}
