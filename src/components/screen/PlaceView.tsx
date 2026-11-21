"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { flowBusy, pullOut } from "@/scene/host/flow";
import { SceneSlot } from "@/scene/host/SceneSlot";
import { sceneIsLive, useSceneState, type SceneId } from "@/scene/host/store";
import styles from "./screen.module.css";

/*
  One place (DESIGN_SPEC.md 7, D-092): its scene fills the window, with its name and one line.
  "Further" (or Escape, or the wheel pulled back) shrinks it away and returns to the atlas, dived
  into the place's light, which then pulls back to the stop it was found at (the flow, D-096).

  Without the scene it is the poster, the same words, and "Further" as a plain link home.
*/

export interface PlaceWords {
  name: string;
  line: string;
  scene: SceneId;
  anchor: string;
  stop: number;
  /** Where "Further" goes: the galaxy, or the web. */
  outTo: string;
}

const WHEEL_OUT = 260; // pixels of wheel pulled back before the place is left
const ATLAS_VEIL = "#090a1c"; // --space: the atlas's own darkness

export function PlaceView({ place }: { place: PlaceWords }) {
  const stage = useRef<HTMLDivElement>(null);
  const live = useSceneState(sceneIsLive);
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const posters = { wide: `/posters/${place.scene}-wide.webp`, narrow: `/posters/${place.scene}-narrow.webp` };

  const leave = () => {
    if (flowBusy()) return;
    pullOut((href) => routerRef.current.push(href), "/", place.anchor, place.stop, ATLAS_VEIL);
  };
  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });

  useEffect(() => {
    const element = stage.current;
    if (!live || !element) return;
    let pulled = 0;
    let rest: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const pixels = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY;
      pulled = Math.max(0, pulled + pixels);
      clearTimeout(rest);
      rest = setTimeout(() => (pulled = 0), 400); // a pause in the wheel starts the count again
      if (pulled > WHEEL_OUT) {
        pulled = 0;
        leaveRef.current();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key !== "Escape" && event.key !== "-" && event.key !== "_") return;
      event.preventDefault();
      leaveRef.current();
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(rest);
      element.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
    };
  }, [live]);

  return (
    <div ref={stage} className={styles.screen} data-live={live ? "" : undefined}>
      <SceneSlot id={place.scene} mode="place" posters={posters} />
      <div className={styles.caption}>
        <h1>{place.name}</h1>
        <p>{place.line}</p>
      </div>
      <div className={styles.controls}>
        <a
          className={styles.control}
          href={place.outTo}
          onClick={(event) => {
            if (!live || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            leave();
          }}
        >
          <i className={`${styles.icon} ${styles.further}`} aria-hidden="true" />
          <span>Further</span>
        </a>
      </div>
    </div>
  );
}
