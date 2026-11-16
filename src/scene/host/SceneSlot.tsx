"use client";

import { useEffect, useRef } from "react";
import styles from "./SceneSlot.module.css";
import { requestScene, setSlotVisible, withdrawScene, type SceneId, type SceneMode } from "./store";

export interface ScenePosters {
  /** Rendered at a landscape view. */
  wide: string;
  /** Rendered at a phone view; used when the viewport is taller than 5:4. */
  narrow: string;
}

interface SceneSlotProps {
  id: SceneId;
  mode: SceneMode;
  posters: ScenePosters;
}

/**
 * What a page renders to ask for a scene (ARCHITECTURE.md 3.1). Imports no three.
 *
 * Place it inside a positioned section: it fills that section to tell the host when the
 * scene is on screen, and shows the poster (server HTML, the LCP element) fixed behind the
 * page. The live canvas fades in over the poster once its first frame is drawn.
 */
export function SceneSlot({ id, mode, posters }: SceneSlotProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = requestScene(id, mode);
    const observer = new IntersectionObserver(([entry]) => setSlotVisible(token, entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      withdrawScene(token);
    };
  }, [id, mode]);

  return (
    <div ref={ref} className={styles.slot} aria-hidden="true">
      <picture>
        <source media="(max-aspect-ratio: 4/5)" srcSet={posters.narrow} />
        {/* A plain img: art direction by aspect, no client JS, and it must be in the server HTML. */}
        <img className={styles.poster} src={posters.wide} alt="" fetchPriority="high" decoding="async" />
      </picture>
    </div>
  );
}
