import type { Metadata } from "next";
import Link from "next/link";
import { ATLAS_OBSERVATIONS, PLACES, SOURCES } from "@/lib/content/places";
import { pageMetadata } from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: "What Cosmic Archive is, where its few words come from, and where to see the real thing.",
  path: "/about",
});

/*
  About (D-095): the one page of words. What the site is, that every picture is our own
  illustration, links to the real observations, the sources behind the few lines the site says,
  and the credits.
*/

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (day: string) => DATE.format(new Date(`${day}T00:00:00Z`));

const SEEN = [
  { title: "Galaxies and the cosmic web", observations: ATLAS_OBSERVATIONS },
  ...PLACES.map((place) => ({ title: place.name, observations: place.observations })),
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
        Cosmic Archive is the universe to look at. Start in <Link href="/">the galaxy</Link>, pull back to the cosmic web,
        and click a light to fall into it.
      </p>
      <p>
        Every picture is our own illustration, drawn for this site in real time. None is a photograph, and nothing is to
        scale.
      </p>

      <section id="seen" className={styles.part} aria-labelledby="seen-title">
        <h2 id="seen-title">The real thing</h2>
        <p>Telescope images, at the places their makers published them.</p>
        {SEEN.map((group) => (
          <div key={group.title} className={styles.group}>
            <h3>{group.title}</h3>
            <ul className={styles.links}>
              {group.observations.map((observation) => (
                <li key={observation.url}>
                  <a href={observation.url} rel="noopener">
                    {observation.label}
                  </a>
                  <span>{observation.publisher}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="sources" className={styles.part} aria-labelledby="sources-title">
        <h2 id="sources-title">Sources</h2>
        <p>Each line the site says comes from one of these pages, read on the date given.</p>
        <ul className={styles.links}>
          {SOURCES.map((source) => (
            <li key={source.id}>
              <a href={source.url} rel="noopener">
                {source.title}
              </a>
              <span>
                {source.publisher}. Checked {longDate(source.checked)}.
              </span>
            </li>
          ))}
        </ul>
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
