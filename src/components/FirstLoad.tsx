"use client";

import { useEffect, useState } from "react";
import { getSceneState } from "@/scene/host/store";
import { sceneParams } from "@/scene/host/params";
import { useShip } from "@/lib/ship";
import { LoaderShip } from "./LoaderShip";
import styles from "./FirstLoad.module.css";

/*
  The first-load screen (D-112): on the very first page of a visit, the poster, the fonts and the
  live scene arrive a moment apart, and the page visibly changes as each one lands. This covers
  them with the visitor's own ship cruising at warp (D-123) and the wordmark until all have
  settled, then fades away once. It is in the
  root layout, so moving between pages never shows it again.

  It never traps anyone: it lets clicks through, gives up after a few seconds, and without
  JavaScript a <noscript> style hides it. Stills for screenshots (`?shot=1`) skip it.
*/

const SETTLE_MS = 450; // the canvas fades in over the poster after its first frame
const NO_SCENE_MS = 900; // a page that asks for no scene by then has none
const GIVE_UP_MS = 6000;
const FADE_MS = 700;

function sceneSettled(start: number): boolean {
  const flag = document.documentElement.dataset.scene;
  if (flag === "ready" || flag === "static") return true;
  const scene = getSceneState();
  if (scene.status === "lost") return true;
  return !scene.slot && performance.now() - start > NO_SCENE_MS;
}

/** Stars streaking past at warp: where each runs (% from the top), when it starts, how long it is. */
const STREAKS: readonly [number, number, number][] = [
  [12, 0, 90], [22, 0.5, 140], [31, 0.2, 60], [38, 0.9, 110], [44, 0.35, 70], [53, 0.7, 160],
  [61, 0.1, 80], [68, 0.6, 120], [76, 0.25, 100], [84, 0.8, 70], [90, 0.45, 130], [17, 1.1, 60],
];

export function FirstLoad() {
  const [phase, setPhase] = useState<"on" | "fading" | "gone">("on");
  const ship = useShip();

  useEffect(() => {
    const shot = sceneParams().shot;
    const start = performance.now();
    let fontsReady = false;
    void document.fonts?.ready.then(() => {
      fontsReady = true;
    });
    let sceneAt = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      clearInterval(poll);
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPhase(calm ? "gone" : "fading");
      if (!calm) timers.push(setTimeout(() => setPhase("gone"), FADE_MS));
    };
    const poll = setInterval(() => {
      if (shot) {
        clearInterval(poll);
        setPhase("gone");
        return;
      }
      const now = performance.now();
      if (!sceneAt && sceneSettled(start)) sceneAt = now;
      const settled = fontsReady && sceneAt && now - sceneAt >= SETTLE_MS;
      if (settled || now - start > GIVE_UP_MS) finish();
    }, 80);
    return () => {
      clearInterval(poll);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={styles.cover} data-first-load data-fading={phase === "fading" ? "" : undefined} aria-hidden="true">
      <noscript>
        <style>{"[data-first-load]{display:none}"}</style>
      </noscript>
      <div className={styles.warp}>
        {STREAKS.map(([top, delay, length], i) => (
          <span key={i} style={{ top: `${top}%`, animationDelay: `${delay}s`, width: `${length}px` }} />
        ))}
      </div>
      <div className={styles.ship}>
        <LoaderShip ship={ship} />
      </div>
      <p className={styles.word}>Cosmic Archive</p>
      <span className={styles.line} />
    </div>
  );
}
