"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { flowPathChanged, getFlow, releaseFlow, useFlow } from "@/scene/host/flow";
import { getSceneState } from "@/scene/host/store";
import styles from "./Veil.module.css";

/*
  The veil (D-096): the colour the screen passes through between two scenes, laid over everything.
  It falls while the camera dives (or the place shrinks away), holds while the next page and its
  scene load, and lifts as the next scene arrives. If that takes a moment, a small light breathes
  in the middle: the loader.

  Mounted once in the root layout. It never stays down: a page that draws no scene (no WebGL, or
  the 404) lifts it, and so does a scene that has not drawn after a few seconds.
*/

const LOADER_AFTER_MS = 400;
const NO_SCENE_MS = 350;
const GIVE_UP_MS = 6000;

export function Veil() {
  const phase = useFlow((s) => s.phase);
  const veil = useFlow((s) => s.veil);
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // the loader shows only if the veil has been down a while
  useEffect(() => {
    if (phase !== "veiled") return;
    const show = setTimeout(() => setLoading(true), LOADER_AFTER_MS);
    const giveUp = setTimeout(releaseFlow, GIVE_UP_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
      setLoading(false);
    };
  }, [phase]);

  // The page changed. Mid-dive (Back, a header link): the move is called off. Under the veil: if
  // the new page asks for no scene, or cannot draw one, lift the veil now.
  useEffect(() => {
    flowPathChanged(pathname);
    if (getFlow().phase !== "veiled") return;
    const check = setTimeout(() => {
      const scene = getSceneState();
      if (!scene.slot || scene.quality === "static" || scene.status === "lost") releaseFlow();
    }, NO_SCENE_MS);
    return () => clearTimeout(check);
  }, [pathname]);

  const down = phase === "leaving" || phase === "veiled";
  return (
    <div className={styles.veil} data-down={down ? "" : undefined} data-active={phase !== "idle" ? "" : undefined} style={{ background: veil }} aria-hidden="true">
      {loading ? <i className={styles.loader} /> : null}
    </div>
  );
}
