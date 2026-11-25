"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Verse } from "@/content/verses";
import { aboutFrom } from "@/lib/about";
import { SceneSlot } from "@/scene/host/SceneSlot";
import { ArrowIcon } from "../icons";
import styles from "./about.module.css";
import screen from "./screen.module.css";

/*
  About (D-184, D-185): what the site is and how to travel it, and beside it Islam and Space (D-179),
  a few verses about the heavens. The scene is the atlas held at the cosmic web, with no controls (an
  early stop: nothing out past it is given away); everything else is server HTML, each verse a link
  to the whole verse on Quran.com. Back returns to wherever the visitor opened About from.
*/

const POSTERS = { wide: "/posters/about-wide.webp", narrow: "/posters/about-narrow.webp" };
const WEB = 2;
const REPO = "https://github.com/AbdulDevHub/Cosmic-Atlas";

/** The Clear Quran marks words added for sense with ˹ ˺, which our fonts lack: shown as [ ]. */
const shown = (text: string) => text.replace(/˹/g, "[").replace(/˺/g, "]");

export function AboutView({ versesTitle, versesLine, verses }: { versesTitle: string; versesLine: string; verses: readonly Verse[] }) {
  const router = useRouter();
  return (
    <div className={styles.screen}>
      <SceneSlot id="atlas" mode="atlas" posters={POSTERS} opening={() => ({ zoom: WEB })} />
      {/* D-200: a soft dark wash over the web behind the words, so they read */}
      <div className={styles.dim} aria-hidden="true" />
      <div className={styles.words}>
        <section>
          <h1>About</h1>
          <p className={styles.line}>The universe to look at, not to read about.</p>
          <div className={styles.about}>
            <p>
              Cosmic Atlas is a journey you click through, from a spiral galaxy out to the edge of everything. Every scene is drawn live in your browser,
              and every picture is our own illustration, never a photograph.
            </p>
            {/* D-200: the last three sentences are one paragraph */}
            <p>
              Each view has a name and one line, and every line is checked against a real source. Click a light to fly into it, press Zoom Out to pull
              back, and drag to look around. Cosmic Atlas is open source:{" "}
              <a href={REPO} target="_blank" rel="noopener noreferrer">
                see the code on GitHub
              </a>
              .
            </p>
          </div>
        </section>

        <section>
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
        </section>
      </div>
      <Link
        className={`${screen.control} ${styles.leave}`}
        href="/#atlas"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return;
          event.preventDefault();
          router.push(aboutFrom());
        }}
      >
        <i className={screen.icon} aria-hidden="true">
          <ArrowIcon />
        </i>
        <span>Back</span>
      </Link>
    </div>
  );
}
