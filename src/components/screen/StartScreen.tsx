"use client";

import { useEffect } from "react";
import { holdMusic } from "@/lib/sound";
import { ArrowIcon, AtomIcon, BookIcon, PlanetIcon, SparkIcon } from "../icons";
import styles from "./start.module.css";

/*
  The start page's words (D-107, D-108), from the owner's Home.png: a spaced line above the
  headline, "The Universe Awaits" with its last two words in a blue-to-violet gradient, one line
  under it, and a glowing "Begin Your Journey" button. Begin is the way in: the click that is
  allowed to start the music, and the start of the flight into the galaxy. "Scroll to explore"
  says the wheel (or a swipe) does the same.

  The dock at the bottom (Science, Explore, Learn, Discover) is for pages still to come: shown,
  marked "coming soon", doing nothing yet (the owner's call).
*/

/** The dock's outline, in its own 540 by 98 box (the CSS clips the blur to the same path). */
const DOCK_PATH = "M78 1H462C488 1 498 7 508 20L530 64C543 88 532 97 508 97H32C8 97 -3 88 10 64L32 20C42 7 52 1 78 1Z";

export type StartPhase = "start" | "leaving" | "atlas";

const DOCK = [
  { label: "Science", icon: <AtomIcon /> },
  { label: "Explore", icon: <PlanetIcon /> },
  { label: "Learn", icon: <BookIcon /> },
  { label: "Discover", icon: <SparkIcon /> },
];

export function StartScreen({ phase, onBegin }: { phase: StartPhase; onBegin: () => void }) {
  // while it is up, the music waits for Begin (or the Sound button)
  const up = phase !== "atlas";
  useEffect(() => {
    if (!up) return;
    holdMusic(true);
    return () => holdMusic(false);
  }, [up]);
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
        <p className={styles.line}>
          A journey through space, time and higher dimensions —<br className={styles.wide} /> where every star tells a story.
        </p>
        <button type="button" className={styles.begin} onClick={onBegin}>
          <span>Begin Your Journey</span>
          <ArrowIcon />
        </button>
      </div>

      <p className={styles.scroll} aria-hidden="true">
        <span className={styles.mouse} />
        <span>Scroll to explore</span>
      </p>

      <nav className={styles.dock} aria-label="Sections (coming soon)" data-menu>
        <svg className={styles.ink} aria-hidden="true" focusable="false">
          <linearGradient id="dock-ink" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
            <stop offset="0" stopColor="#9cc4ff" />
            <stop offset="0.55" stopColor="#b59bff" />
            <stop offset="1" stopColor="#d58cff" />
          </linearGradient>
        </svg>
        {/* the image's flared capsule: narrower on top, its sides curving out to a wider base */}
        <svg className={styles.dockShape} viewBox="0 0 540 98" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="dock-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4372" stopOpacity="0.5" />
              <stop offset="1" stopColor="#1c1a3a" stopOpacity="0.62" />
            </linearGradient>
            <linearGradient id="dock-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b9b2ff" stopOpacity="0.45" />
              <stop offset="0.5" stopColor="#e4e0ff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#9fb8ff" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <path d={DOCK_PATH} fill="url(#dock-fill)" stroke="url(#dock-edge)" strokeWidth="1.2" />
        </svg>
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
