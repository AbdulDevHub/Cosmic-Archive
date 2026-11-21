"use client";

import { useEffect, useState } from "react";
import { getSceneState } from "@/scene/host/store";
import { sceneParams } from "@/scene/host/params";
import { Emblem } from "./icons";
import styles from "./FirstLoad.module.css";

/*
  The first-load screen (D-112): on the very first page of a visit, the poster, the fonts and the
  live scene arrive a moment apart, and the page visibly changes as each one lands. This covers
  them with the emblem and the wordmark until all have settled, then fades away once. It is in the
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

export function FirstLoad() {
  const [phase, setPhase] = useState<"on" | "fading" | "gone">("on");

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
      <div className={styles.mark}>
        <span className={styles.halo} />
        <Emblem size={84} />
      </div>
      <p className={styles.word}>Cosmic Archive</p>
      <span className={styles.line} />
    </div>
  );
}
