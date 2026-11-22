"use client";

import { useEffect } from "react";
import { SHIPS, setShip, useShip } from "@/lib/ship";
import { holdMusic } from "@/lib/sound";
import { ArrowIcon } from "../icons";
import styles from "./start.module.css";

/*
  The start page's words (D-107, D-108), from the owner's Home.png: a spaced line above the
  headline, "The Universe Awaits" with its last two words in a blue-to-violet gradient, one line
  under it, and a glowing "Begin Your Journey" button. Begin is the way in: the click that is
  allowed to start the music, and the start of the flight into the galaxy. "Scroll to explore"
  says the wheel (or a swipe) does the same.

  The menu that was the dock at the bottom now hangs in the header (D-116). In its place, the
  fleet (D-118): five classes of ship to choose from; the one chosen flies in the scene and is
  remembered.
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

      <Fleet />

    </div>
  );
}

/** The fleet (D-118): choose the ship that carries you. */
function Fleet() {
  const chosen = useShip();
  return (
    <div className={styles.fleet} role="radiogroup" aria-label="Choose your vessel" data-menu>
      <span className={styles.fleetLabel}>Choose Your Vessel</span>
      {SHIPS.map((ship) => (
        <button key={ship.id} type="button" role="radio" aria-checked={chosen === ship.id} className={styles.vessel} title={ship.role} onClick={() => setShip(ship.id)}>
          {ship.name}
        </button>
      ))}
    </div>
  );
}
