"use client";

import Link from "next/link";
import { useRef } from "react";
import { destinationsAt, EVIDENCE_WORD, type AtlasAnchor, type AtlasLevel } from "@/lib/content/atlas";
import type { SceneFrame } from "@/scene/host/store";
import styles from "./atlas.module.css";
import { EvidenceRing } from "./Evidence";
import { stageOpacity } from "./stages";
import { useCanvasLabels, type LabelRule } from "./useCanvasLabels";

/*
  The beacons of one level of the atlas (DESIGN_SPEC.md 5 and 9, ARCHITECTURE.md 4).

  They are real links in a real list, in the server HTML. That list is what a visitor gets with
  no scene: a plain column of destinations. Once the scene is drawn (`live`), the same links are
  lifted out of the column and pinned to their places on the canvas, each with a leader line to
  its label. Nothing here is drawn by WebGL, so every beacon is focusable and clickable.
*/

/**
 * Where each label would like to hang, relative to its beacon: the approved prototype's
 * compositions for wide and for phone screens. `radius` offsets are fractions of the chart ring's
 * width on screen, so they follow the galaxy as it is zoomed; `px` offsets are short fixed leaders.
 */
const PREFER: Record<AtlasAnchor, LabelRule> = {
  core: { unit: "radius", wide: [0.512, 0.386], narrow: [0.077, 0.98] },
  arm: { unit: "radius", wide: [-0.139, 0.269], narrow: [0.044, 0.507] },
  ring: { unit: "px", wide: [-52, 0], narrow: [-24, 0] },
  // its label turns inward once the beacon is this far across the screen (wide, narrow)
  quasar: { unit: "px", wide: [52, 0], narrow: [24, 0], flipPast: [0.62, 0.45] },
  home: { unit: "px", wide: [-52, 0], narrow: [-24, 0] },
};

/** A level's beacons show while its stage does. */
const SHOWING: Record<AtlasLevel, (frame: SceneFrame) => boolean> = {
  1: (frame) => stageOpacity(frame.zoom)[1] > 0.02,
  2: (frame) => stageOpacity(frame.zoom)[2] > 0.02,
};

interface BeaconListProps {
  level: AtlasLevel;
  /** True once the scene is drawn: the links leave the list and stand on the canvas. */
  live: boolean;
}

export function BeaconList({ level, live }: BeaconListProps) {
  const ref = useRef<HTMLUListElement>(null);
  useCanvasLabels(ref, live, PREFER, SHOWING[level]);

  return (
    <ul ref={ref} className={styles.beacons} data-live={live ? "" : undefined}>
      {destinationsAt(level).map((destination) => (
        <li key={destination.id}>
          <Link className={styles.beacon} href={destination.href} data-anchor={destination.anchor}>
            <EvidenceRing evidence={destination.evidence} />
            <span className={styles.lead} data-lead aria-hidden="true" />
            <span className={styles.label} data-label>
              {destination.label}
              <span className={styles.note}>{destination.note}</span>
              <span className={styles.status}>{EVIDENCE_WORD[destination.evidence]}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
