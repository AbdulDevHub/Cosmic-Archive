"use client";

import { ArrowIcon, AtomIcon, BookIcon, PlanetIcon, SparkIcon } from "../icons";
import styles from "./start.module.css";

/*
  The start page's words (D-107), from the owner's Home.png: a spaced line above the headline,
  "The Universe Awaits" with its last two words in a violet-to-blue gradient, one line under it,
  and a glowing "Begin Your Journey" button. Begin is the way in: the click that is allowed to
  start the music, and the start of the flight into the galaxy. "Scroll to explore" says the wheel
  (or a swipe) does the same.

  The dock at the bottom (Science, Explore, Learn, Discover) is for pages still to come: shown,
  marked "coming soon", doing nothing yet (the owner's call).
*/

export type StartPhase = "start" | "leaving" | "atlas";

const DOCK = [
  { label: "Science", icon: <AtomIcon /> },
  { label: "Explore", icon: <PlanetIcon /> },
  { label: "Learn", icon: <BookIcon /> },
  { label: "Discover", icon: <SparkIcon /> },
];

export function StartScreen({ phase, onBegin }: { phase: StartPhase; onBegin: () => void }) {
  if (phase === "atlas") return null;
  return (
    <div className={styles.start} data-leaving={phase === "leaving" ? "" : undefined}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <span>Explore</span>
          <i aria-hidden="true">•</i>
          <span>Discover</span>
          <i aria-hidden="true">•</i>
          <span>Be inspired</span>
        </p>
        <h1 className={styles.title}>
          The <span className={styles.gradient}>Universe Awaits</span>
        </h1>
        <p className={styles.line}>A journey through space, time and higher dimensions, where every star tells a story.</p>
        <button type="button" className={styles.begin} onClick={onBegin}>
          <span>Begin Your Journey</span>
          <ArrowIcon />
        </button>
      </div>

      <p className={styles.scroll} aria-hidden="true">
        <span className={styles.mouse} />
        <span>Scroll to explore</span>
      </p>

      <nav className={styles.dock} aria-label="Sections (coming soon)">
        {DOCK.map((item) => (
          <span key={item.label} className={styles.dockItem} aria-disabled="true" title={`${item.label}: coming soon`}>
            {item.icon}
            <span>{item.label}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}
