import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceLine } from "@/components/atlas/Evidence";
import { EVIDENCE_WORD, type Evidence } from "@/lib/content/atlas";
import { pageMetadata } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "What Cosmic Archive is, how it draws what is certain and what is not, and how every page is sourced.",
  path: "/about",
});

/*
  About (PROJECT_BLUEPRINT.md 4 and 6): the purpose, the evidence legend, the sourcing method, the
  imagery rule and the credits. Nothing here is a claim about the universe; it describes how the
  site works, so it cites no sources.
*/

/** PROJECT_BLUEPRINT.md 6.1, in the site's own words. */
const LEGEND: readonly { evidence: Evidence; meaning: string; drawn: string }[] = [
  { evidence: "observed", meaning: "Directly detected. The page says how.", drawn: "Solid ink" },
  { evidence: "established", meaning: "Supported by several independent lines of evidence that agree.", drawn: "Solid ink" },
  { evidence: "theoretical", meaning: "A model that has been tested or can be tested, but is not directly confirmed.", drawn: "Long dashes" },
  { evidence: "hypothetical", meaning: "Proposed, but not confirmed.", drawn: "Short dashes" },
  { evidence: "speculative", meaning: "Little or no evidence for it yet.", drawn: "Dots" },
];

const METHOD: readonly string[] = [
  "Sources come first. Before a page is written, its sources are fetched and read: NASA, ESA, ESO, the Event Horizon Telescope, LIGO, major observatories, peer-reviewed papers and university research groups.",
  "Every statement of fact is tied to the source it came from, and every source is listed at the end of its page with the date it was checked.",
  "The site will not build if a statement names a source that is not listed, or a source has no checked date.",
  "No number, distance, date or name is written from memory. If no source was read for it, it is not on the page.",
  "Where researchers disagree, the page says so. Where a figure is an estimate, the page gives the source's own range and wording.",
  "Each page is read by a person before it is published, and shows when it was last reviewed.",
];

/* Designer names from the Google Fonts metadata (github.com/google/fonts, ofl/syne and ofl/hankengrotesk METADATA.pb), checked 2026-11-17. */
const CREDITS: readonly { name: string; what: string; href: string }[] = [
  { name: "Syne", what: "the display typeface, by Bonjour Monde, Lucas Descroix and George Triantafyllakos", href: "https://fonts.google.com/specimen/Syne" },
  { name: "Hanken Grotesk", what: "the text typeface, by Alfredo Marco Pradil and Hanken Design Co.", href: "https://fonts.google.com/specimen/Hanken+Grotesk" },
  { name: "three.js", what: "draws the scenes in WebGL", href: "https://threejs.org/" },
  { name: "React Three Fiber", what: "connects the scenes to React", href: "https://r3f.docs.pmnd.rs/" },
  { name: "Next.js", what: "builds and serves the pages", href: "https://nextjs.org/" },
];

export default function About() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>About</h1>
      <p className={styles.lede}>
        Cosmic Archive is a living atlas of the universe: scenes you can move through, with a map-maker&rsquo;s ink drawn
        over them, and pages that explain what we know, how we know it, and what nobody knows yet.
      </p>
      <p>
        It is made for anyone who is curious about space, with or without a science background. You can find your way
        by eye on the <Link href="/explore">atlas</Link>, look things up in the <Link href="/archive">archive</Link>, or
        follow a journey from one idea to the next.
      </p>

      <section id="evidence" className={styles.part} aria-labelledby="evidence-title">
        <h2 id="evidence-title">How certainty is drawn</h2>
        <p>
          Every subject, and every statement that is less certain than its page, carries one of these labels. The line
          style and the word always appear together, so neither colour nor line has to carry the meaning alone. The
          labels say how sure science is, not how interesting an idea is.
        </p>
        <dl className={styles.legend}>
          {LEGEND.map((row) => (
            <div key={row.evidence} className={styles.legendRow}>
              <dt>
                <EvidenceLine evidence={row.evidence} />
                {EVIDENCE_WORD[row.evidence]}
              </dt>
              <dd>
                {row.meaning} <span className={styles.drawn}>{row.drawn}.</span>
              </dd>
            </div>
          ))}
        </dl>
        <p>
          Ideas that have no confirmed place in the universe are not put on the map. They wait at its margin, under
          Uncharted, in dashed ink.
        </p>
      </section>

      <section id="method" className={styles.part} aria-labelledby="method-title">
        <h2 id="method-title">How every page is sourced</h2>
        <ol className={styles.method}>
          {METHOD.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section id="imagery" className={styles.part} aria-labelledby="imagery-title">
        <h2 id="imagery-title">Every picture is an illustration</h2>
        <p>
          The scenes, the stills made from them and the diagrams are all drawn for this site. None of them is a
          photograph or a measurement, and the atlas is not to scale. Real observations, such as the first images of
          black holes, are linked to where their makers published them, never copied here.
        </p>
      </section>

      <section id="credits" className={styles.part} aria-labelledby="credits-title">
        <h2 id="credits-title">Credits</h2>
        <ul className={styles.credits}>
          {CREDITS.map((credit) => (
            <li key={credit.name}>
              <a href={credit.href} rel="noreferrer">
                {credit.name}
              </a>
              , {credit.what}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
