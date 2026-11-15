"use client";

import { getMotion, setMotion } from "@/lib/motion";
import styles from "./SiteHeader.module.css";

/**
 * Header control that pauses all motion on the site. The icon and the visible label
 * ("Pause motion" / "Play motion") follow `<html data-motion>` in CSS, so they are right
 * from the first paint. The label says what the button will do, so there is no aria-pressed.
 */
export function PauseMotion() {
  return (
    <button
      className={styles.pause}
      type="button"
      onClick={() => setMotion(getMotion() === "paused" ? "on" : "paused")}
    >
      <i aria-hidden="true" />
      <span className={styles.whenOn}>Pause motion</span>
      <span className={styles.whenPaused}>Play motion</span>
    </button>
  );
}
