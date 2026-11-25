"use client";

import { useEffect } from "react";
import { holdMusic } from "@/lib/sound";
import { ArrowIcon } from "../icons";
import { ShipDock } from "./ShipDock";
import styles from "./start.module.css";

/*
  The start page's words (D-107, D-108), from the owner's start-page-mockup.png: a spaced line above the
  headline, "The Universe Awaits" with its last two words in a blue-to-violet gradient, one line
  under it, and a glowing "Begin Your Journey" button. Begin is the way in: the click that is
  allowed to start the music, and the start of the flight into the galaxy. "Scroll to explore"
  says the wheel (or a swipe) does the same.

  D-201: the flared dock is back at the bottom, as in the mockup, and holds the fleet (D-118):
  the ship that flies in this scene is chosen there. The header has the mockup's flat menu.
*/

export type StartPhase = "start" | "leaving" | "atlas";

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

      <ShipDock />

    </div>
  );
}

