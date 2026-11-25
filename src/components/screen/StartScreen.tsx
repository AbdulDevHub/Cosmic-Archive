"use client";

import { useEffect, type CSSProperties } from "react";
import { holdMusic } from "@/lib/sound";
import { setStartCharge } from "@/scene/host/store";
import { ShipDock } from "./ShipDock";
import styles from "./start.module.css";

/*
  The start page's words (D-107, D-108, D-203): "Where Every Star Tells A Story" spaced above the
  headline, "The Universe Awaits" with its last two words in a blue-to-violet gradient, and a
  glowing button. D-208: the button is a warp core, from the owner's pick of four concepts: a pill
  with a light sweeping across it, a ring of star dots orbiting it (passing behind and in front),
  specks of starlight drawn in toward it, and on Begin a flare and streaks of light shooting off
  toward the galaxy. It always reads "Begin Your Journey"; Explore, Discover and Be Inspired turn
  under it (CSS only; calm motion holds them on Explore). Pointing at it powers up the ship's
  engines in the scene (`setStartCharge`). The button is Begin, the way in: the click that is
  allowed to start the music, and the start of the flight into the galaxy. "Scroll to explore"
  says the wheel (or a swipe) does the same.

  D-201: the flared dock is back at the bottom, as in the mockup, and holds the fleet (D-118):
  the ship that flies in this scene is chosen there. The header has the mockup's flat menu.
*/

export type StartPhase = "start" | "leaving" | "atlas";

/** Specks of starlight drawn in toward the button: where each starts (px from its middle) and when (s). */
const SPECKS: readonly [number, number, number][] = [
  [-190, -46, 0], [-150, 52, 1.1], [175, -50, 0.6], [210, 30, 1.8], [-60, -70, 2.3], [90, 66, 0.3], [250, -10, 2.9], [-230, 8, 1.5],
];

/** The ring of star dots round the button: drawn twice, its back half behind the pill and its front half before it. */
function Orbit({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${className}-dots`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9fc4ff" />
          <stop offset="0.5" stopColor="#f2ecff" />
          <stop offset="1" stopColor="#d79bff" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="60" rx="170" ry="44" transform="rotate(-8 180 60)" fill="none" stroke={`url(#${className}-dots)`} strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 8" />
    </svg>
  );
}

export function StartScreen({ phase, onBegin }: { phase: StartPhase; onBegin: () => void }) {
  // while it is up, the music waits for Begin (or the Sound button)
  const up = phase !== "atlas";
  useEffect(() => {
    if (!up) return;
    holdMusic(true);
    return () => {
      holdMusic(false);
      setStartCharge(0); // the ship stops powering up once the start page is gone
    };
  }, [up]);
  if (phase === "atlas") return null;
  return (
    <div className={styles.start} data-leaving={phase === "leaving" ? "" : undefined}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Where Every Star Tells A Story</p>
        <h1 className={styles.title}>
          The <span className={styles.gradient} data-text="Universe Awaits">Universe Awaits</span>
        </h1>
        <div className={styles.launch}>
          <button
            type="button"
            className={styles.begin}
            onClick={() => {
              setStartCharge(0);
              onBegin();
            }}
            onPointerEnter={() => setStartCharge(1)}
            onPointerLeave={() => setStartCharge(0)}
            onFocus={() => setStartCharge(1)}
            onBlur={() => setStartCharge(0)}
          >
            <Orbit className={styles.orbitBack} />
            <span className={styles.core}>
              <span>Begin Your Journey</span>
              <svg className={styles.star} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 1.5c.9 6.6 3.9 9.6 10.5 10.5-6.6.9-9.6 3.9-10.5 10.5-.9-6.6-3.9-9.6-10.5-10.5C8.1 11.1 11.1 8.1 12 1.5z" fill="currentColor" />
              </svg>
            </span>
            <Orbit className={styles.orbitFront} />
            <span className={styles.specks} aria-hidden="true">
              {SPECKS.map(([x, y, delay], i) => (
                <i key={i} style={{ "--x": `${x}px`, "--y": `${y}px`, animationDelay: `${delay}s` } as CSSProperties} />
              ))}
            </span>
            <span className={styles.streaks} aria-hidden="true">
              {[-14, -6, 0, 5, 12].map((y, i) => (
                <i key={i} style={{ top: `calc(50% + ${y}px)`, animationDelay: `${i * 40}ms` }} />
              ))}
            </span>
          </button>
          <p className={styles.words}>
            <span>Explore</span>
            <span>Discover</span>
            <span>Be Inspired</span>
          </p>
        </div>
      </div>

      <p className={styles.scroll} aria-hidden="true">
        <span className={styles.mouse} />
        <span>Scroll to explore</span>
      </p>

      <ShipDock />

    </div>
  );
}

