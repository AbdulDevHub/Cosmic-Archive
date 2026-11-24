"use client";

import Link from "next/link";
import type { Verse } from "@/content/verses";
import { SceneSlot } from "@/scene/host/SceneSlot";
import styles from "./verses.module.css";

/*
  Islam and Space (D-179): the Seven Heavens drawn behind a few verses about the heavens. The scene
  is the atlas held at its last stop, with no controls; the verses are server HTML, each a link to
  the whole verse on Quran.com. Words only, no panels, as on every other screen.
*/

const POSTERS = { wide: "/posters/heavens-wide.webp", narrow: "/posters/heavens-narrow.webp" };
const HEAVENS = 5;

export function VersesView({ title, line, verses }: { title: string; line: string; verses: readonly Verse[] }) {
  return (
    <div className={styles.screen}>
      <SceneSlot id="atlas" mode="atlas" posters={POSTERS} opening={() => ({ zoom: HEAVENS })} />
      <div className={styles.words}>
        <h1>{title}</h1>
        <p className={styles.line}>{line}</p>
        <ol className={styles.verses}>
          {verses.map((verse) => (
            <li key={verse.key}>
              <blockquote cite={verse.url}>
                <p>{verse.text}</p>
              </blockquote>
              <a className={styles.cite} href={verse.url} target="_blank" rel="noopener noreferrer">
                Quran {verse.key} · {verse.surah} · The Clear Quran
              </a>
            </li>
          ))}
        </ol>
        <Link className={styles.back} href="/#heavens">
          Back to the Seven Heavens
        </Link>
      </div>
    </div>
  );
}
