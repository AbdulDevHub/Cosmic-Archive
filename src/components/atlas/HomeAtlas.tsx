"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { levelCopy } from "@/lib/content/atlas";
import { clamp } from "@/lib/math";
import { SceneSlot } from "@/scene/host/SceneSlot";
import { getSceneFrame, sceneIsLive, setSceneInput, subscribeSceneFrame, useSceneState, type SceneFrame } from "@/scene/host/store";
import { BeaconList } from "./BeaconList";
import styles from "./HomeAtlas.module.css";
import { MapMargin } from "./MapMargin";
import { fade, scrollZoom, stageOpacity, unfade } from "./stages";

/*
  The homepage's one scene and one scroll (DESIGN_SPEC.md 7.2 to 7.4): the hero, the chart, the
  zoom out to the cosmic web.

  Without the scene (no script, no WebGL, or not loaded yet) this is three plain sections, one
  under the other, each with its words and its destinations as a list of links.

  Once the scene is drawn (`live`), the same three sections are laid over one another on a sticky
  stage inside a tall track. Scroll position sets the zoom; the zoom the scene actually drew sets
  which section shows. The page never takes control of scrolling.
*/

const POSTERS = {
  wide: "/posters/atlas-hero-wide.webp",
  narrow: "/posters/atlas-hero-narrow.webp",
};

const CHART = levelCopy(1);
const WEB = levelCopy(2);

export function HomeAtlas() {
  const track = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const chart = useRef<HTMLElement>(null);
  const web = useRef<HTMLElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const live = useSceneState(sceneIsLive);

  // Scroll drives the zoom, never the other way round.
  useEffect(() => {
    const update = () => {
      const element = track.current;
      if (!element) return;
      const span = element.offsetHeight - window.innerHeight;
      const progress = span > 0 ? clamp(-element.getBoundingClientRect().top / span, 0, 1) : 0;
      setSceneInput({ zoom: scrollZoom(progress) });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [live]); // the track is taller once the stage is live

  // The zoom the scene drew decides which stage's words and beacons show.
  useEffect(() => {
    if (!live) return;
    const faded = [hero, chart, web, hint, caption];
    const apply = (frame: SceneFrame) => {
      const [o0, o1, o2] = stageOpacity(frame.zoom);
      fade(hero.current, o0);
      fade(chart.current, o1);
      fade(web.current, o2);
      fade(hint.current, o0);
      fade(caption.current, 1 - o2); // the margin takes the caption's place
    };
    const frame = getSceneFrame();
    if (frame) apply(frame);
    const unsubscribe = subscribeSceneFrame(apply);
    return () => {
      unsubscribe();
      for (const ref of faded) unfade(ref.current);
    };
  }, [live]);

  return (
    <div ref={track} className={styles.track} data-live={live ? "" : undefined} data-clear-header>
      <SceneSlot id="atlas" mode="scroll" posters={POSTERS} />
      <a className="skip-link" href="#destinations">
        Skip to destinations
      </a>
      {/* where a link to a stage lands: the scroll position at which that stage is at rest */}
      <span id={CHART.id} className={`${styles.mark} ${styles.markChart}`} />
      <span id={WEB.id} className={`${styles.mark} ${styles.markWeb}`} />

      <section ref={hero} className={`${styles.panel} ${styles.hero}`} aria-labelledby="hero-title">
        <div className={styles.copy} data-calm>
          <h1 id="hero-title">Explore the extraordinary.</h1>
          <p>A living atlas of the universe, from the worlds around us to its deepest mysteries.</p>
          <div className={styles.actions}>
            <Link className={styles.go} href="/explore">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle className={styles.ticks} cx="32" cy="32" r="28" />
                <circle className={styles.dial} cx="32" cy="32" r="22" />
                <path className={styles.arrow} d="M24 32H40M34 26l6 6-6 6" />
                <circle className={styles.sat} cx="32" cy="10" r="2.4" />
              </svg>
              <span className={styles.word}>Begin exploring</span>
            </Link>
            {/* points at /about until /archive exists (O1) */}
            <Link className={styles.index} href="/about">
              <i aria-hidden="true" />
              <span>Browse the archive</span>
            </Link>
          </div>
        </div>
      </section>

      <section ref={chart} className={`${styles.panel} ${styles.chart}`} aria-labelledby="chart-title">
        <div className={styles.copy} data-calm>
          <h2 id="chart-title">{CHART.heading}</h2>
          <p>{CHART.text}</p>
          <BeaconList level={1} live={live} />
        </div>
      </section>

      <section ref={web} className={`${styles.panel} ${styles.web}`} aria-labelledby="web-title">
        <div className={styles.words} data-calm>
          <h2 id="web-title">{WEB.heading}</h2>
          <p>{WEB.text}</p>
          <BeaconList level={2} live={live} />
        </div>
        <div data-calm="band">
          <MapMargin />
        </div>
      </section>

      <div className={styles.furniture}>
        <p ref={hint} className={styles.hint}>
          Scroll to pull back
        </p>
        <p ref={caption} className={styles.caption} data-calm>
          Illustration, not to scale
        </p>
      </div>
    </div>
  );
}
