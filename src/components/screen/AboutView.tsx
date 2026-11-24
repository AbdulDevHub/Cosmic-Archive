"use client";

import Link from "next/link";
import type { Verse } from "@/content/verses";
import { SceneSlot } from "@/scene/host/SceneSlot";
import styles from "./about.module.css";

/*
  About (D-184): what the site is and how to travel it, then Islam and Space (D-179), a few verses
  about the heavens, moved here from their own page. The scene is the atlas held at the Omniverse,
  with no controls; everything else is server HTML, each verse a link to the whole verse on
  Quran.com. Words only, no panels, as on every other screen.
*/

const POSTERS = { wide: "/posters/omniverse-wide.webp", narrow: "/posters/omniverse-narrow.webp" };
const OMNIVERSE = 6;
const REPO = "https://github.com/AbdulDevHub/Cosmic-Atlas";

/** The Clear Quran marks words added for sense with ˹ ˺, which our fonts lack: shown as [ ]. */
const shown = (text: string) => text.replace(/˹/g, "[").replace(/˺/g, "]");

export function AboutView({ versesTitle, versesLine, verses }: { versesTitle: string; versesLine: string; verses: readonly Verse[] }) {
  return (
    <div className={styles.screen}>
      <SceneSlot id="atlas" mode="atlas" posters={POSTERS} opening={() => ({ zoom: OMNIVERSE })} />
      <div className={styles.words}>
        <h1>About</h1>
        <p className={styles.line}>The universe to look at, not to read about.</p>
        <div className={styles.about}>
          <p>
            Cosmic Atlas is a journey you click through, from a spiral galaxy out to the omniverse. Every scene is drawn live in your browser, and every
            picture is our own illustration, never a photograph. Each view has a name and one line, and every line is checked against a real source.
          </p>
          <p>Click a light to fly into it, press Zoom Out to pull back, and drag to look around.</p>
          <p>
            Cosmic Atlas is open source.{" "}
            <a href={REPO} target="_blank" rel="noopener noreferrer">
              See the code on GitHub
            </a>
            .
          </p>
        </div>

        <h2 className={styles.section}>{versesTitle}</h2>
        <p className={styles.line}>{versesLine}</p>
        <ol className={styles.verses}>
          {verses.map((verse) => (
            <li key={verse.key}>
              <blockquote cite={verse.url}>
                <p>{shown(verse.text)}</p>
              </blockquote>
              <a className={styles.cite} href={verse.url} target="_blank" rel="noopener noreferrer">
                Quran {verse.key} · {verse.surah} · The Clear Quran
              </a>
            </li>
          ))}
        </ol>
        <Link className={styles.back} href="/#atlas">
          Back to the Atlas
        </Link>
      </div>
    </div>
  );
}
