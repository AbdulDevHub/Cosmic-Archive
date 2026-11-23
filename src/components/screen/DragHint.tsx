"use client";

import { useSyncExternalStore } from "react";
import { useFlight } from "@/lib/flight";
import { hasDragged, subscribeDragged } from "./useGestures";
import styles from "./screen.module.css";

/*
  "Drag to look around" (D-102): says, once, that the scene can be dragged and zoomed. It shows
  until the visitor first drags a scene, then fades for good. The cursor (a grab hand over every
  scene) keeps saying it after that.
*/

export function DragHint({ live }: { live: boolean }) {
  const dragged = useSyncExternalStore(subscribeDragged, hasDragged, () => true);
  // a flight stands its own words where the hint would be on a phone (D-151)
  const flying = useFlight((s) => s.flight !== null);
  if (!live || flying) return null;
  return (
    <p className={styles.hint} data-gone={dragged ? "" : undefined} aria-hidden={dragged}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 12h16M4 12l3.5-3.5M4 12l3.5 3.5M20 12l-3.5-3.5M20 12l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>
        Drag to look around<span className={styles.fine}> · scroll to zoom</span>
        <span className={styles.coarse}> · pinch to zoom</span>
      </span>
    </p>
  );
}
